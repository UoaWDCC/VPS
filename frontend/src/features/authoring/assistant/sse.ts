// Reads a streamed reply: server-sent events, which are lines like
// `data: {json}` separated by a blank line and ending with `data: [DONE]`.
// Comment lines (`: keep-alive`) and anything that isn't JSON are skipped.

/** The JSON of each event in a stream, as it arrives. */
export async function* readEvents(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  const parse = (line: string) => {
    if (!line.startsWith("data:")) return undefined;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return undefined;
    try {
      return JSON.parse(data) as unknown;
    } catch {
      return undefined;
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split(/\r?\n/);
      // the last piece may be half a line, unless nothing more is coming
      pending = done ? "" : (lines.pop() ?? "");

      for (const line of lines) {
        const event = parse(line);
        if (event !== undefined) yield event;
      }
      if (done) break;
    }
    const last = parse(pending);
    if (last !== undefined) yield last;
  } finally {
    reader.releaseLock();
  }
}
