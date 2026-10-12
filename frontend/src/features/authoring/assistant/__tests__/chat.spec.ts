import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiError } from "../accumulate";
import { createChat, type ChatRequest } from "../chat";

const encoder = new TextEncoder();
const data = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`;

function sse(events: string[], headers: Record<string, string> = {}) {
  return new Response(
    new ReadableStream({
      start(controller) {
        events.forEach((e) => controller.enqueue(encoder.encode(e)));
        controller.close();
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "text/event-stream", ...headers },
    }
  );
}

const request: ChatRequest = {
  scenarioId: "scenario-1",
  mode: "build",
  messages: [{ role: "user", content: "hi" }],
};

const chat = createChat("https://example.test/api/ai/chat", () =>
  Promise.resolve("login-token")
);

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const sentBody = () =>
  JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<
    string,
    unknown
  >;

describe("createChat", () => {
  it("sends the request with the author's login", async () => {
    fetchMock.mockResolvedValue(
      sse([data({ choices: [{ delta: { content: "ok" } }] })])
    );
    await chat(request);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.test/api/ai/chat");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer login-token"
    );
    expect(sentBody()).toEqual({
      scenarioId: "scenario-1",
      mode: "build",
      messages: request.messages,
      model: "main",
    });
  });

  it("sends tools and the choice only when there are tools", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(sse([])));
    await chat({ ...request, toolChoice: "auto" });
    expect(sentBody()).not.toHaveProperty("tools");
    expect(sentBody()).not.toHaveProperty("tool_choice");

    fetchMock.mockClear();
    await chat({
      ...request,
      tools: [{ type: "function" }],
      toolChoice: "auto",
      maxTokens: 500,
    });
    expect(sentBody()).toMatchObject({
      tools: [{ type: "function" }],
      tool_choice: "auto",
      max_tokens: 500,
    });
  });

  it("gives back the reply, the cost and today's allowance, showing text as it comes", async () => {
    fetchMock.mockResolvedValue(
      sse(
        [
          data({ choices: [{ delta: { content: "Hel" } }] }),
          data({
            choices: [{ delta: { content: "lo" }, finish_reason: "stop" }],
          }),
          data({
            choices: [],
            usage: { prompt_tokens: 10, completion_tokens: 2 },
          }),
          "data: [DONE]\n\n",
        ],
        { "X-AI-Used": "4", "X-AI-Limit": "200" }
      )
    );
    const pieces: string[] = [];
    const result = await chat(request, { onText: (t) => pieces.push(t) });

    expect(pieces).toEqual(["Hel", "lo"]);
    expect(result.message).toEqual({ role: "assistant", content: "Hello" });
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 2 });
    expect(result.allowance).toEqual({ used: 4, limit: 200 });
    expect(result.finishReason).toBe("stop");
  });

  it("has no allowance if the server didn't say", async () => {
    fetchMock.mockResolvedValue(sse([]));
    expect((await chat(request)).allowance).toBeNull();
  });

  describe("when the server says no", () => {
    const refuse = (status: number, body: unknown) =>
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        })
      );

    it("gives the server's own words, status and details", async () => {
      refuse(429, {
        error: "You've used all 200 of today's AI requests.",
        meta: { limit: 200, resetsAt: "2026-10-13T00:00:00.000Z" },
      });
      await expect(chat(request)).rejects.toMatchObject({
        name: "AiError",
        message: "You've used all 200 of today's AI requests.",
        status: 429,
        meta: { limit: 200, resetsAt: "2026-10-13T00:00:00.000Z" },
      });
    });

    it("says it isn't set up (503) with what's missing", async () => {
      refuse(503, {
        error: "The AI assistant isn't set up on this server yet.",
        meta: { missing: ["OPENROUTER_API_KEY"] },
      });
      await expect(chat(request)).rejects.toMatchObject({
        status: 503,
        meta: { missing: ["OPENROUTER_API_KEY"] },
      });
    });

    it("copes with an error that isn't JSON", async () => {
      fetchMock.mockResolvedValue(
        new Response("<html>Bad gateway</html>", { status: 502 })
      );
      await expect(chat(request)).rejects.toMatchObject({
        status: 502,
        message: expect.stringContaining("502") as unknown,
      });
    });
  });

  it("explains when the server can't be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(chat(request)).rejects.toThrowError(
      /Couldn't reach the server/
    );
  });

  it("lets Stop through as it is, not as an error to show", async () => {
    const controller = new AbortController();
    controller.abort();
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    await expect(
      chat(request, { signal: controller.signal })
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("raises an error the stream ends with", async () => {
    fetchMock.mockResolvedValue(
      sse([
        data({ choices: [{ delta: { content: "Part" } }] }),
        data({
          error: {
            message: "The AI took too long, so it was stopped.",
            code: "timeout",
          },
        }),
      ])
    );
    const pieces: string[] = [];
    const failure = await chat(request, {
      onText: (t) => pieces.push(t),
    }).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(AiError);
    expect(failure).toMatchObject({ code: "timeout" });
    expect(pieces).toEqual(["Part"]);
  });
});
