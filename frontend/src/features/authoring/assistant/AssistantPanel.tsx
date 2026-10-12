import { SendIcon, SquareIcon } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { newConversation, send, stop } from "./controller";
import Feed from "./Feed";
import { PANEL_MODES } from "./modes";
import { ConfirmCard, PlanCard } from "./PlanCard";
import useAssistant from "./store";
import type { PanelMode } from "./types";

const EXAMPLES: Record<PanelMode, string[]> = {
  ask: [
    "What does this scene do?",
    "Check the scenario for problems",
    "Which buttons lead to other scenes?",
  ],
  plan: [
    "Add a title and three answer buttons",
    "Make this scene's buttons the same size",
  ],
  build: [
    "Add a Continue button at the bottom right",
    "Line up and space out the buttons evenly",
  ],
};

const PLACEHOLDERS: Record<PanelMode, string> = {
  ask: "Ask about this scenario…",
  plan: "Describe what you'd like to change…",
  build: "Tell me what to build…",
};

function ModeTabs() {
  const mode = useAssistant((state) => state.mode);
  const running = useAssistant((state) => state.running);
  const setMode = useAssistant((state) => state.setMode);

  return (
    <div>
      <div className="join w-full" role="group" aria-label="Mode">
        {PANEL_MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`btn btn-sm join-item flex-1 ${
              mode === id ? "btn-active" : ""
            }`}
            aria-pressed={mode === id}
            disabled={running}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-base-content/60">
        {PANEL_MODES.find((m) => m.id === mode)?.hint}
      </p>
    </div>
  );
}

function Composer() {
  const mode = useAssistant((state) => state.mode);
  const running = useAssistant((state) => state.running);
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim() || running) return;
    void send(text);
    setText("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter is a new line
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="textarea w-full resize-none text-sm"
        rows={3}
        value={text}
        placeholder={PLACEHOLDERS[mode]}
        aria-label="Message to the assistant"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {running ? (
        <button
          type="button"
          className="btn btn-error btn-sm self-end"
          onClick={stop}
        >
          <SquareIcon size={13} />
          Stop
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-sm self-end"
          disabled={!text.trim()}
          onClick={submit}
        >
          <SendIcon size={13} />
          Send
        </button>
      )}
      {/* examples fill the box, so a new author sees what to write */}
      {!text && !running && <ExampleChips onPick={setText} />}
    </div>
  );
}

function ExampleChips({ onPick }: { onPick: (text: string) => void }) {
  const mode = useAssistant((state) => state.mode);
  const empty = useAssistant((state) => state.feed.length === 0);
  if (!empty) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {EXAMPLES[mode].map((example) => (
        <button
          key={example}
          type="button"
          className="btn btn-outline btn-xs h-auto whitespace-normal py-1 text-left font-normal"
          onClick={() => onPick(example)}
        >
          {example}
        </button>
      ))}
    </div>
  );
}

/**
 * The AI assistant: ask about the scenario, get a list of changes to approve,
 * or have it make them. The conversation lives in a store, so closing the
 * panel doesn't lose it or stop a turn that's under way.
 * @component
 */
export default function AssistantPanel() {
  const feed = useAssistant((state) => state.feed);
  const plan = useAssistant((state) => state.plan);
  const confirm = useAssistant((state) => state.confirm);
  const running = useAssistant((state) => state.running);
  const allowance = useAssistant((state) => state.allowance);
  const scroller = useRef<HTMLDivElement>(null);
  const stuckToBottom = useRef(true);

  // follow the conversation down, unless the author has scrolled up to read
  useEffect(() => {
    const element = scroller.current;
    if (element && stuckToBottom.current)
      element.scrollTop = element.scrollHeight;
  }, [feed, plan, confirm]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <ModeTabs />

      <div
        ref={scroller}
        className="min-h-0 flex-1 overflow-y-auto pr-1"
        onScroll={(event) => {
          const el = event.currentTarget;
          stuckToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
      >
        {feed.length ? (
          <Feed items={feed} />
        ) : (
          <p className="text-sm text-base-content/70">
            Ask me about this scenario, or tell me what to change. I can read
            the scene you have open, add and arrange things, change colours and
            text, and set where buttons lead.
          </p>
        )}
        {/* inside the scrolling part, so a long plan doesn't squeeze the chat */}
        <div className="mt-4 flex flex-col gap-3">
          <ConfirmCard />
          <PlanCard />
        </div>
      </div>

      <Composer />

      <footer className="flex items-center justify-between text-xs text-base-content/60">
        <span>
          {allowance && allowance.limit > 0
            ? `${allowance.used} of ${allowance.limit} requests used today`
            : ""}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          disabled={running || feed.length === 0}
          onClick={newConversation}
        >
          New chat
        </button>
      </footer>
    </div>
  );
}
