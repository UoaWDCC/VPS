import {
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  PlayIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import { componentLabel, describeOperation, formatValue } from "./describe";

const KINDS = {
  scene: { label: "scene", className: "badge-neutral" },
  press: { label: "press", className: "badge-primary" },
  state: { label: "state", className: "badge-accent" },
  timer: { label: "timer", className: "badge-secondary" },
  link: { label: "link", className: "badge-neutral" },
  reset: { label: "reset", className: "badge-success" },
  jump: { label: "jump", className: "badge-neutral" },
  sync: { label: "sync", className: "badge-info" },
  warn: { label: "warn", className: "badge-warning" },
  error: { label: "error", className: "badge-error" },
};

const LEVELS = {
  error: { Icon: CircleXIcon, className: "text-error" },
  warning: { Icon: TriangleAlertIcon, className: "text-warning" },
  info: { Icon: InfoIcon, className: "text-info" },
};

const VISIBLE_ENTRIES = 15;

function elapsed(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function Section({ title, count, children }) {
  return (
    <details open className="border-b border-base-content/10 px-3 py-2">
      <summary className="flex cursor-pointer select-none items-center justify-between py-1 text-xs font-semibold text-base-content/70">
        <span>{title}</span>
        {count != null && <span className="badge badge-sm">{count}</span>}
      </summary>
      <div className="pt-1">{children}</div>
    </details>
  );
}

function ControlsSection({
  scene,
  scenes,
  busy,
  onResetAll,
  onResetProperties,
  onRestartTimer,
  onJump,
}) {
  return (
    <Section title="Reset and jump">
      <div className="flex flex-wrap gap-1.5">
        <button
          className="btn btn-xs"
          disabled={busy}
          onClick={onResetAll}
          title="Back to the first scene, with default properties and a fresh timer"
        >
          Reset everything
        </button>
        <button
          className="btn btn-xs"
          disabled={busy}
          onClick={onResetProperties}
          title="Put every property back to its default, and stay in this scene"
        >
          Reset properties
        </button>
        <button
          className="btn btn-xs"
          disabled={busy || !scene.time}
          onClick={onRestartTimer}
          title={
            scene.time
              ? "Start this scene's timer again from the top"
              : "This scene has no timer"
          }
        >
          Restart timer
        </button>
      </div>

      <select
        className="select select-xs mt-2 w-full"
        aria-label="Jump to scene"
        value=""
        disabled={busy || scenes.length === 0}
        onChange={(event) => event.target.value && onJump(event.target.value)}
      >
        <option value="">Jump to scene…</option>
        {scenes.map((target, index) => (
          <option
            key={target._id}
            value={target._id}
            disabled={target._id === scene._id}
          >
            {index + 1}. {target.name}
            {target._id === scene._id ? " (you are here)" : ""}
          </option>
        ))}
      </select>
      <p className="mt-1 text-[11px] text-base-content/50">
        Jumping keeps your properties and starts that scene&apos;s timer over.
      </p>
    </Section>
  );
}

function PropertiesSection({ properties, changed }) {
  if (!properties.length) {
    return (
      <Section title="Properties">
        <p className="text-xs text-base-content/60">
          This scenario has no properties.
        </p>
      </Section>
    );
  }

  return (
    <Section title="Properties" count={properties.length}>
      <ul>
        {properties.map((property) => {
          const wasChanged = property.id in changed;
          return (
            <li
              key={property.id}
              className={`flex items-center gap-2 rounded px-1 py-0.5 ${
                wasChanged ? "bg-warning/25" : ""
              }`}
            >
              <span
                className="min-w-0 flex-1 truncate font-mono text-xs"
                title={property.name}
              >
                {property.name}
              </span>
              <span className="text-[11px] text-base-content/50">
                {property.type}
              </span>
              <span className="font-mono text-xs font-semibold">
                {formatValue(property.value)}
              </span>
              {wasChanged && (
                <span className="font-mono text-[11px] text-base-content/70">
                  was {formatValue(changed[property.id])}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function EventLogSection({ entries, startedAt, onClear }) {
  return (
    <Section title="Event log" count={entries.length}>
      {entries.length === 0 ? (
        <p className="text-xs text-base-content/60">
          Nothing yet. Press a button in the scene.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-1.5">
            {entries.slice(0, VISIBLE_ENTRIES).map((entry) => {
              const kind = KINDS[entry.kind] ?? KINDS.scene;
              return (
                <li key={entry.id} className="flex items-start gap-2 text-xs">
                  <span className="w-9 flex-none pt-px font-mono text-[11px] text-base-content/50">
                    {elapsed(entry.at - startedAt)}
                  </span>
                  <span
                    className={`badge badge-soft badge-xs mt-0.5 flex-none ${kind.className}`}
                  >
                    {kind.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div>{entry.title}</div>
                    {entry.lines.map((line, index) => (
                      <div
                        key={index}
                        className="break-words font-mono text-[11px] text-base-content/60"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          {entries.length > VISIBLE_ENTRIES && (
            <p className="mt-1 text-[11px] text-base-content/50">
              Showing the latest {VISIBLE_ENTRIES} of {entries.length}.
            </p>
          )}
          <button className="btn btn-ghost btn-xs mt-1" onClick={onClear}>
            Clear log
          </button>
        </>
      )}
    </Section>
  );
}

function SceneSection({ scene, properties, getScene, onRun }) {
  const actions = Object.values(scene.components ?? {}).filter(
    (component) =>
      component.clickable &&
      (component.nextScene || component.stateOperations?.length)
  );
  const timerOperations = scene.timerStateOperations ?? [];
  const directLink = scene.directLink
    ? (getScene(scene.directLink)?.name ?? "set")
    : "none";

  return (
    <Section title={`This scene: ${scene.name ?? "unnamed"}`}>
      <dl className="mb-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
        <dt className="text-base-content/60">Timer</dt>
        <dd>{scene.time ? `${scene.time}s` : "none"}</dd>
        <dt className="text-base-content/60">Direct link</dt>
        <dd>{directLink}</dd>
      </dl>

      {actions.length === 0 ? (
        <p className="text-xs text-base-content/60">
          No buttons in this scene.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {actions.map((component) => {
            const next = component.nextScene
              ? getScene(component.nextScene)
              : null;
            return (
              <li key={component.id} className="flex items-start gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {componentLabel(component)}
                    {component.nextScene &&
                      (next ? (
                        <span className="font-normal text-base-content/60">
                          {" "}
                          → {next.name ?? "next scene"}
                        </span>
                      ) : scene.neighborsLoaded ? (
                        <span className="font-normal text-error">
                          {" "}
                          → missing scene
                        </span>
                      ) : (
                        <span className="font-normal text-base-content/60">
                          {" "}
                          → loading…
                        </span>
                      ))}
                  </div>
                  {(component.stateOperations ?? []).map((operation, index) => (
                    <div
                      key={index}
                      className="break-words font-mono text-[11px] text-base-content/60"
                    >
                      {describeOperation(operation, properties)}
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-xs"
                  onClick={() => onRun(component)}
                  aria-label={`Run ${componentLabel(component)}`}
                >
                  <PlayIcon size={12} />
                  Run
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {timerOperations.length > 0 && (
        <div className="mt-2 text-xs">
          <div className="font-semibold">When the timer ends</div>
          {timerOperations.map((operation, index) => (
            <div
              key={index}
              className="break-words font-mono text-[11px] text-base-content/60"
            >
              {describeOperation(operation, properties)}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ChecksSection({ problems }) {
  return (
    <Section title="Checks" count={problems.length}>
      {problems.length === 0 ? (
        <p className="flex items-center gap-2 text-xs text-base-content/70">
          <CircleCheckIcon size={14} className="flex-none text-success" />
          No problems found in this scene.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {problems.map((problem, index) => {
            const { Icon, className } = LEVELS[problem.level];
            return (
              <li key={index} className="flex items-start gap-2 text-xs">
                <Icon size={14} className={`mt-px flex-none ${className}`} />
                <span>{problem.message}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/**
 * Author-only panel, docked beside the scene, for debugging a scenario while
 * playing it: live property values, a log of what happened, what this scene's
 * buttons do, and checks for mistakes that would otherwise fail silently.
 *
 * @component
 */
export default function DebugPanel({
  open,
  onClose,
  scene,
  properties,
  propertyVersion,
  session,
  getScene,
  onRun,
  scenes,
  busy,
  onResetAll,
  onResetProperties,
  onRestartTimer,
  onJump,
}) {
  if (!open || !scene) return null;

  const { entries, changed, problems, problemCount, startedAt, clear } =
    session;

  return (
    <aside
      data-debug-panel
      aria-label="Debug panel"
      className="flex h-full w-96 max-w-[45vw] flex-none flex-col overflow-hidden border-l border-base-content/15 bg-base-100 font-ibm"
    >
      <header className="flex items-center gap-2 border-b border-base-content/15 px-3 py-2">
        <span className="text-sm font-semibold">Debug</span>
        <span className="badge badge-soft badge-primary badge-sm">
          Author only
        </span>
        {problemCount > 0 && (
          <span className="badge badge-soft badge-warning badge-sm">
            {problemCount} {problemCount === 1 ? "problem" : "problems"}
          </span>
        )}
        <span className="ml-auto font-mono text-[11px] text-base-content/50">
          v{propertyVersion}
        </span>
        <button
          className="btn btn-ghost btn-xs btn-square"
          onClick={onClose}
          aria-label="Close debug panel"
        >
          <XIcon size={14} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <ControlsSection
          scene={scene}
          scenes={scenes}
          busy={busy}
          onResetAll={onResetAll}
          onResetProperties={onResetProperties}
          onRestartTimer={onRestartTimer}
          onJump={onJump}
        />
        <PropertiesSection properties={properties} changed={changed} />
        <EventLogSection
          entries={entries}
          startedAt={startedAt}
          onClear={clear}
        />
        <SceneSection
          scene={scene}
          properties={properties}
          getScene={getScene}
          onRun={onRun}
        />
        <ChecksSection problems={problems} />
      </div>
    </aside>
  );
}
