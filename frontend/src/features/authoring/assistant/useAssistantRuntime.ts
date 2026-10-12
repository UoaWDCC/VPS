import axios from "axios";
import { useEffect } from "react";
import type { Session } from "../commands/types";
import useEditorStore from "../stores/editor";
import { createChat } from "./chat";
import { setAssistantDeps } from "./controller";

/** Where the AI proxy is, the same way the rest of the app finds the server. */
function chatUrl() {
  const base = (axios.defaults.baseURL ?? "/").replace(/\/+$/, "");
  return `${base}/api/ai/chat`;
}

/**
 * Connects the assistant to this editor for as long as it's open: the real
 * scenario to work on, and the author's login to talk to the server with.
 * Leaving the editor stops anything the assistant is doing.
 */
export default function useAssistantRuntime(
  scenarioId: string,
  session: Session,
  getToken: () => Promise<string>
) {
  useEffect(() => {
    setAssistantDeps({
      scenarioId,
      session,
      chat: createChat(chatUrl(), getToken),
      setLocked: (locked) => useEditorStore.getState().setLocked(locked),
    });
    return () => setAssistantDeps(null);
    // the token is asked for fresh on every request, so it can stay as it was
  }, [scenarioId, session]);
}
