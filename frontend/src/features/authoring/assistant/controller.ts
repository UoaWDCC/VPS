import { getCommand } from "../commands/registry";
import type { Session } from "../commands/types";
import { AiError } from "./accumulate";
import type { ChatFn } from "./chat";
import { runTurn, type TurnEvent, type TurnResult } from "./loop";
import { toolsForMode } from "./modes";
import {
  applyPlan,
  createPlanRecorder,
  describeStep,
  toggleStep,
  type PlanRecorder,
} from "./plan";
import { buildSystemPrompt } from "./prompt";
import useAssistant, { type Block, type Turn } from "./store";
import type { ChatMessage, PanelMode } from "./types";

// What happens when the author uses the panel: send a message, stop, answer a
// question about a deletion, apply or drop a plan. It runs outside React, so a
// turn carries on when the panel is closed, and it only touches the store
// (what the panel shows) and what it's given here.

export interface AssistantDeps {
  scenarioId: string;
  /** The real scenario, as the editor has it. */
  session: Session;
  chat: ChatFn;
  /** Stops the author editing while the assistant does. */
  setLocked: (locked: boolean) => void;
}

/** About eight turns of back and forth are remembered. */
const MAX_REMEMBERED = 16;

let deps: AssistantDeps | null = null;
let abort: AbortController | null = null;
let recorder: PlanRecorder | null = null;
let nextId = 1;

export function setAssistantDeps(next: AssistantDeps | null) {
  if (!next) {
    stop();
    deps?.setLocked(false);
  }
  deps = next;
}

const store = () => useAssistant.getState();

function updateTurn(id: number, change: (turn: Turn) => Turn) {
  store().updateFeed((feed) =>
    feed.map((item) =>
      item.kind === "turn" && item.turn.id === id
        ? { kind: "turn", turn: change(item.turn) }
        : item
    )
  );
}

export function addNote(level: "info" | "warning", text: string) {
  store().updateFeed((feed) => [
    ...feed,
    { kind: "note", id: nextId++, level, text },
  ]);
}

/** What the author is told when a turn can't carry on. */
export function describeError(error: unknown) {
  if (error instanceof AiError) {
    // the server's words are already for the author: "You've used all 200..."
    if (error.status === 503 && Array.isArray(error.meta?.missing))
      return `${error.message} It needs ${(error.meta.missing as string[]).join(" and ")} set on the server.`;
    return error.message;
  }
  return `Something went wrong: ${
    error instanceof Error ? error.message : String(error)
  }`;
}

/** Applies a turn's events to what the panel shows. */
function feedFrom(turnId: number) {
  let textOpen = false;

  const withBlocks = (change: (blocks: Block[]) => Block[]) =>
    updateTurn(turnId, (turn) => ({ ...turn, blocks: change(turn.blocks) }));

  return (event: TurnEvent) => {
    switch (event.type) {
      case "step":
        textOpen = false;
        break;
      case "text":
        withBlocks((blocks) => {
          const last = blocks.at(-1);
          if (textOpen && last?.kind === "text")
            return [
              ...blocks.slice(0, -1),
              { kind: "text", text: last.text + event.delta },
            ];
          return [...blocks, { kind: "text", text: event.delta }];
        });
        textOpen = true;
        break;
      case "text_set":
        withBlocks((blocks) => {
          const last = blocks.at(-1);
          const rest =
            textOpen && last?.kind === "text" ? blocks.slice(0, -1) : blocks;
          return event.text
            ? [...rest, { kind: "text", text: event.text }]
            : rest;
        });
        textOpen = Boolean(event.text);
        break;
      case "tool_start":
        textOpen = false;
        withBlocks((blocks) => [
          ...blocks,
          {
            kind: "tool",
            tool: {
              id: event.id,
              name: event.name,
              args: event.args,
              status: "running",
            },
          },
        ]);
        break;
      case "tool_end":
        withBlocks((blocks) =>
          blocks.map((block) =>
            block.kind === "tool" && block.tool.id === event.id
              ? {
                  kind: "tool",
                  tool: {
                    ...block.tool,
                    status: event.declined
                      ? "declined"
                      : event.ok
                        ? "ok"
                        : "error",
                    summary: event.summary,
                    warnings: event.warnings,
                  },
                }
              : block
          )
        );
        break;
      case "tool_mode":
        store().setToolMode(event.toolMode);
        addNote(
          "info",
          "This model can't call tools itself, so the assistant now asks it to write them out as text."
        );
        break;
      case "allowance":
        store().setAllowance(event.allowance);
        break;
    }
  };
}

/** The tools that changed things this turn, like "move ×2, add_button". */
function actionsIn(result: TurnResult) {
  const counts = new Map<string, number>();
  for (const message of result.messages) {
    if (message.role !== "assistant") continue;
    for (const call of message.tool_calls ?? []) {
      const kind = getCommand(call.function.name)?.kind;
      if (kind && kind !== "read")
        counts.set(
          call.function.name,
          (counts.get(call.function.name) ?? 0) + 1
        );
    }
  }
  return [...counts].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name));
}

