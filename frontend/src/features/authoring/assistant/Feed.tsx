import {
  CheckIcon,
  CircleSlashIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import RichText from "./RichText";
import type { Block, FeedItem, ToolRow, Turn } from "./store";

// The conversation: what the author said, what the assistant said, and a
// collapsible log of the tools it used to do it.

const TOOL_ICONS = {
  running: <LoaderCircleIcon size={13} className="animate-spin" />,
  ok: <CheckIcon size={13} className="text-success" />,
  error: <XIcon size={13} className="text-error" />,
  declined: <CircleSlashIcon size={13} className="text-warning" />,
};

function ToolLine({ tool }: { tool: ToolRow }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <span className="mt-0.5 flex-none" aria-hidden>
        {TOOL_ICONS[tool.status]}
      </span>
      <div className="min-w-0 flex-1">
        <span className="font-mono text-base-content/70">{tool.name}</span>
        {tool.summary && (
          <span className="ml-1.5 break-words text-base-content/60">
            {tool.summary}
          </span>
        )}
        {tool.warnings?.map((warning, i) => (
          <div key={i} className="mt-0.5 flex gap-1 text-warning">
            <TriangleAlertIcon size={11} className="mt-0.5 flex-none" />
            <span className="break-words">{warning}</span>
          </div>
        ))}
      </div>
    </li>
  );
}

/** A run of tool calls as one collapsible log. */
function Activity({ tools, live }: { tools: ToolRow[]; live: boolean }) {
  const failed = tools.filter((tool) => tool.status === "error").length;
  const running = tools.some((tool) => tool.status === "running");

  return (
    // open while it's happening, folded away once it's done
    <details
      open={live || undefined}
      className="rounded-sm bg-base-300/60 px-3 py-2"
    >
      <summary className="flex cursor-pointer select-none items-center gap-2 text-xs text-base-content/70">
        {running && <LoaderCircleIcon size={12} className="animate-spin" />}
        <span>
          {tools.length} {tools.length === 1 ? "step" : "steps"}
        </span>
        {failed > 0 && (
          <span className="text-error">· {failed} didn&apos;t work</span>
        )}
      </summary>
      <ul className="mt-2 flex flex-col gap-1.5">
        {tools.map((tool) => (
          <ToolLine key={tool.id} tool={tool} />
        ))}
      </ul>
    </details>
  );
}

/** Text stays as it is; neighbouring tool calls are grouped. */
function Blocks({ blocks, live }: { blocks: Block[]; live: boolean }) {
  const groups: ReactNode[] = [];
  let run: ToolRow[] = [];

  const flush = () => {
    if (!run.length) return;
    groups.push(
      <Activity key={`tools-${groups.length}`} tools={run} live={live} />
    );
    run = [];
  };

  blocks.forEach((block, i) => {
    if (block.kind === "tool") {
      run.push(block.tool);
      return;
    }
    flush();
    groups.push(<RichText key={`text-${i}`} text={block.text} />);
  });
  flush();

  return <>{groups}</>;
}

function TurnView({ turn }: { turn: Turn }) {
  const running = turn.status === "running";

  return (
    <div className="flex flex-col gap-2">
      <div className="ml-8 whitespace-pre-wrap break-words rounded-sm bg-base-300 px-3 py-2 text-sm">
        {turn.user}
      </div>

      <Blocks blocks={turn.blocks} live={running} />

      {running && !turn.blocks.length && (
        <span
          className="loading loading-dots loading-sm text-base-content/50"
          role="status"
          aria-label="The assistant is thinking"
        />
      )}
      {turn.status === "stopped" && (
        <p className="text-xs text-base-content/60">Stopped.</p>
      )}
      {turn.status === "step_limit" && (
        <p className="text-xs text-base-content/60">
          Stopped after 15 steps. Say &quot;continue&quot; to carry on.
        </p>
      )}
      {turn.status === "error" && (
        <div
          role="alert"
          className="alert alert-error alert-soft text-sm text-base-content"
        >
          <span className="break-words">{turn.error}</span>
        </div>
      )}
      {turn.status === "done" && !turn.blocks.length && (
        <p className="text-xs text-base-content/60">
          The assistant didn&apos;t reply. Try asking again, or in other words.
        </p>
      )}
    </div>
  );
}

export default function Feed({ items }: { items: FeedItem[] }) {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversation with the assistant"
      className="flex flex-col gap-4"
    >
      {items.map((item) =>
        item.kind === "turn" ? (
          <TurnView key={`turn-${item.turn.id}`} turn={item.turn} />
        ) : (
          <p
            key={`note-${item.id}`}
            className={`flex items-start gap-2 text-xs ${
              item.level === "warning" ? "text-warning" : "text-base-content/60"
            }`}
          >
            {item.level === "warning" ? (
              <TriangleAlertIcon size={13} className="mt-0.5 flex-none" />
            ) : (
              <InfoIcon size={13} className="mt-0.5 flex-none" />
            )}
            <span className="break-words">{item.text}</span>
          </p>
        )
      )}
    </div>
  );
}
