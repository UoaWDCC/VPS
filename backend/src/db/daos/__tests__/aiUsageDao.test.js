import { describe, expect, it } from "@jest/globals";

import AiUsage from "../../models/aiUsage.js";
import { useMongoMemoryServer } from "../../../test/testSetup.js";
import {
  dayOf,
  getAiUsage,
  nextDayStart,
  recordAiTokens,
  refundAiRequest,
  takeAiRequest,
} from "../aiUsageDao.js";

const MORNING = new Date("2026-10-12T09:30:00.000Z");
const LATE = new Date("2026-10-12T23:59:59.000Z");
const NEXT_DAY = new Date("2026-10-13T00:00:01.000Z");

describe("aiUsageDao", () => {
  useMongoMemoryServer();

  describe("days", () => {
    it("are UTC days, and reset at the next UTC midnight", () => {
      expect(dayOf(MORNING)).toBe("2026-10-12");
      expect(dayOf(LATE)).toBe("2026-10-12");
      expect(dayOf(NEXT_DAY)).toBe("2026-10-13");
      expect(nextDayStart(MORNING).toISOString()).toBe(
        "2026-10-13T00:00:00.000Z"
      );
      expect(nextDayStart(LATE).toISOString()).toBe("2026-10-13T00:00:00.000Z");
    });
  });

  describe("takeAiRequest", () => {
    it("counts requests up to the limit, then says no", async () => {
      const results = [];
      for (let i = 0; i < 4; i++)
        results.push(await takeAiRequest("uid-a", 3, MORNING));

      expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
      expect(results.map((r) => r.used)).toEqual([1, 2, 3, 3]);
      expect(results[3]).toMatchObject({
        limit: 3,
        resetsAt: new Date("2026-10-13T00:00:00.000Z"),
      });
    });

    it("keeps counting nothing more once the limit is reached", async () => {
      for (let i = 0; i < 6; i++) await takeAiRequest("uid-a", 2, MORNING);
      expect((await getAiUsage("uid-a", MORNING)).requests).toBe(2);
    });

    it("counts each author on their own", async () => {
      await takeAiRequest("uid-a", 1, MORNING);
      expect((await takeAiRequest("uid-a", 1, MORNING)).allowed).toBe(false);
      expect((await takeAiRequest("uid-b", 1, MORNING)).allowed).toBe(true);
    });

    it("starts again each day", async () => {
      await takeAiRequest("uid-a", 1, MORNING);
      expect((await takeAiRequest("uid-a", 1, LATE)).allowed).toBe(false);
      expect((await takeAiRequest("uid-a", 1, NEXT_DAY)).allowed).toBe(true);
    });

    it("can't be raced past the limit by requests made at the same moment", async () => {
      const results = await Promise.all(
        Array.from({ length: 20 }, () => takeAiRequest("uid-a", 5, MORNING))
      );
      expect(results.filter((r) => r.allowed)).toHaveLength(5);
      expect((await getAiUsage("uid-a", MORNING)).requests).toBe(5);
    });

    it("keeps its record for a while, then lets Mongo delete it", async () => {
      await takeAiRequest("uid-a", 5, MORNING);
      const record = await AiUsage.findById("uid-a:2026-10-12").lean();
      expect(record).toMatchObject({ uid: "uid-a", day: "2026-10-12" });
      expect(record.expiresAt.getTime()).toBeGreaterThan(
        nextDayStart(MORNING).getTime()
      );
    });
  });

  describe("refundAiRequest", () => {
    it("gives a request back", async () => {
      await takeAiRequest("uid-a", 1, MORNING);
      await refundAiRequest("uid-a", MORNING);
      expect((await takeAiRequest("uid-a", 1, MORNING)).allowed).toBe(true);
    });

    it("never goes below nothing used", async () => {
      await takeAiRequest("uid-a", 5, MORNING);
      await refundAiRequest("uid-a", MORNING);
      await refundAiRequest("uid-a", MORNING);
      expect((await getAiUsage("uid-a", MORNING)).requests).toBe(0);
    });

    it("does nothing for someone who hasn't used any", async () => {
      await expect(refundAiRequest("nobody", MORNING)).resolves.toBeUndefined();
    });
  });

  describe("recordAiTokens", () => {
    it("adds up what replies cost", async () => {
      await takeAiRequest("uid-a", 5, MORNING);
      await recordAiTokens(
        "uid-a",
        { promptTokens: 100, completionTokens: 10 },
        MORNING
      );
      await recordAiTokens(
        "uid-a",
        { promptTokens: 50, completionTokens: 5 },
        MORNING
      );
      expect(await getAiUsage("uid-a", MORNING)).toEqual({
        requests: 1,
        promptTokens: 150,
        completionTokens: 15,
      });
    });
  });

  describe("getAiUsage", () => {
    it("is all zeros for someone who hasn't used it today", async () => {
      expect(await getAiUsage("nobody", MORNING)).toEqual({
        requests: 0,
        promptTokens: 0,
        completionTokens: 0,
      });
    });
  });
});
