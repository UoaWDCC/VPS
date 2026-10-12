import AiUsage from "../models/aiUsage.js";

const KEEP_DAYS = 35;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The UTC day a moment falls in, like "2026-10-12". */
export const dayOf = (now = new Date()) => now.toISOString().slice(0, 10);

/** When the day after `now` begins (UTC), which is when the limit resets. */
export const nextDayStart = (now = new Date()) =>
  new Date(Date.parse(`${dayOf(now)}T00:00:00.000Z`) + DAY_MS);

const idFor = (uid, day) => `${uid}:${day}`;

/**
 * Counts one AI request against an author's daily limit, if there's room.
 *
 * The update only matches while the author is under the limit. Once they're
 * not, it tries to create today's document, which already exists, and Mongo's
 * duplicate key error is how we know the limit is reached.
 *
 * @returns {Promise<{ allowed: boolean, used: number, limit: number, resetsAt: Date }>}
 */
export const takeAiRequest = async (uid, limit, now = new Date()) => {
  const day = dayOf(now);
  const resetsAt = nextDayStart(now);

  try {
    const usage = await AiUsage.findOneAndUpdate(
      { _id: idFor(uid, day), requests: { $lt: limit } },
      {
        $inc: { requests: 1 },
        $setOnInsert: {
          uid,
          day,
          expiresAt: new Date(resetsAt.getTime() + KEEP_DAYS * DAY_MS),
        },
      },
      { upsert: true, new: true }
    ).lean();
    return { allowed: true, used: usage.requests, limit, resetsAt };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return { allowed: false, used: limit, limit, resetsAt };
  }
};

/** Gives back a request that never reached the model, so it isn't charged. */
export const refundAiRequest = async (uid, now = new Date()) => {
  await AiUsage.updateOne(
    { _id: idFor(uid, dayOf(now)), requests: { $gt: 0 } },
    { $inc: { requests: -1 } }
  );
};

/** Adds what a reply cost, for the record. */
export const recordAiTokens = async (
  uid,
  { promptTokens = 0, completionTokens = 0 },
  now = new Date()
) => {
  await AiUsage.updateOne(
    { _id: idFor(uid, dayOf(now)) },
    { $inc: { promptTokens, completionTokens } }
  );
};

/** What an author has used today. */
export const getAiUsage = async (uid, now = new Date()) => {
  const usage = await AiUsage.findById(idFor(uid, dayOf(now))).lean();
  return {
    requests: usage?.requests ?? 0,
    promptTokens: usage?.promptTokens ?? 0,
    completionTokens: usage?.completionTokens ?? 0,
  };
};
