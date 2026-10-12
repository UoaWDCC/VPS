// Reads a model's streamed reply as it passes through, to learn what it cost
// and which tools it called, without holding up or changing the stream.
//
// The reply is server-sent events: lines like `data: {json}`, separated by a
// blank line, ending with `data: [DONE]`. Comment lines (`: keep-alive`) and
// anything that isn't JSON are ignored.

const MAX_PENDING = 1_000_000;

/** What a finished (or broken off) reply told us. */
function emptyResult() {
  return {
    usage: null,
    toolNames: [],
    finishReason: null,
    error: null,
    events: 0,
  };
}

export function createStreamTap() {
  const decoder = new TextDecoder();
  const result = emptyResult();
  const tools = new Set();
  let pending = "";

  function read(event) {
    result.events += 1;

    if (event.usage && typeof event.usage === "object") {
      result.usage = {
        promptTokens: Number(event.usage.prompt_tokens) || 0,
        completionTokens: Number(event.usage.completion_tokens) || 0,
      };
    }
    if (event.error) {
      result.error =
        typeof event.error.message === "string"
          ? event.error.message
          : "The model reported an error";
    }
    for (const choice of event.choices ?? []) {
      if (choice.finish_reason) result.finishReason = choice.finish_reason;
      for (const call of choice.delta?.tool_calls ?? []) {
        if (typeof call.function?.name === "string")
          tools.add(call.function.name);
      }
    }
  }

  function line(text) {
    if (!text.startsWith("data:")) return;
    const data = text.slice(5).trim();
    if (!data || data === "[DONE]") return;
    try {
      read(JSON.parse(data));
    } catch {
      // not ours to judge: the client sees the same bytes
    }
  }

  function drain(final) {
    const lines = pending.split(/\r?\n/);
    // the last piece may be half a line, unless nothing more is coming
    pending = final ? "" : (lines.pop() ?? "");
    lines.forEach(line);
    if (pending.length > MAX_PENDING) pending = "";
  }

  return {
    /** Feed the next bytes of the reply. */
    push(chunk) {
      pending += decoder.decode(chunk, { stream: true });
      drain(false);
    },
    /** The reply is over. */
    end() {
      pending += decoder.decode();
      drain(true);
    },
    result() {
      return { ...result, toolNames: [...tools] };
    },
  };
}
