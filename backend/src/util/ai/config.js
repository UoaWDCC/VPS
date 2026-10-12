// The AI assistant's settings, from the environment. Read on every request,
// not at start-up, so a change of settings needs no code change and tests can
// set what they need.
//
//   OPENROUTER_API_KEY     the server's key for OpenRouter (required)
//   OPENROUTER_MODEL       the main model, e.g. a free model with tool use (required)
//   OPENROUTER_FAST_MODEL  a smaller, quicker model for simple requests (optional)
//   OPENROUTER_BASE_URL    where to send requests (optional, OpenRouter by default)
//   AI_DAILY_LIMIT         requests per author per UTC day (optional, 200)
//   AI_MAX_OUTPUT_TOKENS   most tokens the model may write in one reply (optional, 4096)
//   AI_MAX_INPUT_CHARS     biggest request body accepted, in characters (optional, 600000)
//   AI_TIMEOUT_MS          longest a request may take in total (optional, 120000)
//   AI_LOG_CONTENT         "true" to also log what was sent (optional, off)

const DEFAULTS = {
  baseUrl: "https://openrouter.ai/api/v1",
  dailyLimit: 200,
  maxOutputTokens: 4096,
  maxInputChars: 600_000,
  timeoutMs: 120_000,
};

function positiveInt(raw, fallback) {
  const number = Number.parseInt(raw, 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function text(raw) {
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

export function aiConfig(env = process.env) {
  return {
    apiKey: text(env.OPENROUTER_API_KEY),
    model: text(env.OPENROUTER_MODEL),
    fastModel: text(env.OPENROUTER_FAST_MODEL),
    baseUrl: (text(env.OPENROUTER_BASE_URL) ?? DEFAULTS.baseUrl).replace(
      /\/+$/,
      ""
    ),
    dailyLimit: positiveInt(env.AI_DAILY_LIMIT, DEFAULTS.dailyLimit),
    maxOutputTokens: positiveInt(
      env.AI_MAX_OUTPUT_TOKENS,
      DEFAULTS.maxOutputTokens
    ),
    maxInputChars: positiveInt(env.AI_MAX_INPUT_CHARS, DEFAULTS.maxInputChars),
    timeoutMs: positiveInt(env.AI_TIMEOUT_MS, DEFAULTS.timeoutMs),
    logContent: env.AI_LOG_CONTENT === "true",
  };
}

/** The required settings that aren't set. */
export function missingSettings(config) {
  return [
    ["OPENROUTER_API_KEY", config.apiKey],
    ["OPENROUTER_MODEL", config.model],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}
