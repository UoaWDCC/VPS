import assert from "node:assert/strict";
import test from "node:test";
import {
  getComponentBindingTargets,
  resolveComponentBindings,
  resolveSceneBindings,
} from "./componentBindings.js";

function box(overrides = {}) {
  return {
    id: "box-1",
    type: "box",
    bounds: {
      verts: [
        { x: 10, y: 20 },
        { x: 110, y: 70 },
      ],
      rotation: 0,
    },
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 2,
    zIndex: 0,
    ...overrides,
  };
}

test("resolves geometry and style bindings without mutating the saved component", () => {
  const component = box({
    stateBindings: [
      { target: "x", stateVariableId: "player-x" },
      { target: "fill", stateVariableId: "player-colour" },
    ],
  });
  const stateVariables = [
    { id: "player-x", type: "number", value: 250 },
    { id: "player-colour", type: "string", value: "#ff0000" },
  ];

  const resolved = resolveComponentBindings(component, stateVariables);

  assert.deepEqual(resolved.bounds.verts, [
    { x: 250, y: 20 },
    { x: 350, y: 70 },
  ]);
  assert.equal(resolved.fill, "#ff0000");
  assert.equal(component.bounds.verts[0].x, 10);
  assert.equal(component.fill, "#ffffff");
});

test("resizes all speech vertices from the top-left while preserving proportions", () => {
  const component = {
    ...box({
      type: "speech",
      bounds: {
        verts: [
          { x: 10, y: 20 },
          { x: 110, y: 70 },
          { x: 60, y: 120 },
        ],
        rotation: 0,
      },
    }),
    stateBindings: [{ target: "width", stateVariableId: "width" }],
  };

  const resolved = resolveComponentBindings(component, [
    { id: "width", type: "number", value: 200 },
  ]);

  assert.deepEqual(resolved.bounds.verts, [
    { x: 10, y: 20 },
    { x: 210, y: 70 },
    { x: 110, y: 120 },
  ]);
});

test("ignores missing and type-incompatible variables", () => {
  const component = box({
    stateBindings: [
      { target: "x", stateVariableId: "wrong-type" },
      { target: "fill", stateVariableId: "missing" },
    ],
  });

  const resolved = resolveComponentBindings(component, [
    { id: "wrong-type", type: "string", value: "300" },
  ]);

  assert.deepEqual(resolved, component);
});

test("provides component-specific binding targets", () => {
  const imageTargets = getComponentBindingTargets({
    ...box(),
    type: "image",
  }).map((target) => target.key);
  const lineTargets = getComponentBindingTargets({
    ...box(),
    type: "line",
  }).map((target) => target.key);
  const textboxTargets = getComponentBindingTargets({
    ...box(),
    type: "textbox",
  }).map((target) => target.key);
  const boxTargets = getComponentBindingTargets(box()).map(
    (target) => target.key
  );

  assert.ok(!imageTargets.includes("href"));
  assert.ok(!imageTargets.includes("preserveAspectRatio"));
  assert.ok(!imageTargets.includes("fill"));
  assert.ok(lineTargets.includes("stroke"));
  assert.ok(!lineTargets.includes("rotation"));
  assert.ok(!textboxTargets.includes("padding"));
  assert.ok(!boxTargets.includes("opacity"));
});

test("resolves every component in a scene", () => {
  const scene = {
    _id: "scene-1",
    components: {
      first: box({
        id: "first",
        stateBindings: [{ target: "x", stateVariableId: "x" }],
      }),
      second: box({ id: "second" }),
    },
  };

  const resolved = resolveSceneBindings(scene, [
    { id: "x", type: "number", value: 25 },
  ]);

  assert.equal(resolved.components.first.bounds.verts[0].x, 25);
  assert.equal(resolved.components.second, scene.components.second);
  assert.equal(scene.components.first.bounds.verts[0].x, 10);
});

test("applies safe colour values and rejects unsafe or invalid colours", () => {
  const component = box({
    stateBindings: [
      { target: "fill", stateVariableId: "fill" },
      { target: "stroke", stateVariableId: "stroke" },
    ],
  });

  const safe = resolveComponentBindings(component, [
    { id: "fill", type: "string", value: " #12ab34cc " },
    { id: "stroke", type: "string", value: "rgb(10, 20, 30)" },
  ]);
  const unsafe = resolveComponentBindings(component, [
    { id: "fill", type: "string", value: "url(javascript:alert(1))" },
    { id: "stroke", type: "string", value: "not a colour" },
  ]);

  assert.equal(safe.fill, "#12ab34cc");
  assert.equal(safe.stroke, "rgb(10, 20, 30)");
  assert.equal(unsafe.fill, component.fill);
  assert.equal(unsafe.stroke, component.stroke);
});
