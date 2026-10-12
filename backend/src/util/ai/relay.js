import { once } from "node:events";
import { HttpError } from "../error.js";
import STATUS from "../status.js";
import { createStreamTap } from "./stream.js";

// Sends a chat request to the model provider (OpenRouter, or anything that
// speaks the same OpenAI-style API) and passes the streamed reply straight on
// to the browser, as it arrives.
//
// Before the first byte reaches the browser a problem is an HttpError, so the
// caller can answer properly (and not charge the author for it). Once the
// stream has started the status can't change, so a problem becomes an `error`
// event in the stream, the same shape the provider itself uses.

const SNIPPET = 200;

/** The message in a provider's error body, if it has one. */
async function providerMessage(response) {
  try {
    const text = (await response.text()).slice(0, 2000);
    const message = JSON.parse(text)?.error?.message;
    return typeof message === "string" ? message.slice(0, SNIPPET) : undefined;
  } catch {
    return undefined;
  }
}

/** What the browser is told about a provider that refused the request. */
async function refusal(response) {
  const { status } = response;
  const meta = { upstreamStatus: status };

  if (status === 401 || status === 403)
    // our key's problem, not the author's, and not something to describe
    return new HttpError(
      "The AI provider didn't accept this server's credentials. Tell whoever runs the server.",
      STATUS.BAD_GATEWAY,
      meta
    );
  if (status === 402)
    return new HttpError(
      "The AI provider says the server's account is out of credit. Tell whoever runs the server.",
      STATUS.SERVICE_UNAVAILABLE,
      meta
    );
  if (status === 429)
    return new HttpError(
      "The AI provider is busy right now. Try again in a moment.",
      STATUS.TOO_MANY_REQUESTS,
      { ...meta, retryAfter: response.headers.get("retry-after") ?? undefined }
    );

  const message = await providerMessage(response);
  return new HttpError(
    "The AI provider couldn't handle the request.",
    STATUS.BAD_GATEWAY,
    message ? { ...meta, message } : meta
  );
}

function streamError(res, message, code) {
  if (res.writableEnded || res.destroyed) return;
  res.write(`data: ${JSON.stringify({ error: { message, code } })}\n\n`);
}

/** Waits for the browser to take more data, or to go away. */
async function drained(res) {
  await Promise.race([once(res, "drain"), once(res, "close")]);
}

/**
 * @param {object} args
 * @param {ReturnType<import("./config.js").aiConfig>} args.config
 * @param {object} args.body the request for the provider
 * @param {import("express").Response} args.res
 * @param {Record<string, string>} [args.headers] extra headers for the reply
 * @returns {Promise<{ outcome: string, usage, toolNames: string[], error }>}
 *   how it ended: "ok", "provider_error" (the provider reported a problem
 *   inside the stream), "timeout", "interrupted" or "client_closed"
 * @throws {HttpError} if it failed before anything was sent
 */
export async function relayChat({ config, body, res, headers = {} }) {
  const controller = new AbortController();
  let stoppedBy = null;
  const stop = (reason) => {
    stoppedBy ??= reason;
    controller.abort();
  };

  const timer = setTimeout(() => stop("timeout"), config.timeoutMs);
  const onClose = () => {
    if (!res.writableEnded) stop("client");
  };
  res.on("close", onClose);

  try {
    let response;
    try {
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "VPS",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw stoppedBy === "timeout"
        ? new HttpError(
            "The AI took too long to start replying.",
            STATUS.GATEWAY_TIMEOUT
          )
        : new HttpError("Couldn't reach the AI provider.", STATUS.BAD_GATEWAY);
    }

    if (!response.ok) throw await refusal(response);
    if (!response.body)
      throw new HttpError(
        "The AI provider sent nothing back.",
        STATUS.BAD_GATEWAY
      );

    res.status(STATUS.OK).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      ...headers,
    });
    res.flushHeaders();

    const tap = createStreamTap();
    const done = (outcome) => ({ outcome, ...tap.result() });

    try {
      for await (const chunk of response.body) {
        tap.push(chunk);
        if (!res.write(chunk)) await drained(res);
        if (res.destroyed) stop("client");
      }
      tap.end();
      res.end();
      return done(tap.result().error ? "provider_error" : "ok");
    } catch {
      tap.end();
      if (stoppedBy === "client") return done("client_closed");
      if (stoppedBy === "timeout") {
        streamError(res, "The AI took too long, so it was stopped.", "timeout");
        res.end();
        return done("timeout");
      }
      streamError(
        res,
        "The connection to the AI was interrupted.",
        "interrupted"
      );
      res.end();
      return done("interrupted");
    }
  } finally {
    clearTimeout(timer);
    res.off("close", onClose);
    // leave nothing running if we're leaving early
    if (!controller.signal.aborted) controller.abort();
  }
}
