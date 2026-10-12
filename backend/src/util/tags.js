import { HttpStatusCode } from "axios";
import { HttpError } from "./error.js";

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

/**
 * Turns whatever a client sent for tags into a clean list: lowercase, trimmed,
 * no leading `#`, no duplicates, at most MAX_TAGS tags of MAX_TAG_LENGTH
 * characters. Accepts a comma separated string or an array of strings.
 * Anything else (including nothing) is no tags.
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normaliseTags(raw) {
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(",")
      : [];

  const tags = [];
  for (const item of items) {
    if (typeof item !== "string") continue;
    const tag = item
      .trim()
      .replace(/^#+/, "")
      .replace(/\s+/g, " ")
      .slice(0, MAX_TAG_LENGTH)
      .trim()
      .toLowerCase();
    if (tag && !tags.includes(tag)) tags.push(tag);
    if (tags.length === MAX_TAGS) break;
  }
  return tags;
}

/**
 * Like normaliseTags, but rejects a value that isn't a string or an array,
 * rather than quietly treating it as no tags. Nothing at all is fine.
 * @param {unknown} raw
 * @returns {string[]}
 */
export function parseTags(raw) {
  if (raw === undefined || raw === null) return [];
  if (typeof raw !== "string" && !Array.isArray(raw))
    throw new HttpError(
      "tags must be a string or a list of strings",
      HttpStatusCode.BadRequest
    );
  return normaliseTags(raw);
}
