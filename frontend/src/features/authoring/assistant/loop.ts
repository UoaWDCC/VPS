import type { RunResult, Session } from "../commands/types";
import { AiError } from "./accumulate";
import type { ChatFn } from "./chat";
import { toolsForMode } from "./modes";
import type { ToolMode } from "./prompt";
import { parseTextToolCalls } from "./textTools";
import { runTool, type ConfirmRequest } from "./tools";
import type { Allowance, ChatMessage, Mode, ToolCall, Usage } from "./types";

// One turn of the assistant: the author says something, then the model and the
// tools take turns until the model has nothing more to do. Each time the model
// asks for tools they're run and the results go back to it, up to a limit.
//
// Nothing here knows about the screen. What happens is reported through
// `onEvent`, and the model, the scenario and the author's confirmations are
// all passed in, so the whole loop runs the same in a test.

export const MAX_STEPS = 15;

export type TurnEvent =
  /** A request to the model is starting. */
  | { type: "step"; step: number }
  /** More of the reply text. */
  | { type: "text"; delta: string }
  /** The reply text is this, whatever was shown so far. */
  | { type: "text_set"; text: string }
  | { type: "tool_start"; id: string; name: string; args: unknown }
  | {
      type: "tool_end";
      id: string;
      name: string;
      ok: boolean;
      summary: string;
      warnings?: string[];
      declined?: boolean;
    }
  /** The model couldn't call tools itself, so calls are now read from its text. */
  | { type: "tool_mode"; toolMode: ToolMode }
  | { type: "allowance"; allowance: Allowance };

export interface TurnOptions {
  mode: Mode;
  scenarioId: string;
  /** The rules and the scenario as it is now, for the way tools are called. */
  systemFor: (toolMode: ToolMode) => string;
  /** The conversation so far, without the system message. */
  history: ChatMessage[];
  userMessage: string;
  chat: ChatFn;
  session: Session;
  signal?: AbortSignal;
  maxSteps?: number;
  toolMode?: ToolMode;
  confirm?: (request: ConfirmRequest) => Promise<boolean>;
  execute?: (name: string, args: unknown) => Promise<RunResult>;
  onEvent?: (event: TurnEvent) => void;
}

export type Finish = "done" | "stopped" | "step_limit" | "error";

export interface TurnResult {
  finish: Finish;
  /** What was said and done this turn, for the model's memory of it. */
  messages: ChatMessage[];
  /** The assistant's last words. */
  text: string;
  steps: number;
  /** How tools were called by the end, which may differ from the start. */
  toolMode: ToolMode;
  usage: Usage;
  error?: Error;
}

interface Call {
  id: string;
  name: string;
  arguments: unknown;
}

const isAbort = (error: unknown, signal?: AbortSignal) =>
  Boolean(signal?.aborted) ||
  (error instanceof Error && error.name === "AbortError");

