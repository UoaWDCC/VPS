import assert from "node:assert/strict";
import test from "node:test";

import { buttonComponent } from "./buttonComponent.js";
import { BUTTON_PRESETS, BUTTON_SIZE } from "./presets.js";

const canvas = { width: 1920, height: 1080 };
const options = { id: "new-id", zIndex: 7, canvas };

test("a button is centred on the canvas at the preset size", () => {
  const { bounds } = buttonComponent(BUTTON_PRESETS[0], options);
  const [topLeft, bottomRight] = bounds.verts;

  assert.equal(bottomRight.x - topLeft.x, BUTTON_SIZE.width);
  assert.equal(bottomRight.y - topLeft.y, BUTTON_SIZE.height);
  assert.equal((topLeft.x + bottomRight.x) / 2, canvas.width / 2);
  assert.equal((topLeft.y + bottomRight.y) / 2, canvas.height / 2);
  assert.equal(bounds.rotation, 0);
});

test("a button carries its preset's look and its place in the stack", () => {
  for (const preset of BUTTON_PRESETS) {
    const button = buttonComponent(preset, options);
    assert.equal(button.id, "new-id");
    assert.equal(button.type, preset.shape);
    assert.equal(button.zIndex, 7);
    assert.equal(button.fill, preset.fill);
    assert.equal(button.stroke, preset.stroke);
    assert.equal(button.strokeWidth, preset.strokeWidth);
    assert.equal(button.clickable, true);
  }
});

test("a button's text is its label, in the preset's text colour", () => {
  const preset = BUTTON_PRESETS[0];
  const { document } = buttonComponent(preset, options);

  assert.equal(document.blocks[0].spans[0].text, preset.label);
  assert.equal(document.style.textColor, preset.textColor);
  assert.equal(document.blocks[0].style.alignment, "center");
});

test("buttons don't share state with each other", () => {
  const a = buttonComponent(BUTTON_PRESETS[0], options);
  const b = buttonComponent(BUTTON_PRESETS[0], options);
  a.document.blocks[0].spans[0].text = "changed";
  a.bounds.verts[0].x = -1;

  assert.notEqual(b.document.blocks[0].spans[0].text, "changed");
  assert.notEqual(b.bounds.verts[0].x, -1);
});

test("an oval preset makes an ellipse", () => {
  const oval = BUTTON_PRESETS.find((preset) => preset.id === "button-oval");
  assert.equal(buttonComponent(oval, options).type, "ellipse");
});
