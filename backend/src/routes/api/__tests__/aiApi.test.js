import {
  jest,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  it,
  expect,
} from "@jest/globals";
import express from "express";
import axios from "axios";

import aiRouter from "../ai.js";
import auth from "../../../middleware/firebaseAuth.js";
import { isAuthor } from "../../../middleware/scenarioAuth.js";
import errorHandler from "../../../middleware/errorHandler.js";
import { getAiUsage } from "../../../db/daos/aiUsageDao.js";

import { authHeaders } from "./testHelpers.js";
import {
  useMongoMemoryServer,
  useExpressServer,
} from "../../../test/testSetup.js";

jest.mock("../../../middleware/firebaseAuth");
jest.mock("../../../middleware/scenarioAuth");
jest.mock("firebase-admin");

// like the real one: no token, no entry; the token stands in for the uid
auth.mockImplementation(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  req.uid = token;
  req.body.uid = token;
  next();
});

// "author-1" and "author-2" can edit the scenario used below
isAuthor.mockImplementation(async (scenarioId, uid) =>
  ["author-1", "author-2"].includes(uid)
);

const SCENARIO = "507f1f77bcf86cd799439011";

const data = (event) => `data: ${JSON.stringify(event)}\n\n`;
const REPLY = [
  data({ choices: [{ delta: { content: "Hel" } }] }),
  data({ choices: [{ delta: { content: "lo" } }] }),
  data({ choices: [], usage: { prompt_tokens: 42, completion_tokens: 7 } }),
  "data: [DONE]\n\n",
];

const ENV_KEYS = [
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "OPENROUTER_FAST_MODEL",
  "OPENROUTER_BASE_URL",
  "AI_DAILY_LIMIT",
  "AI_MAX_OUTPUT_TOKENS",
  "AI_MAX_INPUT_CHARS",
  "AI_TIMEOUT_MS",
  "AI_LOG_CONTENT",
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(check, ms = 3000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await check()) return;
    await wait(10);
  }
  throw new Error("timed out waiting");
}

