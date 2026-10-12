import type { ToolDefinitionLike } from "./tools";

// For models that don't call tools natively (or do it badly), the assistant
// can ask for the call as JSON in the reply text instead:
//
//   {"tool": "move", "arguments": {"targets": ["abc12345"], "x": 100}}
//
// This writes the tools out for the prompt and reads such calls back.

type Loose = Record<string, unknown>;

const isObject = (value: unknown): value is Loose =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function typeOf(schema: unknown): string {
  if (!isObject(schema)) return "any";
  if (Array.isArray(schema.enum))
    return schema.enum.map((value) => JSON.stringify(value)).join(" | ");
  if (schema.type === "array") return `${typeOf(schema.items)}[]`;
  if (schema.type === "object") return fields(schema) || "object";
  if (Array.isArray(schema.type)) return schema.type.join(" | ");
  return typeof schema.type === "string" ? schema.type : "any";
}

function fields(schema: Loose): string {
  const properties = isObject(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  const parts = Object.entries(properties).map(
    ([name, value]) =>
      `${name}${required.includes(name) ? "" : "?"}: ${typeOf(value)}`
  );
  return parts.length ? `{ ${parts.join(", ")} }` : "";
}

/** The tools as a list in words, with what each takes. */
export function describeTools(tools: ToolDefinitionLike[]) {
  return tools
    .map(({ function: fn }) => {
      const parameters = isObject(fn.parameters) ? fn.parameters : {};
      return `- ${fn.name} ${fields(parameters) || "{}"}\n  ${fn.description}`;
    })
    .join("\n");
}

export interface ParsedCall {
  name: string;
  arguments: unknown;
}

function callFrom(value: unknown): ParsedCall | null {
  if (!isObject(value)) return null;

  const fn = isObject(value.function) ? value.function : value;
  const name = [fn.tool, fn.name, fn.function].find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate !== ""
  );
  if (!name) return null;

  const raw = fn.arguments ?? fn.args ?? fn.parameters ?? fn.input ?? {};
  return { name, arguments: raw };
}

function callsFrom(value: unknown): ParsedCall[] | null {
  if (Array.isArray(value)) {
    const calls = value.map(callFrom);
    return calls.length && calls.every(Boolean)
      ? (calls as ParsedCall[])
      : null;
  }
  if (isObject(value) && Array.isArray(value.tool_calls))
    return callsFrom(value.tool_calls);
  const single = callFrom(value);
  return single ? [single] : null;
}

/** Every top-level {...} or [...] in the text that parses as JSON. */
function jsonValues(text: string) {
  const found: { value: unknown; start: number; end: number }[] = [];
  for (let start = 0; start < text.length; start++) {
    const open = text[start];
    if (open !== "{" && open !== "[") continue;
    const close = open === "{" ? "}" : "]";

    let depth = 0;
    let inString = false;
    for (let end = start; end < text.length; end++) {
      const char = text[end];
      if (inString) {
        if (char === "\\") end++;
        else if (char === '"') inString = false;
      } else if (char === '"') inString = true;
      else if (char === open) depth++;
      else if (char === close && --depth === 0) {
        try {
          found.push({
            value: JSON.parse(text.slice(start, end + 1)),
            start,
            end: end + 1,
          });
          start = end;
        } catch {
          // not JSON after all; carry on from the next character
        }
        break;
      }
    }
  }
  return found;
}

/**
 * Finds tool calls written into a reply as JSON, inside a code block or just
 * in the text. Returns them and the rest of the reply, or null if there are
 * none.
 */
export function parseTextToolCalls(
  text: string,
  knownTools: string[]
): { calls: ParsedCall[]; rest: string } | null {
  const calls: ParsedCall[] = [];
  let rest = text;

  // work from the end so earlier positions stay put while text is cut out
  for (const { value, start, end } of jsonValues(text).reverse()) {
    const parsed = callsFrom(value);
    if (!parsed || !parsed.every((call) => knownTools.includes(call.name)))
      continue;
    calls.unshift(...parsed);
    rest = rest.slice(0, start) + rest.slice(end);
  }
  if (!calls.length) return null;

  rest = rest
    .replace(/```(?:json)?\s*```/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { calls, rest };
}
