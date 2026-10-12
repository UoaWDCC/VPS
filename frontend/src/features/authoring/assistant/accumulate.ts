import type { AssistantMessage, ToolCall, Usage } from "./types";

// A streamed reply arrives in pieces: bits of text, and tool calls whose
// arguments are written a few characters at a time. This puts the pieces back
// together into the message the model sent.

export class AiError extends Error {
  status?: number;
  code?: string;
  meta?: Record<string, unknown>;

  constructor(
    message: string,
    details: {
      status?: number;
      code?: string;
      meta?: Record<string, unknown>;
    } = {}
  ) {
    super(message);
    this.name = "AiError";
    this.status = details.status;
    this.code = details.code;
    this.meta = details.meta;
  }
}

interface PartialCall {
  id: string;
  name: string;
  arguments: string;
}

type Loose = Record<string, unknown>;

const isObject = (value: unknown): value is Loose =>
  typeof value === "object" && value !== null;

export interface Accumulated {
  message: AssistantMessage;
  finishReason: string | null;
  usage: Usage | null;
}

export function createAccumulator() {
  let content = "";
  const calls = new Map<number, PartialCall>();
  let finishReason: string | null = null;
  let usage: Usage | null = null;

  function addToolCall(raw: unknown, fallbackIndex: number) {
    if (!isObject(raw)) return;
    const index = typeof raw.index === "number" ? raw.index : fallbackIndex;
    const call = calls.get(index) ?? { id: "", name: "", arguments: "" };
    const fn = isObject(raw.function) ? raw.function : {};

    if (typeof raw.id === "string" && raw.id && !call.id) call.id = raw.id;
    // the name comes whole, though some providers repeat it in every piece
    if (typeof fn.name === "string" && fn.name && fn.name !== call.name)
      call.name = call.name ? call.name + fn.name : fn.name;
    if (typeof fn.arguments === "string") call.arguments += fn.arguments;
    calls.set(index, call);
  }

  return {
    /**
     * Takes in the next event. Returns the new text in it, if any, so it can
     * be shown while the rest is still being written.
     */
    add(event: unknown): string {
      if (!isObject(event)) return "";

      if (isObject(event.error)) {
        const error = event.error;
        throw new AiError(
          typeof error.message === "string"
            ? error.message
            : "The AI reported an error.",
          { code: typeof error.code === "string" ? error.code : undefined }
        );
      }

      if (isObject(event.usage)) {
        usage = {
          promptTokens: Number(event.usage.prompt_tokens) || 0,
          completionTokens: Number(event.usage.completion_tokens) || 0,
        };
      }

      let text = "";
      const choices = Array.isArray(event.choices) ? event.choices : [];
      for (const choice of choices) {
        if (!isObject(choice)) continue;
        if (typeof choice.finish_reason === "string")
          finishReason = choice.finish_reason;

        // most providers stream "delta"; a few send the whole "message"
        const part = isObject(choice.delta)
          ? choice.delta
          : isObject(choice.message)
            ? choice.message
            : null;
        if (!part) continue;

        if (typeof part.content === "string") {
          content += part.content;
          text += part.content;
        }
        if (Array.isArray(part.tool_calls))
          part.tool_calls.forEach((call, i) => addToolCall(call, i));
      }
      return text;
    },

    result(): Accumulated {
      const toolCalls: ToolCall[] = [...calls.entries()]
        .sort(([a], [b]) => a - b)
        .filter(([, call]) => call.name)
        .map(([index, call]) => ({
          id: call.id || `call_${index}`,
          type: "function",
          function: { name: call.name, arguments: call.arguments },
        }));

      const message: AssistantMessage = {
        role: "assistant",
        content: content || null,
      };
      if (toolCalls.length) message.tool_calls = toolCalls;
      return { message, finishReason, usage };
    },
  };
}
