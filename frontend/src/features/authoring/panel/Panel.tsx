import { useLayoutEffect, useRef, useState } from "react";
import {
  BoxIcon,
  BracesIcon,
  HeadphonesIcon,
  MonitorCog,
  SplitIcon,
} from "lucide-react";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";
import PanelIcon from "./PanelIcon";
import SceneDetailsPanel from "./SceneDetailsPanel";
import ElementPropertiesPanel from "./ElementPropertiesPanel";
import AudioPanel from "./audio/AudioPanel";
import PropertyBindingsPanel from "./PropertyBindingsPanel";
import PanelFrame from "./PanelFrame";
import ActionsPanel from "./actions/ActionsPanel";
import { cn } from "../../../util/classnames";

const ALWAYS_PANELS = [
  { key: "scene", label: "Scene Details", Icon: MonitorCog },
  { key: "audio", label: "Audio Elements", Icon: HeadphonesIcon },
  { key: "actions", label: "Actions", Icon: SplitIcon },
] as const;

const CONTEXTUAL_PANELS = [
  { key: "bindings", label: "Property Bindings", Icon: BracesIcon },
  { key: "object-properties", label: "Element Properties", Icon: BoxIcon },
] as const;

type PanelKey =
  | (typeof ALWAYS_PANELS)[number]["key"]
  | (typeof CONTEXTUAL_PANELS)[number]["key"];

const PANEL_LABELS = Object.fromEntries(
  [...ALWAYS_PANELS, ...CONTEXTUAL_PANELS].map(({ key, label }) => [key, label])
) as Record<PanelKey, string>;

const CONTEXTUAL_PANEL_KEYS = new Set<PanelKey>(
  CONTEXTUAL_PANELS.map((p) => p.key)
);

/**
 * This component displays the properties of scene components in a sidebar
 * @component
 */
export default function Panel() {
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const iconStackRef = useRef<HTMLDivElement>(null);
  const contextualIconsRef = useRef<HTMLDivElement>(null);
  const previousStackTopRef = useRef<number | null>(null);
  const previousSelectionPresenceRef = useRef<boolean | null>(null);
  const selected = useEditorStore((state) => state.selected);
  const component = useVisualScene((state) =>
    selected.length === 1 ? (state.components[selected[0]] ?? null) : null
  );

  function togglePanel(panel: PanelKey) {
    setActivePanel((current) => (current === panel ? null : panel));
  }

  // fall back to the scene details panel
  useLayoutEffect(() => {
    if (!component && activePanel && CONTEXTUAL_PANEL_KEYS.has(activePanel)) {
      setActivePanel("scene");
    }
  }, [component, activePanel]);

  // FLIP: when the contextual icons appear/disappear, the icon stack
  // recenters vertically. Compensate by animating from its old position.
  useLayoutEffect(() => {
    const iconStack = iconStackRef.current;
    if (!iconStack) return;

    const hasSelection = Boolean(component);
    const currentTop = iconStack.getBoundingClientRect().top;
    const previousTop = previousStackTopRef.current;
    const presenceChanged =
      previousSelectionPresenceRef.current !== null &&
      previousSelectionPresenceRef.current !== hasSelection;

    previousStackTopRef.current = currentTop;
    previousSelectionPresenceRef.current = hasSelection;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (
      reduceMotion ||
      !presenceChanged ||
      previousTop === null ||
      previousTop === currentTop
    )
      return;

    iconStack.animate(
      [
        { transform: `translateY(${previousTop - currentTop}px)` },
        { transform: "translateY(0)" },
      ],
      { duration: 150, easing: "ease-out" }
    );

    if (hasSelection) {
      contextualIconsRef.current?.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 150, easing: "ease-out" }
      );
    }
  }, [selected, component?.clickable, activePanel]);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end gap-3 overflow-hidden pb-m transition-[width] duration-150 ease-out motion-reduce:transition-none",
        activePanel ? "w-[calc(24rem_+_4.25rem)]" : "w-14"
      )}
    >
      <PanelFrame
        label={activePanel ? PANEL_LABELS[activePanel] : undefined}
        open={Boolean(activePanel)}
        onClose={() => setActivePanel(null)}
      >
        {activePanel === "scene" && <SceneDetailsPanel />}
        {activePanel === "audio" && <AudioPanel />}
        {activePanel === "actions" && <ActionsPanel />}
        {activePanel === "bindings" && (
          <PropertyBindingsPanel component={component} />
        )}
        {activePanel === "object-properties" && (
          <ElementPropertiesPanel component={component} />
        )}
      </PanelFrame>
      <div ref={iconStackRef} className="flex shrink-0 flex-col gap-3">
        {ALWAYS_PANELS.map(({ key, label, Icon }) => (
          <PanelIcon
            key={key}
            label={label}
            Icon={Icon}
            active={activePanel === key}
            onClick={() => togglePanel(key)}
          />
        ))}
        {component && (
          <div ref={contextualIconsRef} className="flex flex-col gap-3">
            {CONTEXTUAL_PANELS.map(({ key, label, Icon }) => (
              <PanelIcon
                key={key}
                label={label}
                Icon={Icon}
                active={activePanel === key}
                onClick={() => togglePanel(key)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
