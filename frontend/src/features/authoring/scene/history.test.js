import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";
import React from "react";
import { renderToString } from "react-dom/server.js";
// Initialize React's scheduler in Node before installing the scene's window stub.
import "react-dom";

// The scene model exposes a debug window reference; text layout creates a canvas.
globalThis.window = {};
globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  esbuild: { jsx: "automatic" },
  optimizeDeps: { noDiscovery: true, include: [] },
});
after(() => server.close());

const load = (path) => server.ssrLoadModule(`/src/features/authoring/${path}`);
const { default: editor } = await load("stores/editor.ts");
const { default: visual } = await load("stores/visual.ts");
const { default: Overlay } = await load("canvas/Overlay.tsx");
const { default: RotationHandle } = await load(
  "canvas/handles/RotationHandle.tsx"
);
const { setScene, getScene } = await load("scene/scene.ts");
const { remove } = await load("scene/operations/modifiers.ts");
const { createHistoryListener } = await load("scene/historyListener.js");
const { clearHistory, historyEvents, undo, redo } =
  await load("scene/history.ts");

function setup() {
  clearHistory();
  editor.getState().clear();
  const components = Object.fromEntries(
    ["box", "ellipse", "line"].map((type, i) => [
      type,
      {
        id: type,
        type,
        zIndex: i,
        bounds: {
          verts: [
            { x: i * 100, y: 0 },
            { x: i * 100 + 50, y: 50 },
          ],
          rotation: 0,
        },
      },
    ])
  );
  setScene({ _id: "scene", components: structuredClone(components) });
  visual.getState().setComponents(structuredClone(components));
  return components;
}

test("overlay tolerates selected IDs whose visual components have been deleted", () => {
  for (const ids of [["box"], ["box", "ellipse"]]) {
    setup();
    editor.getState().setSelected(ids);
    visual.getState().setComponents({});
    assert.doesNotThrow(() => renderToString(React.createElement(Overlay)));
  }
});

test("rotation handle tolerates selection being cleared before it unmounts", () => {
  setup();
  assert.equal(renderToString(React.createElement(RotationHandle)), "");
});

test("selection handles wait for the whole deleted group to be restored", () => {
  const original = setup();
  editor.getState().setSelected(["box", "ellipse"]);
  visual.getState().setComponents({ box: original.box });
  const partial = renderToString(React.createElement(Overlay));
  assert.doesNotMatch(partial, /data-handle/);
  visual.getState().setComponents(original);
  const restored = renderToString(React.createElement(Overlay));
  assert.match(restored, /data-handle/);
});

test("multi-object deletion survives repeated undo/redo with intact snapshots", () => {
  const original = setup();
  const selected = ["box", "ellipse"];
  editor.getState().setSelected(selected);
  editor.getState().setSelected([]);
  remove(selected);
  assert.deepEqual(Object.keys(getScene().components), ["line"]);

  let savesScheduled = 0;
  const savingStates = [];
  const apply = createHistoryListener({
    sceneId: "scene",
    switchScene: () =>
      assert.fail("Undo within the active scene must not switch scenes"),
    properties: [],
    setSaving: (saving) => savingStates.push(saving),
    debounced: () => savesScheduled++,
  });
  historyEvents.addEventListener("update", apply);
  try {
    for (let cycle = 0; cycle < 3; cycle++) {
      undo();
      assert.deepEqual(getScene().components, original);
      assert.deepEqual(editor.getState().selected, selected);
      assert.doesNotThrow(() => renderToString(React.createElement(Overlay)));
      getScene().components.box.bounds.verts[0].x = 999;
      redo();
      assert.deepEqual(Object.keys(getScene().components), ["line"]);
      assert.deepEqual(editor.getState().selected, []);
    }
    assert.equal(savesScheduled, 6);
    assert.deepEqual(savingStates, Array(6).fill(true));
  } finally {
    historyEvents.removeEventListener("update", apply);
  }
});
