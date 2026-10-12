import assert from "node:assert/strict";
import test from "node:test";

import { assetToItem, filterItems, groupItems, searchWords } from "./items.js";
import { PRESET_ITEMS } from "./presets.js";

const upload = (name, type, tags = []) =>
  assetToItem({
    _id: name,
    name,
    type,
    tags,
    url: `https://x/${name}`,
    size: 1,
  });

const uploads = [
  upload("Ward round.png", "image", ["ward", "hospital"]),
  upload("Heart monitor.wav", "audio", ["beep", "monitor"]),
  upload("Protocol.pdf", "document", ["guide", "ward"]),
];
const all = [...uploads, ...PRESET_ITEMS];
const names = (items) => items.map((item) => item.name);

test("an uploaded asset becomes a library item", () => {
  const item = uploads[0];
  assert.equal(item.key, "asset:Ward round.png");
  assert.equal(item.source, "upload");
  assert.equal(item.kind, "image");
  assert.deepEqual(item.tags, ["ward", "hospital"]);
});

test("an asset without tags still works", () => {
  const item = assetToItem({ _id: "1", name: "x", type: "image", url: "u" });
  assert.deepEqual(item.tags, []);
  assert.equal(filterItems([item], { query: "x" }).length, 1);
});

test("no query and no kind matches everything, in order", () => {
  assert.deepEqual(filterItems(all), all);
});

test("a query matches names, ignoring case", () => {
  assert.deepEqual(names(filterItems(uploads, { query: "WARD" })), [
    "Ward round.png",
    "Protocol.pdf", // via its tag
  ]);
});

test("a query matches tags, with or without a leading #", () => {
  for (const query of ["beep", "#beep", "BEE"]) {
    const found = filterItems(uploads, { query });
    assert.deepEqual(names(found), ["Heart monitor.wav"], query);
  }
});

test("every word of a query has to match", () => {
  assert.deepEqual(names(filterItems(uploads, { query: "ward guide" })), [
    "Protocol.pdf",
  ]);
  assert.deepEqual(filterItems(uploads, { query: "ward nothing" }), []);
});

test("extra whitespace in a query is ignored", () => {
  assert.deepEqual(searchWords("  Ward   #Guide "), ["ward", "guide"]);
  assert.equal(filterItems(uploads, { query: "   " }).length, uploads.length);
});

test("kind narrows to one sort of thing, presets and uploads alike", () => {
  const audio = filterItems(all, { kind: "audio" });
  assert.ok(audio.length > 1);
  assert.ok(audio.every((item) => item.kind === "audio"));
  assert.ok(names(audio).includes("Heart monitor.wav"));
  assert.ok(names(audio).includes("Heart monitor")); // the preset
});

test("kind and query combine", () => {
  const found = filterItems(all, { kind: "audio", query: "monitor" });
  assert.deepEqual(names(found), ["Heart monitor.wav", "Heart monitor"]);
});

test("a preset can be found by tag (the whole point of tags)", () => {
  assert.ok(
    names(filterItems(all, { query: "fever" })).includes("Thermometer")
  );
  assert.ok(
    names(filterItems(all, { query: "emergency" })).includes("First aid")
  );
});

test("nothing matching gives an empty list", () => {
  assert.deepEqual(filterItems(all, { query: "zzzzzz" }), []);
});

test("items are grouped with uploads first, then presets by kind", () => {
  const sections = groupItems(all);
  assert.deepEqual(
    sections.map((s) => s.title),
    ["My uploads", "Buttons", "Images", "Sounds"]
  );
  assert.equal(sections[0].items.length, uploads.length);
  assert.ok(sections[1].items.every((i) => i.kind === "button"));
});

test("sections with nothing in them are left out", () => {
  const sections = groupItems(filterItems(all, { kind: "button" }));
  assert.deepEqual(
    sections.map((s) => s.title),
    ["Buttons"]
  );
  assert.deepEqual(groupItems([]), []);
});

test("uploaded documents are grouped with the uploads", () => {
  const sections = groupItems(filterItems(all, { kind: "document" }));
  assert.deepEqual(
    sections.map((s) => s.title),
    ["My uploads"]
  );
  assert.deepEqual(names(sections[0].items), ["Protocol.pdf"]);
});