/** The provider said the model can't call tools. */
function lacksToolSupport(error: unknown) {
  if (!(error instanceof AiError) || (error.status ?? 0) < 400) return false;
  const reason = error.meta?.message;
  return (
    typeof reason === "string" && /\btools?\b|function[ -]call/i.test(reason)
  );
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** Plain text goes to the screen as it arrives; text that looks like a call waits. */
function textGate(emit: (delta: string) => void) {
  let decided: "show" | "hold" | null = null;
  let held = "";
  let shown = "";
  return {
    push(delta: string) {
      held += delta;
      if (decided === null) {
        const first = held.trimStart()[0];
        if (!first) return;
        decided = /[{[`]/.test(first) ? "hold" : "show";
      }
      if (decided === "show") {
        shown += held;
        emit(held);
        held = "";
      }
    },
    /** Everything that has been sent to the screen so far. */
    get shown() {
      return shown;
    },
  };
}

export async function runTurn(options: TurnOptions): Promise<TurnResult> {
  const {
    mode,
    scenarioId,
    systemFor,
    history,
    userMessage,
    chat,
    session,
    signal,
    maxSteps = MAX_STEPS,
    onEvent = () => {},
  } = options;

  let toolMode: ToolMode = options.toolMode ?? "native";
  let switchedToText = false;
  const turn: ChatMessage[] = [{ role: "user", content: userMessage }];
  const usage: Usage = { promptTokens: 0, completionTokens: 0 };
  let text = "";
  let steps = 0;

  const done = (finish: Finish, error?: Error): TurnResult => ({
    finish,
    messages: turn,
    text,
    steps,
    toolMode,
    usage,
    error,
  });

  const toolNames = () => toolsForMode(mode).map((tool) => tool.function.name);

  while (steps < maxSteps) {
    if (signal?.aborted) return done("stopped");
    steps += 1;
    onEvent({ type: "step", step: steps });

    const gate = textGate((delta) => onEvent({ type: "text", delta }));
    let reply;
    try {
      reply = await chat(
        {
          scenarioId,
          mode,
          messages: [
            { role: "system", content: systemFor(toolMode) },
            ...history,
            ...turn,
          ],
          tools: toolMode === "native" ? toolsForMode(mode) : undefined,
          toolChoice: "auto",
        },
        { signal, onText: (delta) => gate.push(delta) }
      );
    } catch (error) {
      if (isAbort(error, signal)) return done("stopped");
      if (toolMode === "native" && !switchedToText && lacksToolSupport(error)) {
        // this model can't call tools, so ask for the calls as text instead
        toolMode = "json";
        switchedToText = true;
        steps -= 1;
        onEvent({ type: "tool_mode", toolMode });
        continue;
      }
      return done(
        "error",
        error instanceof Error ? error : new Error(String(error))
      );
    }

    usage.promptTokens += reply.usage?.promptTokens ?? 0;
    usage.completionTokens += reply.usage?.completionTokens ?? 0;
    if (reply.allowance)
      onEvent({ type: "allowance", allowance: reply.allowance });

    const { message } = reply;
    let calls: Call[] = (message.tool_calls ?? []).map((call: ToolCall) => ({
      id: call.id,
      name: call.function.name,
      arguments: call.function.arguments,
    }));

    // a model that writes its calls as JSON in the reply instead
    let replyText = message.content ?? "";
    let calledInText = false;
    if (!calls.length && replyText) {
      const found = parseTextToolCalls(replyText, toolNames());
      if (found) {
        calledInText = true;
        replyText = found.rest;
        calls = found.calls.map((call, i) => ({
          id: `text_${steps}_${i}`,
          name: call.name,
          arguments: call.arguments,
        }));
      }
    }

    // the screen has what streamed in; fix it if the reply turned out different
    if (replyText !== gate.shown)
      onEvent({ type: "text_set", text: replyText });
    if (replyText) text = replyText;
    turn.push(message);

    if (!calls.length) return done("done");

    const results: { call: Call; content: string }[] = [];
    for (const call of calls) {
      if (signal?.aborted) return done("stopped");

      onEvent({
        type: "tool_start",
        id: call.id,
        name: call.name,
        args:
          typeof call.arguments === "string"
            ? tryParse(call.arguments)
            : call.arguments,
      });
      const outcome = await runTool(
        {
          mode,
          session,
          confirm: options.confirm,
          execute: options.execute,
        },
        call.name,
        call.arguments
      );
      onEvent({
        type: "tool_end",
        id: call.id,
        name: call.name,
        ok: outcome.ok,
        summary: outcome.summary,
        warnings: outcome.warnings,
        declined: outcome.declined,
      });
      results.push({ call, content: outcome.content });
    }

    if (toolMode === "native" && !calledInText) {
      for (const { call, content } of results)
        turn.push({ role: "tool", tool_call_id: call.id, content });
    } else {
      turn.push({
        role: "user",
        content: `Tool results:\n${results
          .map(({ call, content }) => `${call.name}: ${content}`)
          .join("\n")}`,
      });
    }
  }

  return done("step_limit");
}
