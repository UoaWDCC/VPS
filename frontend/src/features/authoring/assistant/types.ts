// The messages the model is sent and sends back, in the OpenAI chat format
// that OpenRouter (and the server's proxy) speak.

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type AssistantMessage = Extract<ChatMessage, { role: "assistant" }>;

export type Mode = "ask" | "plan" | "build" | "test" | "review";

/** The modes the panel offers so far. */
export type PanelMode = Extract<Mode, "ask" | "plan" | "build">;

export interface Usage {
  promptTokens: number;
  completionTokens: number;
}

/** Today's allowance, from the headers of a reply. */
export interface Allowance {
  used: number;
  limit: number;
}
