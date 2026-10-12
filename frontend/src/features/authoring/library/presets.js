import { PALETTE } from "./palette.js";

// What the library ships with: styled buttons, a set of icons and a few
// sounds. The images and sounds are static files in public/library, drawn by
// scripts/generate-library-assets.mjs, so there is nothing to license and
// nothing in the database.

/** @typedef {"button" | "image" | "audio" | "document"} Kind */
/** @typedef {{ id: string, name: string, tags: string[] }} PresetBase */
/**
 * @typedef {PresetBase & {
 *   label: string,
 *   shape: "box" | "ellipse",
 *   fill: string,
 *   stroke: string,
 *   strokeWidth: number,
 *   textColor: string,
 * }} ButtonPreset
 */
/** @typedef {PresetBase & { url: string }} ImagePreset */
/** @typedef {PresetBase & { url: string, loops: boolean }} AudioPreset */
/**
 * @typedef {{ key: string, source: "preset" }} PresetMark
 * @typedef {(ButtonPreset & PresetMark & { kind: "button" })
 *   | (ImagePreset & PresetMark & { kind: "image" })
 *   | (AudioPreset & PresetMark & { kind: "audio" })} PresetItem
 */

/** Fully opaque, in the 8 digit form the editor uses for its own colours. */
const solid = (/** @type {string} */ hex) => `${hex}ff`;
const CLEAR = "#00000000";

export const BUTTON_SIZE = { width: 420, height: 120 };

/**
 * @param {string} id
 * @param {string} name
 * @param {string} label
 * @param {string} color
 * @param {string[]} tags
 * @param {"box" | "ellipse"} [shape]
 * @returns {ButtonPreset}
 */
const filled = (id, name, label, color, tags, shape = "box") => ({
  id,
  name,
  label,
  shape,
  fill: solid(color),
  stroke: CLEAR,
  strokeWidth: 0,
  textColor: PALETTE.onSolid,
  tags: ["button", ...tags],
});

/**
 * Buttons are ordinary box/ellipse components with text in them, ready to be
 * given a destination or a property change in the Button Actions panel.
 * @type {ButtonPreset[]}
 */
export const BUTTON_PRESETS = [
  filled("button-primary", "Primary button", "Continue", PALETTE.accent, [
    "primary",
    "next",
    "teal",
  ]),
  filled("button-neutral", "Neutral button", "Back", PALETTE.neutral, [
    "secondary",
    "grey",
    "back",
  ]),
  filled("button-success", "Success button", "Confirm", PALETTE.success, [
    "green",
    "yes",
    "done",
  ]),
  filled("button-warning", "Warning button", "Wait", PALETTE.warning, [
    "amber",
    "caution",
    "pause",
  ]),
  filled("button-danger", "Danger button", "Stop", PALETTE.error, [
    "red",
    "no",
    "emergency",
  ]),
  filled("button-info", "Info button", "More info", PALETTE.info, [
    "blue",
    "help",
    "details",
  ]),
  {
    id: "button-outline",
    name: "Outline button",
    label: "Skip",
    shape: "box",
    fill: CLEAR,
    stroke: solid(PALETTE.content),
    strokeWidth: 6,
    textColor: PALETTE.content,
    tags: ["button", "outline", "ghost", "secondary"],
  },
  filled(
    "button-oval",
    "Oval button",
    "Start",
    PALETTE.accent,
    ["oval", "round", "pill", "primary"],
    "ellipse"
  ),
];

/**
 * @param {string} id
 * @param {string} name
 * @param {string[]} tags
 * @returns {ImagePreset}
 */
const image = (id, name, tags) => ({
  id,
  name,
  tags,
  url: `/library/images/${id}.png`,
});

/** @type {ImagePreset[]} */
export const IMAGE_PRESETS = [
  image("first-aid", "First aid", ["medical", "emergency", "cross", "health"]),
  image("heart", "Heart", ["cardiac", "heart", "health", "love"]),
  image("pill", "Pill", ["medication", "drug", "capsule", "pharmacy"]),
  image("thermometer", "Thermometer", ["temperature", "fever", "vitals"]),
  image("clipboard", "Clipboard", ["notes", "chart", "records", "list"]),
  image("check", "Tick", ["check", "success", "correct", "done"]),
  image("warning", "Warning", ["alert", "caution", "danger", "triangle"]),
  image("info", "Information", ["help", "about", "details", "i"]),
  image("arrow", "Arrow", ["next", "direction", "right", "continue"]),
  image("speech", "Speech bubble", ["chat", "dialogue", "talk", "message"]),
];

/**
 * @param {string} id
 * @param {string} name
 * @param {string[]} tags
 * @param {boolean} [loops]
 * @returns {AudioPreset}
 */
const sound = (id, name, tags, loops = false) => ({
  id,
  name,
  tags,
  loops,
  url: `/library/audio/${id}.wav`,
});

/** @type {AudioPreset[]} */
export const AUDIO_PRESETS = [
  // one beep a second, so it works as a looping bedside monitor
  sound(
    "heart-monitor",
    "Heart monitor",
    ["beep", "ecg", "vitals", "monitor"],
    true
  ),
  sound("alert", "Alert", ["alarm", "warning", "urgent", "beep"]),
  sound("chime", "Chime", ["bell", "notification", "success", "ding"]),
];

/**
 * The kinds of thing in the library, in the order they're offered.
 * @type {Kind[]}
 */
export const KINDS = ["button", "image", "audio", "document"];

/**
 * Every preset as a library item, the same shape uploads are turned into, so
 * the panel can treat the two alike.
 * @type {PresetItem[]}
 */
export const PRESET_ITEMS = [
  ...BUTTON_PRESETS.map((preset) => ({
    ...preset,
    key: `preset:${preset.id}`,
    source: /** @type {const} */ ("preset"),
    kind: /** @type {const} */ ("button"),
  })),
  ...IMAGE_PRESETS.map((preset) => ({
    ...preset,
    key: `preset:${preset.id}`,
    source: /** @type {const} */ ("preset"),
    kind: /** @type {const} */ ("image"),
  })),
  ...AUDIO_PRESETS.map((preset) => ({
    ...preset,
    key: `preset:${preset.id}`,
    source: /** @type {const} */ ("preset"),
    kind: /** @type {const} */ ("audio"),
  })),
];
