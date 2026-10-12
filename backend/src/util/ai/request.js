import { HttpError } from "../error.js";
import STATUS from "../status.js";
import { isValidObjectId } from "../validation.js";
import { isKnownTool, isMode, isToolAllowed } from "./modes.js";

// Checks a chat request from the editor and turns it into what is sent to the
// model provider. Only fields we know are passed on, so a client can't pick
// the model, ask for provider options or change who is billed.

const ROLES = ["system", "user", "assistant", "tool"];
const MAX_MESSAGES = 300;
const MAX_TOOLS = 100;
const TOOL_CHOICES = ["auto", "none", "required"];

function bad(message, status = STATUS.BAD_REQUEST) {
  return new HttpError(message, status);
}

function checkMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0)
    throw bad("messages must be a list with at least one message");
  if (messages.length > MAX_MESSAGES)
    throw bad(`messages can have at most ${MAX_MESSAGES} messages`);

  messages.forEach((message, index) => {
    if (!message || typeof message !== "object" || Array.isArray(message))
      throw bad(`message ${index + 1} must be an object`);
    if (!ROLES.includes(message.role))
      throw bad(`message ${index + 1} has an unknown role`);
    const { content } = message;
    if (
      content !== null &&
      content !== undefined &&
      typeof content !== "string" &&
      !Array.isArray(content)
    )
      throw bad(`message ${index + 1} has content that isn't text`);
  });
}

function checkTools(tools, mode) {
  if (tools === undefined) return [];
  if (!Array.isArray(tools)) throw bad("tools must be a list");
  if (tools.length > MAX_TOOLS)
    throw bad(`tools can have at most ${MAX_TOOLS} tools`);

  tools.forEach((tool, index) => {
    const name = tool?.function?.name;
    if (tool?.type !== "function" || typeof name !== "string")
      throw bad(`tool ${index + 1} must be a function with a name`);
    if (!isKnownTool(name)) throw bad(`Unknown tool "${name}"`);
    if (!isToolAllowed(mode, name))
      throw bad(
        `The tool "${name}" isn't available in ${mode} mode`,
        STATUS.FORBIDDEN
      );
  });
  return tools.map((tool) => tool.function.name);
}

function checkToolChoice(toolChoice, offered) {
  if (toolChoice === undefined) return undefined;
  if (TOOL_CHOICES.includes(toolChoice)) return toolChoice;

  const name = toolChoice?.function?.name;
  if (toolChoice?.type === "function" && typeof name === "string") {
    if (!offered.includes(name))
      throw bad(`tool_choice names "${name}", which isn't one of the tools`);
    return { type: "function", function: { name } };
  }
  throw bad("tool_choice must be auto, none, required or a tool");
}

/**
 * @param {object} body the request body
 * @param {ReturnType<import("./config.js").aiConfig>} config
 * @returns the validated request: `scenarioId`, `mode`, `toolNames`, and
 *   `upstream`, the body to send to the provider
 */
export function parseChatRequest(body, config) {
  if (!body || typeof body !== "object") throw bad("a request body is needed");

  const { scenarioId, mode, messages, tools, model = "main" } = body;
  if (typeof scenarioId !== "string" || !isValidObjectId(scenarioId))
    throw bad("scenarioId must be a scenario id");
  if (!isMode(mode)) throw bad("mode must be ask, plan, build, test or review");
  if (model !== "main" && model !== "fast")
    throw bad('model must be "main" or "fast"');

  checkMessages(messages);
  const toolNames = checkTools(tools, mode);
  const toolChoice = checkToolChoice(body.tool_choice, toolNames);

  const size = JSON.stringify({ messages, tools }).length;
  if (size > config.maxInputChars)
    throw bad(
      `The request is too big (${size} characters, the most is ${config.maxInputChars})`,
      STATUS.PAYLOAD_TOO_LARGE
    );

  const asked = Number.isInteger(body.max_tokens) ? body.max_tokens : null;
  const maxTokens =
    asked && asked > 0
      ? Math.min(asked, config.maxOutputTokens)
      : config.maxOutputTokens;

  const upstream = {
    model:
      model === "fast" && config.fastModel ? config.fastModel : config.model,
    messages,
    stream: true,
    stream_options: { include_usage: true },
    max_tokens: maxTokens,
  };
  if (toolNames.length) upstream.tools = tools;
  if (toolChoice !== undefined && toolNames.length)
    upstream.tool_choice = toolChoice;
  if (typeof body.temperature === "number") {
    if (!(body.temperature >= 0 && body.temperature <= 2))
      throw bad("temperature must be between 0 and 2");
    upstream.temperature = body.temperature;
  }

  return { scenarioId, mode, model, toolNames, upstream };
}
