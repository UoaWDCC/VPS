import { AiError, createAccumulator } from "./accumulate";
import { readEvents } from "./sse";
import type {
  Allowance,
  AssistantMessage,
  ChatMessage,
  Mode,
  Usage,
} from "./types";

// One call to the AI proxy (POST /api/ai/chat) and its streamed reply.

export interface ChatRequest {
  scenarioId: string;
  mode: Mode;
  messages: ChatMessage[];
  tools?: unknown[];
  toolChoice?: "auto" | "none" | "required";
  model?: "main" | "fast";
  maxTokens?: number;
}

export interface ChatResult {
  message: AssistantMessage;
  finishReason: string | null;
  usage: Usage | null;
  /** How much of today's allowance is used, if the server said. */
  allowance: Allowance | null;
}

export interface ChatOptions {
  signal?: AbortSignal;
  /** Called with each new piece of text as it's written. */
  onText?: (delta: string) => void;
}

export type ChatFn = (
  request: ChatRequest,
  options?: ChatOptions
) => Promise<ChatResult>;

interface ErrorBody {
  error?: string;
  meta?: Record<string, unknown>;
}

async function failure(response: Response) {
  let body: ErrorBody = {};
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    // not JSON: use the status
  }
  return new AiError(
    body.error ?? `The AI service answered with an error (${response.status}).`,
    { status: response.status, meta: body.meta }
  );
}

function allowanceOf(headers: Headers): Allowance | null {
  const used = Number(headers.get("X-AI-Used"));
  const limit = Number(headers.get("X-AI-Limit"));
  return headers.has("X-AI-Used") && headers.has("X-AI-Limit") && limit > 0
    ? { used, limit }
    : null;
}

/**
 * The chat function the assistant uses.
 *
 * @param url the full address of the chat endpoint
 * @param getToken gives the signed-in author's login token
 */
export function createChat(
  url: string,
  getToken: () => Promise<string>
): ChatFn {
  return async (request, options = {}) => {
    const body: Record<string, unknown> = {
      scenarioId: request.scenarioId,
      mode: request.mode,
      messages: request.messages,
      model: request.model ?? "main",
    };
    if (request.tools?.length) {
      body.tools = request.tools;
      if (request.toolChoice) body.tool_choice = request.toolChoice;
    }
    if (request.maxTokens) body.max_tokens = request.maxTokens;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: options.signal,
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new AiError("Couldn't reach the server. Check your connection.");
    }

    if (!response.ok) throw await failure(response);
    if (!response.body) throw new AiError("The AI sent nothing back.");

    const accumulator = createAccumulator();
    for await (const event of readEvents(response.body)) {
      const text = accumulator.add(event);
      if (text) options.onText?.(text);
    }

    return {
      ...accumulator.result(),
      allowance: allowanceOf(response.headers),
    };
  };
}
