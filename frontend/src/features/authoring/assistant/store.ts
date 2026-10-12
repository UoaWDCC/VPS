import create from "zustand";
import type { PlanStep } from "./plan";
import type { ToolMode } from "./prompt";
import type { Allowance, ChatMessage, PanelMode } from "./types";

// What the assistant panel shows, and what the assistant remembers between
// turns. The panel can be closed and reopened (and the turn carries on) so
// this lives outside it.

export interface ToolRow {
  id: string;
  name: string;
  args: unknown;
  status: "running" | "ok" | "error" | "declined";
  summary?: string;
  warnings?: string[];
}

/** What a turn shows, in the order it happened. */
export type Block =
  | { kind: "text"; text: string }
  | { kind: "tool"; tool: ToolRow };

export interface Turn {
  id: number;
  mode: PanelMode;
  user: string;
  blocks: Block[];
  status: "running" | "done" | "stopped" | "step_limit" | "error";
  error?: string;
}

export type FeedItem =
  | { kind: "turn"; turn: Turn }
  | { kind: "note"; id: number; level: "info" | "warning"; text: string };

export interface PendingConfirm {
  description: string;
  resolve: (approved: boolean) => void;
}

export interface PlanState {
  steps: PlanStep[];
  /** Ids of the steps that are ticked. */
  selected: string[];
}

interface AssistantState {
  mode: PanelMode;
  feed: FeedItem[];
  /** What the model remembers of earlier turns. */
  history: ChatMessage[];
  toolMode: ToolMode;
  running: boolean;
  confirm: PendingConfirm | null;
  plan: PlanState | null;
  allowance: Allowance | null;

  setMode: (mode: PanelMode) => void;
  setRunning: (running: boolean) => void;
  setConfirm: (confirm: PendingConfirm | null) => void;
  setPlan: (plan: PlanState | null) => void;
  setAllowance: (allowance: Allowance) => void;
  setToolMode: (toolMode: ToolMode) => void;
  setHistory: (history: ChatMessage[]) => void;
  /** Changes the feed: give it the feed as it is and return the new one. */
  updateFeed: (change: (feed: FeedItem[]) => FeedItem[]) => void;
  reset: () => void;
}

const useAssistant = create<AssistantState>((set) => ({
  mode: "ask",
  feed: [],
  history: [],
  toolMode: "native",
  running: false,
  confirm: null,
  plan: null,
  allowance: null,

  setMode: (mode) => set({ mode }),
  setRunning: (running) => set({ running }),
  setConfirm: (confirm) => set({ confirm }),
  setPlan: (plan) => set({ plan }),
  setAllowance: (allowance) => set({ allowance }),
  setToolMode: (toolMode) => set({ toolMode }),
  setHistory: (history) => set({ history }),
  updateFeed: (change) => set((state) => ({ feed: change(state.feed) })),
  reset: () =>
    set({
      feed: [],
      history: [],
      toolMode: "native",
      confirm: null,
      plan: null,
    }),
}));

export default useAssistant;
