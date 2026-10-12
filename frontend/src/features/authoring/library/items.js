import { KINDS } from "./presets.js";

// What the panel shows is a flat list of "items": presets and the user's
// uploads, in one shape, so searching and grouping don't care which is which.

/** @typedef {import("./presets.js").Kind} Kind */
/** @typedef {import("./presets.js").PresetItem} PresetItem */
/**
 * An uploaded file, as the API returns it.
 * @typedef {{
 *   _id: string,
 *   name: string,
 *   type: "image" | "audio" | "document",
 *   tags: string[],
 *   url: string,
 *   size: number,
 *   contentType: string,
 * }} Asset
 */
/**
 * @typedef {{
 *   key: string,
 *   source: "upload",
 *   kind: "image" | "audio" | "document",
 *   name: string,
 *   tags: string[],
 *   url: string,
 *   size: number,
 *   asset: Asset,
 * }} UploadItem
 */
/** @typedef {PresetItem | UploadItem} LibraryItem */
/** @typedef {{ id: string, title: string, items: LibraryItem[] }} Section */

/**
 * The heading each kind of thing goes under.
 * @type {Record<Kind, string>}
 */
export const KIND_LABELS = {
  button: "Buttons",
  image: "Images",
  audio: "Sounds",
  document: "Documents",
};

/** @type {{ id: "all" | Kind, label: string }[]} */
export const FILTERS = [
  { id: "all", label: "All" },
  ...KINDS.map((kind) => ({ id: kind, label: KIND_LABELS[kind] })),
];

/**
 * An uploaded asset as a library item.
 * @param {Asset} asset
 * @returns {UploadItem}
 */
export function assetToItem(asset) {
  return {
    key: `asset:${asset._id}`,
    source: "upload",
    kind: asset.type,
    name: asset.name,
    tags: asset.tags ?? [],
    url: asset.url,
    size: asset.size,
    asset,
  };
}

/**
 * Search text as lowercase words, ignoring the `#` people put on tags.
 * @param {string} [query]
 * @returns {string[]}
 */
export function searchWords(query) {
  return (query ?? "")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^#+/, ""))
    .filter(Boolean);
}

/**
 * @param {LibraryItem} item
 * @param {string[]} words
 */
function matches(item, words) {
  const name = item.name.toLowerCase();
  const tags = item.tags.map((tag) => tag.toLowerCase());
  return words.every(
    (word) => name.includes(word) || tags.some((tag) => tag.includes(word))
  );
}

/**
 * The items of a kind (or all of them) whose name or tags contain every word
 * of the query. No query matches everything. Order is kept.
 *
 * @param {LibraryItem[]} items
 * @param {{ query?: string, kind?: "all" | Kind }} [options]
 * @returns {LibraryItem[]}
 */
export function filterItems(items, { query = "", kind = "all" } = {}) {
  const words = searchWords(query);
  return items.filter(
    (item) => (kind === "all" || item.kind === kind) && matches(item, words)
  );
}

/**
 * Items under headings: the user's uploads first, then the presets by kind.
 * Empty sections are left out.
 *
 * @param {LibraryItem[]} items
 * @returns {Section[]}
 */
export function groupItems(items) {
  /** @type {Section[]} */
  const sections = [
    {
      id: "uploads",
      title: "My uploads",
      items: items.filter((item) => item.source === "upload"),
    },
    ...KINDS.map((kind) => ({
      id: kind,
      title: KIND_LABELS[kind],
      items: items.filter(
        (item) => item.source === "preset" && item.kind === kind
      ),
    })),
  ];
  return sections.filter((section) => section.items.length > 0);
}
