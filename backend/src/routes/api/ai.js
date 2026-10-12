import { Router } from "express";
import auth from "../../middleware/firebaseAuth.js";
import { isAuthor } from "../../middleware/scenarioAuth.js";
import {
  recordAiTokens,
  refundAiRequest,
  takeAiRequest,
} from "../../db/daos/aiUsageDao.js";
import { aiConfig, missingSettings } from "../../util/ai/config.js";
import { logAiRequest } from "../../util/ai/log.js";
import { parseChatRequest } from "../../util/ai/request.js";
import { relayChat } from "../../util/ai/relay.js";
import { handle, HttpError } from "../../util/error.js";
import STATUS from "../../util/status.js";

const router = Router();

router.use(auth);

/**
 * @route POST /api/ai/chat
 * @desc The AI assistant's gateway to the model. The editor sends an
 * OpenAI-style chat request plus the scenario and the mode it's working in;
 * the reply is streamed back as it's written. The server holds the provider
 * key, checks the caller is an author of the scenario, only allows the tools
 * the mode permits, and limits how much each author can use per day.
 */
router.post(
  "/chat",
  handle(async (req, res) => {
    const config = aiConfig();
    const missing = missingSettings(config);
    if (missing.length)
      throw new HttpError(
        "The AI assistant isn't set up on this server yet.",
        STATUS.SERVICE_UNAVAILABLE,
        { missing }
      );

    const request = parseChatRequest(req.body, config);

    if (!(await isAuthor(request.scenarioId, req.uid)))
      throw new HttpError(
        "Only the authors of a scenario can use the AI assistant on it.",
        STATUS.FORBIDDEN
      );

    const startedAt = Date.now();
    const now = new Date();
    const quota = await takeAiRequest(req.uid, config.dailyLimit, now);
    if (!quota.allowed) {
      res.set(
        "Retry-After",
        String(Math.ceil((quota.resetsAt.getTime() - now.getTime()) / 1000))
      );
      throw new HttpError(
        `You've used all ${quota.limit} of today's AI requests. They reset at midnight UTC.`,
        STATUS.TOO_MANY_REQUESTS,
        { limit: quota.limit, resetsAt: quota.resetsAt.toISOString() }
      );
    }

    const entry = {
      uid: req.uid,
      scenarioId: request.scenarioId,
      mode: request.mode,
      model: request.upstream.model,
      toolsOffered: request.toolNames.length,
    };
    if (config.logContent) entry.content = request.upstream.messages;

    let result;
    try {
      result = await relayChat({
        config,
        body: request.upstream,
        res,
        headers: {
          "X-AI-Limit": String(quota.limit),
          "X-AI-Used": String(quota.used),
          "Access-Control-Expose-Headers": "X-AI-Limit, X-AI-Used",
        },
      });
    } catch (error) {
      // nothing reached the model's reply to the author, so it doesn't count
      await refundAiRequest(req.uid, now).catch(() => {});
      logAiRequest({
        ...entry,
        outcome: "failed",
        status: error.status ?? STATUS.INTERNAL_SERVER_ERROR,
        upstreamStatus: error.meta?.upstreamStatus,
        latencyMs: Date.now() - startedAt,
      });
      throw error;
    }

    const usage = result.usage ?? { promptTokens: 0, completionTokens: 0 };
    await recordAiTokens(req.uid, usage, now).catch(() => {});
    logAiRequest({
      ...entry,
      outcome: result.outcome,
      status: STATUS.OK,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      tools: result.toolNames,
      latencyMs: Date.now() - startedAt,
    });
  })
);

export default router;
