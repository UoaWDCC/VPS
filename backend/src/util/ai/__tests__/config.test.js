import { describe, expect, it } from "@jest/globals";

import { aiConfig, missingSettings } from "../config.js";

describe("aiConfig", () => {
  it("has sensible limits when nothing is set", () => {
    expect(aiConfig({})).toEqual({
      apiKey: undefined,
      model: undefined,
      fastModel: undefined,
      baseUrl: "https://openrouter.ai/api/v1",
      dailyLimit: 200,
      maxOutputTokens: 4096,
      maxInputChars: 600000,
      timeoutMs: 120000,
      logContent: false,
    });
  });

  it("reads what is set", () => {
    const config = aiConfig({
      OPENROUTER_API_KEY: " key ",
      OPENROUTER_MODEL: "vendor/main:free",
      OPENROUTER_FAST_MODEL: "vendor/fast:free",
      OPENROUTER_BASE_URL: "http://localhost:9/v1///",
      AI_DAILY_LIMIT: "5",
      AI_MAX_OUTPUT_TOKENS: "100",
      AI_MAX_INPUT_CHARS: "2000",
      AI_TIMEOUT_MS: "1500",
      AI_LOG_CONTENT: "true",
    });
    expect(config).toEqual({
      apiKey: "key",
      model: "vendor/main:free",
      fastModel: "vendor/fast:free",
      baseUrl: "http://localhost:9/v1",
      dailyLimit: 5,
      maxOutputTokens: 100,
      maxInputChars: 2000,
      timeoutMs: 1500,
      logContent: true,
    });
  });

  it("falls back to the default for a number that makes no sense", () => {
    const config = aiConfig({
      AI_DAILY_LIMIT: "lots",
      AI_TIMEOUT_MS: "-5",
      AI_MAX_OUTPUT_TOKENS: "0",
    });
    expect(config.dailyLimit).toBe(200);
    expect(config.timeoutMs).toBe(120000);
    expect(config.maxOutputTokens).toBe(4096);
  });

  it("only logs content when told to, exactly", () => {
    expect(aiConfig({ AI_LOG_CONTENT: "yes" }).logContent).toBe(false);
    expect(aiConfig({ AI_LOG_CONTENT: "1" }).logContent).toBe(false);
  });
});

describe("missingSettings", () => {
  it("names what is needed and not set", () => {
    expect(missingSettings(aiConfig({}))).toEqual([
      "OPENROUTER_API_KEY",
      "OPENROUTER_MODEL",
    ]);
    expect(missingSettings(aiConfig({ OPENROUTER_API_KEY: "k" }))).toEqual([
      "OPENROUTER_MODEL",
    ]);
    expect(
      missingSettings(
        aiConfig({ OPENROUTER_API_KEY: "  ", OPENROUTER_MODEL: "m" })
      )
    ).toEqual(["OPENROUTER_API_KEY"]);
  });

  it("is happy when the fast model is missing", () => {
    expect(
      missingSettings(
        aiConfig({ OPENROUTER_API_KEY: "k", OPENROUTER_MODEL: "m" })
      )
    ).toEqual([]);
  });
});
