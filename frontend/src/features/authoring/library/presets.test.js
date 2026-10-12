import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PALETTE, PALETTE_SOURCES } from "./palette.js";
import {
  AUDIO_PRESETS,
  BUTTON_PRESETS,
  IMAGE_PRESET_SIZE,
  IMAGE_PRESETS,
  PRESET_ITEMS,
} from "./presets.js";

const themeCss = readFileSync(
  new URL("../../../index.css", import.meta.url),
  "utf8"
);
const publicFile = (url) =>
  readFileSync(new URL(`../../../../public${url}`, import.meta.url));

// WCAG relative luminance and contrast ratio
function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/* ------------------------------ theme ------------------------------- */

test("every palette colour is taken from a theme token", () => {
  assert.deepEqual(
    Object.keys(PALETTE).sort(),
    Object.keys(PALETTE_SOURCES).sort()
  );
});

test("the palette matches the theme in index.css", () => {
  for (const [name, token] of Object.entries(PALETTE_SOURCES)) {
    const declaration = new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})\\b`);
    const found = themeCss.match(declaration);
    assert.ok(found, `${token} has no hex value in index.css`);
    assert.equal(
      PALETTE[name],
      found[1].toLowerCase(),
      `palette.${name} has drifted from ${token}`
    );
  }
});

test("button text is readable on its fill", () => {
  for (const preset of BUTTON_PRESETS) {
    const fillIsClear = preset.fill.endsWith("00");
    // outline buttons sit straight on the white canvas
    const background = fillIsClear ? PALETTE.white : preset.fill.slice(0, 7);
    // the text is 44px bold, which counts as large text (3:1)
    assert.ok(
      contrast(preset.textColor, background) >= 3,
      `${preset.id}: text is hard to read on its background`
    );
  }
});

test("button colours are in the editor's 8 digit hex form", () => {
  for (const preset of BUTTON_PRESETS) {
    assert.match(preset.fill, /^#[0-9a-f]{8}$/, preset.id);
    assert.match(preset.stroke, /^#[0-9a-f]{8}$/, preset.id);
    assert.match(preset.textColor, /^#[0-9a-f]{6}$/, preset.id);
  }
});

/* ----------------------------- manifest ----------------------------- */

test("preset ids and keys are unique", () => {
  const keys = PRESET_ITEMS.map((item) => item.key);
  assert.equal(new Set(keys).size, keys.length);
  const ids = PRESET_ITEMS.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every preset has a name and clean, searchable tags", () => {
  for (const item of PRESET_ITEMS) {
    assert.ok(item.name.trim(), `${item.id} has no name`);
    assert.ok(item.tags.length > 0, `${item.id} has no tags`);
    assert.equal(new Set(item.tags).size, item.tags.length, `${item.id} tags`);
    for (const tag of item.tags)
      assert.equal(tag, tag.trim().toLowerCase(), `${item.id}: "${tag}"`);
  }
});

test("buttons can be found by the colour or role in their tags", () => {
  const find = (word) =>
    PRESET_ITEMS.filter((i) => i.tags.includes(word)).map((i) => i.id);
  assert.ok(find("red").includes("button-danger"));
  assert.ok(find("primary").includes("button-primary"));
});

/* ------------------------- generated files -------------------------- */

test("each preset image is a 512px transparent PNG", () => {
  for (const preset of IMAGE_PRESETS) {
    assert.equal(preset.url, `/library/images/${preset.id}.png`);
    const png = publicFile(preset.url);

    assert.deepEqual(
      [...png.subarray(0, 8)],
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      `${preset.id} isn't a PNG`
    );
    assert.equal(png.readUInt32BE(16), IMAGE_PRESET_SIZE, `${preset.id} width`);
    assert.equal(
      png.readUInt32BE(20),
      IMAGE_PRESET_SIZE,
      `${preset.id} height`
    );
    assert.equal(png[24], 8, `${preset.id} bit depth`);
    assert.equal(png[25], 6, `${preset.id} should have an alpha channel`);
    assert.ok(png.length < 50 * 1024, `${preset.id} is oddly large`);
  }
});

test("each preset sound is a short mono 16-bit WAV that doesn't clip", () => {
  for (const preset of AUDIO_PRESETS) {
    assert.equal(preset.url, `/library/audio/${preset.id}.wav`);
    const wav = publicFile(preset.url);

    assert.equal(wav.toString("ascii", 0, 4), "RIFF", preset.id);
    assert.equal(wav.toString("ascii", 8, 12), "WAVE", preset.id);
    assert.equal(wav.readUInt16LE(20), 1, `${preset.id} should be PCM`);
    assert.equal(wav.readUInt16LE(22), 1, `${preset.id} should be mono`);
    assert.equal(wav.readUInt16LE(34), 16, `${preset.id} bit depth`);

    const rate = wav.readUInt32LE(24);
    const dataBytes = wav.readUInt32LE(40);
    assert.equal(dataBytes, wav.length - 44, `${preset.id} data length`);
    const seconds = dataBytes / 2 / rate;
    assert.ok(seconds >= 0.2 && seconds <= 3, `${preset.id} is ${seconds}s`);

    let peak = 0;
    for (let i = 44; i < wav.length; i += 2)
      peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
    assert.ok(peak > 8000, `${preset.id} is nearly silent`);
    assert.ok(peak < 32767, `${preset.id} clips`);
  }
});
