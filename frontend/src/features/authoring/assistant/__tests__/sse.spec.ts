import { describe, expect, it } from "vitest";
import { readEvents } from "../sse";

const encoder = new TextEncoder();

function streamOf(...chunks: (string | Uint8Array)[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) =>
        controller.enqueue(
          typeof chunk === "string" ? encoder.encode(chunk) : chunk
        )
      );
      controller.close();
    },
  });
}

async function all(stream: ReadableStream<Uint8Array>) {
  const events: unknown[] = [];
  for await (const event of readEvents(stream)) events.push(event);
  return events;
}

const data = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`;

describe("readEvents", () => {
  it("gives the JSON of each event, until [DONE]", async () => {
    const events = await all(
      streamOf(data({ a: 1 }), data({ b: 2 }), "data: [DONE]\n\n")
    );
    expect(events).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("copes with events cut anywhere, even inside a character", async () => {
    const bytes = encoder.encode(data({ text: "héllo → ✓" }));
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < bytes.length; i += 3)
      chunks.push(bytes.slice(i, i + 3));
    expect(await all(streamOf(...chunks))).toEqual([{ text: "héllo → ✓" }]);
  });

  it("copes with several events in one chunk and with CRLF", async () => {
    const text = `data: {"a":1}\r\n\r\ndata: {"a":2}\r\n\r\n`;
    expect(await all(streamOf(text))).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("reads a last event that has no blank line after it", async () => {
    expect(await all(streamOf('data: {"last":true}'))).toEqual([
      { last: true },
    ]);
  });

  it("skips comments, other fields and what isn't JSON", async () => {
    const events = await all(
      streamOf(
        ": OPENROUTER PROCESSING\n\n",
        "event: ping\n\n",
        "data: not json\n\n",
        data({ ok: true })
      )
    );
    expect(events).toEqual([{ ok: true }]);
  });

  it("is empty for an empty stream", async () => {
    expect(await all(streamOf())).toEqual([]);
  });
});
