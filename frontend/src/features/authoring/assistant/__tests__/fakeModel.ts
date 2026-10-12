import { AiError } from "../accumulate";
import type { ChatFn, ChatRequest, ChatResult } from "../chat";
import type { Allowance, ToolCall, Usage } from "../types";

// A model that says what the test tells it to, so the loop can be run exactly.

export interface Scripted {
  content?: string;
  /** Tool calls, with arguments as an object, or as text to send them broken. */
  calls?: { name: string; args?: unknown }[];
  error?: Error;
  usage?: Usage;
  allowance?: Allowance;
  /** Waits for this before replying, so a test can act in the meantime. */
  until?: Promise<unknown>;
}

export function scriptedChat(
  script: (Scripted | ((r: ChatRequest) => Scripted))[]
) {
  const requests: ChatRequest[] = [];
  let next = 0;

  const chat: ChatFn = async (request, options = {}) => {
    requests.push(structuredClone(request));
    const step = script[next++];
    if (!step) throw new Error("the fake model has nothing more to say");
    const reply = typeof step === "function" ? step(request) : step;

    if (reply.until) await reply.until;
    if (options.signal?.aborted)
      throw new DOMException("Aborted", "AbortError");
    if (reply.error) throw reply.error;

    const content = reply.content ?? "";
    // as a stream would: a few characters at a time
    for (let i = 0; i < content.length; i += 4)
      options.onText?.(content.slice(i, i + 4));

    const tool_calls: ToolCall[] = (reply.calls ?? []).map((call, i) => ({
      id: `call_${next}_${i}`,
      type: "function",
      function: {
        name: call.name,
        arguments:
          typeof call.args === "string"
            ? call.args
            : JSON.stringify(call.args ?? {}),
      },
    }));

    const result: ChatResult = {
      message: {
        role: "assistant",
        content: content || null,
        ...(tool_calls.length && { tool_calls }),
      },
      finishReason: tool_calls.length ? "tool_calls" : "stop",
      usage: reply.usage ?? null,
      allowance: reply.allowance ?? null,
    };
    return result;
  };

  return { chat, requests };
}

export const noToolSupport = () =>
  new AiError("The AI provider couldn't handle the request.", {
    status: 502,
    meta: { message: "No endpoints found that support tool use" },
  });