/** A turn, boiled down to what the model needs to remember of it. */
function remember(
  history: ChatMessage[],
  userMessage: string,
  result: TurnResult,
  mode: PanelMode
): ChatMessage[] {
  const actions = actionsIn(result);
  const note = actions.length
    ? `[${mode === "plan" ? "Proposed this turn, not applied yet" : "Done this turn"}: ${actions.join(", ")}]`
    : "";
  const reply = [result.text, note].filter(Boolean).join("\n\n");
  if (!reply) return history;

  return [
    ...history,
    { role: "user" as const, content: userMessage },
    { role: "assistant" as const, content: reply },
  ].slice(-MAX_REMEMBERED);
}

/** Sends the author's message and runs the turn it starts. */
export async function send(text: string) {
  const message = text.trim();
  const d = deps;
  if (!d || !message || store().running) return;

  const { mode, history, toolMode } = store();
  const turnId = nextId++;
  store().updateFeed((feed) => [
    ...feed,
    {
      kind: "turn",
      turn: { id: turnId, mode, user: message, blocks: [], status: "running" },
    },
  ]);
  store().setRunning(true);

  const controller = new AbortController();
  abort = controller;

  // Ask reads the real scenario. Plan works on a private copy that is kept
  // until the plan is applied or dropped. Build changes the real thing.
  if (mode === "plan") recorder ??= createPlanRecorder(d.session);
  const session = mode === "plan" && recorder ? recorder.session : d.session;
  if (mode === "build") d.setLocked(true);

  const run = () =>
    runTurn({
      mode,
      scenarioId: d.scenarioId,
      systemFor: (tools) =>
        buildSystemPrompt({
          mode,
          world: session.world(),
          toolMode: tools,
          tools: toolsForMode(mode),
        }),
      history,
      userMessage: message,
      chat: d.chat,
      session,
      signal: controller.signal,
      toolMode,
      execute: mode === "plan" ? recorder?.execute : undefined,
      confirm:
        mode === "build"
          ? (request) =>
              new Promise<boolean>((resolve) =>
                store().setConfirm({
                  description: request.description,
                  resolve: (approved) => {
                    store().setConfirm(null);
                    resolve(approved);
                  },
                })
              )
          : undefined,
      onEvent: feedFrom(turnId),
    });

  let result: TurnResult;
  try {
    // the whole turn is one step to undo
    result =
      mode === "build" && d.session.batch
        ? await d.session.batch(run)
        : await run();
  } catch (error) {
    result = {
      finish: "error",
      messages: [],
      text: "",
      steps: 0,
      toolMode,
      usage: { promptTokens: 0, completionTokens: 0 },
      error: error instanceof Error ? error : new Error(String(error)),
    };
  } finally {
    d.setLocked(false);
    store().setConfirm(null);
    store().setRunning(false);
    abort = null;
  }

  updateTurn(turnId, (turn) => ({
    ...turn,
    status: result.finish === "error" ? "error" : result.finish,
    error: result.error ? describeError(result.error) : undefined,
  }));
  store().setHistory(remember(history, message, result, mode));
  store().setToolMode(result.toolMode);

  if (mode === "plan" && recorder) {
    const steps = [...recorder.steps()];
    const known = new Set(store().plan?.steps.map((step) => step.id));
    store().setPlan(
      steps.length
        ? {
            steps,
            // what was ticked stays ticked, and new steps start ticked
            selected: [
              ...(store().plan?.selected ?? []),
              ...steps.filter((step) => !known.has(step.id)).map((s) => s.id),
            ],
          }
        : null
    );
  }
}

/** Stops the turn that's running, leaving what it has done so far. */
export function stop() {
  abort?.abort();
  store().confirm?.resolve(false);
}

export function setStepTicked(stepId: string, on: boolean) {
  const { plan } = store();
  if (!plan) return;
  store().setPlan({
    ...plan,
    selected: [...toggleStep(plan.steps, new Set(plan.selected), stepId, on)],
  });
}

/** Makes the ticked steps of the plan real, as one undo step. */
export async function applyTicked() {
  const d = deps;
  const { plan } = store();
  if (!d || !plan || store().running) return;

  store().setRunning(true);
  d.setLocked(true);
  try {
    const chosen = new Set(plan.selected);
    const result = await applyPlan(d.session, plan.steps, chosen);

    const done = result.applied.length;
    if (done)
      addNote(
        "info",
        `Applied ${done} ${done === 1 ? "change" : "changes"}. One undo takes them all back.`
      );
    for (const { step, error } of result.failed)
      addNote(
        "warning",
        `Couldn't ${describeStep(step).toLowerCase()}: ${error}`
      );
    if (!done && !result.failed.length)
      addNote("info", "No changes were ticked.");

    recorder = null;
    store().setPlan(null);
  } finally {
    d.setLocked(false);
    store().setRunning(false);
  }
}

/** Drops the plan without applying any of it. */
export function discardPlan() {
  recorder = null;
  store().setPlan(null);
}

/** Starts again with an empty conversation. */
export function newConversation() {
  if (store().running) return;
  recorder = null;
  store().reset();
}