describe("AI API tests", () => {
  useMongoMemoryServer();
  const ctx = useExpressServer(() => {
    const app = express();
    app.use(express.json());
    app.use("/api/ai", aiRouter);
    app.use(errorHandler);
    return app;
  });

  // A stand-in for the model provider. `respond` is what it does next.
  let provider;
  let providerPort;
  let received;
  let respond;
  let providerClosedEarly;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.post("/v1/chat/completions", (req, res) => {
      received.push({ headers: req.headers, body: req.body });
      res.on("close", () => {
        if (!res.writableEnded) providerClosedEarly = true;
      });
      respond(req, res);
    });
    await new Promise((resolve) => {
      provider = app.listen(0, resolve);
    });
    providerPort = provider.address().port;
  });

  afterAll(async () => {
    provider.closeAllConnections?.();
    await new Promise((resolve) => provider.close(resolve));
  });

  const streamReply = (res, events = REPLY) => {
    res.set("Content-Type", "text/event-stream");
    events.forEach((event) => res.write(event));
    res.end();
  };

  let savedEnv;
  let logs;

  beforeEach(() => {
    received = [];
    providerClosedEarly = false;
    respond = (req, res) => streamReply(res);

    savedEnv = Object.fromEntries(
      ENV_KEYS.map((key) => [key, process.env[key]])
    );
    ENV_KEYS.forEach((key) => delete process.env[key]);
    Object.assign(process.env, {
      OPENROUTER_API_KEY: "server-key",
      OPENROUTER_MODEL: "vendor/main",
      OPENROUTER_FAST_MODEL: "vendor/fast",
      OPENROUTER_BASE_URL: `http://localhost:${providerPort}/v1`,
      AI_DAILY_LIMIT: "3",
      AI_TIMEOUT_MS: "5000",
    });

    logs = [];
    jest.spyOn(console, "log").mockImplementation((line) => {
      try {
        const entry = JSON.parse(line);
        if (entry.event === "ai.chat") logs.push(entry);
      } catch {
        // not one of ours
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    ENV_KEYS.forEach((key) => {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    });
  });

  const body = (extra = {}) => ({
    scenarioId: SCENARIO,
    mode: "build",
    messages: [{ role: "user", content: "Make the title bigger" }],
    ...extra,
  });

  const tool = (name) => ({
    type: "function",
    function: { name, description: "d", parameters: { type: "object" } },
  });

  const chat = (payload = body(), uid = "author-1", config = {}) =>
    axios.post(`http://localhost:${ctx.port}/api/ai/chat`, payload, {
      ...authHeaders(uid),
      validateStatus: () => true,
      ...config,
    });

  describe("when the server isn't set up", () => {
    it("says so with a 503, naming what is missing, and doesn't count it", async () => {
      delete process.env.OPENROUTER_API_KEY;

      const response = await chat();
      expect(response.status).toBe(503);
      expect(response.data.meta).toEqual({ missing: ["OPENROUTER_API_KEY"] });
      expect(response.data.error).toMatch(/isn't set up/);
      expect(received).toHaveLength(0);
      expect((await getAiUsage("author-1")).requests).toBe(0);
    });

    it("needs a model too, but not a fast one", async () => {
      delete process.env.OPENROUTER_MODEL;
      expect((await chat()).data.meta).toEqual({
        missing: ["OPENROUTER_MODEL"],
      });

      process.env.OPENROUTER_MODEL = "vendor/main";
      delete process.env.OPENROUTER_FAST_MODEL;
      expect((await chat()).status).toBe(200);
    });

    it("never gives the key away", async () => {
      delete process.env.OPENROUTER_MODEL;
      const response = await chat();
      expect(JSON.stringify(response.data)).not.toContain("server-key");
    });
  });

  describe("who can use it", () => {
    it("needs a signed in user", async () => {
      const response = await axios.post(
        `http://localhost:${ctx.port}/api/ai/chat`,
        body(),
        { validateStatus: () => true }
      );
      expect(response.status).toBe(401);
      expect(received).toHaveLength(0);
    });

    it("is only for authors of the scenario", async () => {
      const response = await chat(body(), "someone-else");
      expect(response.status).toBe(403);
      expect(response.data.error).toMatch(/authors/);
      expect(received).toHaveLength(0);
      expect((await getAiUsage("someone-else")).requests).toBe(0);
    });

    it("asks about the scenario in the request", async () => {
      await chat();
      expect(isAuthor).toHaveBeenLastCalledWith(SCENARIO, "author-1");
    });

    it("lets any author use it, not just the owner", async () => {
      expect((await chat(body(), "author-2")).status).toBe(200);
    });
  });

  describe("a bad request", () => {
    it.each([
      ["no messages", { messages: [] }],
      ["a scenario id that isn't one", { scenarioId: "nope" }],
      ["an unknown mode", { mode: "root" }],
      ["a model named by the caller", { model: "vendor/expensive" }],
    ])("is a 400: %s", async (name, extra) => {
      const response = await chat(body(extra));
      expect(response.status).toBe(400);
      expect(received).toHaveLength(0);
      expect((await getAiUsage("author-1")).requests).toBe(0);
    });

    it("is a 413 when it's too big", async () => {
      process.env.AI_MAX_INPUT_CHARS = "100";
      const response = await chat(
        body({ messages: [{ role: "user", content: "x".repeat(500) }] })
      );
      expect(response.status).toBe(413);
    });
  });

  describe("modes decide which tools the model is offered", () => {
    it("lets ask use the tools that only look", async () => {
      const response = await chat(
        body({ mode: "ask", tools: [tool("get_scene"), tool("run_checks")] })
      );
      expect(response.status).toBe(200);
      expect(received[0].body.tools.map((t) => t.function.name)).toEqual([
        "get_scene",
        "run_checks",
      ]);
    });

    it("refuses ask a tool that changes things", async () => {
      const response = await chat(
        body({ mode: "ask", tools: [tool("get_scene"), tool("move")] })
      );
      expect(response.status).toBe(403);
      expect(response.data.error).toBe(
        'The tool "move" isn\'t available in ask mode'
      );
      expect(received).toHaveLength(0);
      expect((await getAiUsage("author-1")).requests).toBe(0);
    });

    it("refuses ask a tool that deletes", async () => {
      const response = await chat(
        body({ mode: "ask", tools: [tool("delete_components")] })
      );
      expect(response.status).toBe(403);
    });

    it.each(["plan", "build"])("lets %s change and delete", async (mode) => {
      const response = await chat(
        body({
          mode,
          tools: [tool("add_button"), tool("delete_components")],
        })
      );
      expect(response.status).toBe(200);
    });

    it("keeps test and review to reading for now", async () => {
      for (const mode of ["test", "review"]) {
        expect(
          (await chat(body({ mode, tools: [tool("get_scene")] }))).status
        ).toBe(200);
        expect((await chat(body({ mode, tools: [tool("move")] }))).status).toBe(
          403
        );
      }
    });

    it("refuses a tool that doesn't exist", async () => {
      const response = await chat(body({ tools: [tool("format_disk")] }));
      expect(response.status).toBe(400);
      expect(response.data.error).toBe('Unknown tool "format_disk"');
    });

    it("refuses the model being told to use a tool the mode doesn't allow", async () => {
      const response = await chat(
        body({
          mode: "ask",
          tools: [tool("get_scene")],
          tool_choice: { type: "function", function: { name: "move" } },
        })
      );
      expect(response.status).toBe(400);
    });
  });

  describe("the reply", () => {
    it("is streamed through unchanged", async () => {
      const response = await chat(body(), "author-1", { responseType: "text" });

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/text\/event-stream/);
      expect(response.headers["cache-control"]).toMatch(/no-cache/);
      expect(response.data).toBe(REPLY.join(""));
    });

    it("arrives as it's written, not after it's finished", async () => {
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      respond = async (req, res) => {
        res.set("Content-Type", "text/event-stream");
        res.write(REPLY[0]);
        await gate;
        REPLY.slice(1).forEach((event) => res.write(event));
        res.end();
      };

      const response = await chat(body(), "author-1", {
        responseType: "stream",
      });
      const chunks = [];
      for await (const chunk of response.data) {
        chunks.push(chunk.toString());
        // the provider is still holding the rest back at this point
        if (chunks.length === 1) release();
      }

      expect(chunks[0]).toBe(REPLY[0]);
      expect(chunks.join("")).toBe(REPLY.join(""));
    });

    it("tells the editor how much of today's allowance is used", async () => {
      const first = await chat();
      expect(first.headers["x-ai-limit"]).toBe("3");
      expect(first.headers["x-ai-used"]).toBe("1");
      const second = await chat();
      expect(second.headers["x-ai-used"]).toBe("2");
      expect(second.headers["access-control-expose-headers"]).toMatch(
        /X-AI-Used/i
      );
    });
  });

  describe("what the provider is sent", () => {
    it("is signed with the server's key, never the author's login", async () => {
      await chat(body(), "author-1");

      const { headers } = received[0];
      expect(headers.authorization).toBe("Bearer server-key");
      expect(JSON.stringify(received[0])).not.toContain("author-1");
    });

    it("asks for a streamed reply with the cost included", async () => {
      await chat();
      expect(received[0].body).toMatchObject({
        model: "vendor/main",
        stream: true,
        stream_options: { include_usage: true },
        messages: [{ role: "user", content: "Make the title bigger" }],
      });
    });

    it("uses the fast model when asked, and falls back without one", async () => {
      await chat(body({ model: "fast" }));
      expect(received[0].body.model).toBe("vendor/fast");

      delete process.env.OPENROUTER_FAST_MODEL;
      await chat(body({ model: "fast" }));
      expect(received[1].body.model).toBe("vendor/main");
    });

    it("holds the reply to the server's size limit", async () => {
      process.env.AI_MAX_OUTPUT_TOKENS = "500";
      await chat(body({ max_tokens: 100000 }));
      await chat(body({ max_tokens: 50 }));
      expect(received.map((r) => r.body.max_tokens)).toEqual([500, 50]);
    });

    it("leaves out anything it wasn't meant to pass on", async () => {
      await chat(
        body({ provider: { order: ["x"] }, transforms: ["y"], user: "z" })
      );
      expect(Object.keys(received[0].body).sort()).toEqual([
        "max_tokens",
        "messages",
        "model",
        "stream",
        "stream_options",
      ]);
    });
  });

  describe("the daily limit", () => {
    it("allows each author a few a day, then stops with a 429", async () => {
      for (let i = 0; i < 3; i++) expect((await chat()).status).toBe(200);

      const response = await chat();
      expect(response.status).toBe(429);
      expect(response.data.error).toMatch(/all 3 of today's AI requests/);
      expect(response.data.meta.limit).toBe(3);
      expect(new Date(response.data.meta.resetsAt).getTime()).toBeGreaterThan(
        Date.now()
      );
      expect(Number(response.headers["retry-after"])).toBeGreaterThan(0);
      expect(received).toHaveLength(3);
    });

    it("counts each author on their own", async () => {
      for (let i = 0; i < 3; i++) await chat(body(), "author-1");
      expect((await chat(body(), "author-1")).status).toBe(429);
      expect((await chat(body(), "author-2")).status).toBe(200);
    });

    it("is kept in the database, so it holds when there's more than one server", async () => {
      await chat();
      await chat();
      expect((await getAiUsage("author-1")).requests).toBe(2);
    });

    it("records what the replies cost", async () => {
      await chat();
      // counted just after the reply ends
      await waitFor(
        async () => (await getAiUsage("author-1")).promptTokens === 42
      );
      expect(await getAiUsage("author-1")).toMatchObject({
        promptTokens: 42,
        completionTokens: 7,
      });
    });

    it("holds against requests made at the same time", async () => {
      const responses = await Promise.all(
        Array.from({ length: 8 }, () => chat())
      );
      expect(responses.filter((r) => r.status === 200)).toHaveLength(3);
      expect(responses.filter((r) => r.status === 429)).toHaveLength(5);
      expect(received).toHaveLength(3);
    });

    it("doesn't charge for a request the provider turned away", async () => {
      respond = (req, res) => res.status(500).json({ error: { message: "x" } });
      for (let i = 0; i < 5; i++) await chat();

      respond = (req, res) => streamReply(res);
      expect((await chat()).status).toBe(200);
      expect((await getAiUsage("author-1")).requests).toBe(1);
    });
  });

  describe("when the provider has a problem", () => {
    it.each([
      [401, 502, /credentials/],
      [403, 502, /credentials/],
      [402, 503, /credit/],
      [429, 429, /busy/],
      [500, 502, /couldn't handle/],
      [404, 502, /couldn't handle/],
    ])(
      "a %s from it becomes a %s for the author",
      async (upstream, expected, message) => {
        respond = (req, res) =>
          res
            .status(upstream)
            .set("Retry-After", "7")
            .json({
              error: { message: "Something sk-or-secret-key about it" },
            });

        const response = await chat();
        expect(response.status).toBe(expected);
        expect(response.data.error).toMatch(message);
        expect(response.data.meta.upstreamStatus).toBe(upstream);
      }
    );

    it("doesn't repeat what the provider said about the key", async () => {
      respond = (req, res) =>
        res
          .status(401)
          .json({ error: { message: "Invalid key sk-or-secret-key" } });

      const response = await chat();
      expect(JSON.stringify(response.data)).not.toContain("secret");
    });

    it("passes on why it couldn't handle a request, which helps whoever set it up", async () => {
      respond = (req, res) =>
        res
          .status(404)
          .json({ error: { message: "No endpoints support tool use" } });

      const response = await chat();
      expect(response.data.meta.message).toBe("No endpoints support tool use");
    });

    it("says when to try again if the provider is busy", async () => {
      respond = (req, res) =>
        res.status(429).set("Retry-After", "7").json({ error: {} });

      const response = await chat();
      expect(response.data.meta.retryAfter).toBe("7");
    });

    it("is a 502 if it can't be reached at all", async () => {
      process.env.OPENROUTER_BASE_URL = "http://localhost:1/v1";
      const response = await chat();
      expect(response.status).toBe(502);
      expect((await getAiUsage("author-1")).requests).toBe(0);
    });
  });

  describe("when the model takes too long", () => {
    it("is a 504 if it never starts replying, and isn't charged", async () => {
      process.env.AI_TIMEOUT_MS = "200";
      respond = () => {};

      const response = await chat();
      expect(response.status).toBe(504);
      expect((await getAiUsage("author-1")).requests).toBe(0);
    });

    it("is stopped part way, with the reason in the stream", async () => {
      process.env.AI_TIMEOUT_MS = "300";
      respond = (req, res) => {
        res.set("Content-Type", "text/event-stream");
        res.write(REPLY[0]);
        // and then goes quiet
      };

      const response = await chat(body(), "author-1", { responseType: "text" });
      expect(response.status).toBe(200);
      expect(response.data).toContain(REPLY[0]);
      expect(response.data).toContain('"code":"timeout"');
      await waitFor(() => logs.length === 1);
      expect(logs[0].outcome).toBe("timeout");
    });

    it("is cut off with the reason if the connection drops", async () => {
      respond = (req, res) => {
        res.set("Content-Type", "text/event-stream");
        res.write(REPLY[0]);
        setTimeout(() => res.destroy(), 30);
      };

      const response = await chat(body(), "author-1", { responseType: "text" });
      expect(response.data).toContain('"code":"interrupted"');
    });
  });

  describe("when the author gives up", () => {
    it("stops asking the provider", async () => {
      respond = (req, res) => {
        res.set("Content-Type", "text/event-stream");
        res.write(REPLY[0]);
        // stays open
      };

      const controller = new AbortController();
      const response = await chat(body(), "author-1", {
        responseType: "stream",
        signal: controller.signal,
      });
      await new Promise((resolve) => response.data.once("data", resolve));
      controller.abort();

      await waitFor(() => providerClosedEarly);
      expect(providerClosedEarly).toBe(true);
    });
  });

  describe("the log", () => {
    it("has one line per request: who, which model, the cost, how long, the tools used", async () => {
      respond = (req, res) =>
        streamReply(res, [
          data({
            choices: [
              {
                delta: {
                  tool_calls: [{ index: 0, function: { name: "get_scene" } }],
                },
              },
            ],
          }),
          data({
            choices: [],
            usage: { prompt_tokens: 300, completion_tokens: 20 },
          }),
          "data: [DONE]\n\n",
        ]);

      await chat(
        body({ mode: "ask", tools: [tool("get_scene"), tool("run_checks")] })
      );
      await waitFor(() => logs.length === 1);

      expect(logs[0]).toMatchObject({
        uid: "author-1",
        scenarioId: SCENARIO,
        mode: "ask",
        model: "vendor/main",
        outcome: "ok",
        status: 200,
        promptTokens: 300,
        completionTokens: 20,
        tools: ["get_scene"],
        toolsOffered: 2,
      });
      expect(typeof logs[0].latencyMs).toBe("number");
    });

    it("doesn't include what was typed", async () => {
      await chat(
        body({
          messages: [
            { role: "system", content: "SECRET SCENARIO TEXT" },
            { role: "user", content: "Make the title bigger" },
          ],
        })
      );
      await waitFor(() => logs.length === 1);

      const line = JSON.stringify(logs[0]);
      expect(line).not.toContain("SECRET SCENARIO TEXT");
      expect(line).not.toContain("Make the title bigger");
    });

    it("can include it, when turned on", async () => {
      process.env.AI_LOG_CONTENT = "true";
      await chat();
      await waitFor(() => logs.length === 1);
      expect(JSON.stringify(logs[0].content)).toContain(
        "Make the title bigger"
      );
    });

    it("never includes the key or the author's login", async () => {
      await chat();
      await waitFor(() => logs.length === 1);
      expect(JSON.stringify(logs[0])).not.toContain("server-key");
    });

    it("notes a failure, and what the provider said", async () => {
      respond = (req, res) => res.status(429).json({ error: {} });
      await chat();
      await waitFor(() => logs.length === 1);

      expect(logs[0]).toMatchObject({
        outcome: "failed",
        status: 429,
        upstreamStatus: 429,
      });
    });

    it("doesn't log requests that were refused before they got anywhere", async () => {
      await chat(body(), "someone-else");
      await chat(body({ mode: "root" }));
      await wait(30);
      expect(logs).toHaveLength(0);
    });
  });
});
