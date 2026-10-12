import assert from "node:assert/strict";
import test from "node:test";

import { checkScene } from "./checks.js";
import { componentLabel, describeOperation } from "./describe.js";

const properties = [
  { id: "hr", name: "heartRate", type: "number", value: 110 },
  { id: "fluids", name: "fluidsGiven", type: "boolean", value: false },
  { id: "note", name: "note", type: "string", value: "" },
];

const textbox = (text, extra = {}) => ({
  id: "text-1",
  type: "textbox",
  document: { blocks: [{ spans: [{ text }] }] },
  ...extra,
});

const exit = { id: "exit", type: "box", clickable: true, nextScene: "next" };

function run(scene, overrides = {}) {
  return checkScene({
    scene: { _id: "scene", components: [exit], ...scene },
    properties,
    hasScene: (id) => id === "next",
    ...overrides,
  });
}

test("a clean scene has no problems", () => {
  assert.deepEqual(
    run({ components: [exit, textbox("HR: $$heartRate$$")] }),
    []
  );
});

test("there is nothing to check without a scene", () => {
  assert.deepEqual(checkScene({ scene: null, properties }), []);
});

test("flags a $$placeholder$$ that matches no property", () => {
  const problems = run({ components: [exit, textbox("Pain: $$painScore$$")] });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].level, "warning");
  assert.match(problems[0].message, /\$\$painScore\$\$/);
});

test("reports each unmatched placeholder once", () => {
  const problems = run({
    components: [exit, textbox("$$nope$$ and again $$nope$$")],
  });
  assert.equal(problems.length, 1);
});

test("does not match a placeholder across a property chip", () => {
  const chip = { property: { id: "hr", displayName: "heartRate" } };
  const component = {
    id: "t",
    type: "textbox",
    document: {
      blocks: [{ spans: [{ text: "$$a" }, chip, { text: "b$$" }] }],
    },
  };
  assert.deepEqual(run({ components: [exit, component] }), []);
});

test("flags a chip whose property was deleted", () => {
  const component = {
    id: "t",
    type: "textbox",
    document: {
      blocks: [
        { spans: [{ property: { id: "gone", displayName: "oldProperty" } }] },
      ],
    },
  };
  const problems = run({ components: [exit, component] });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].level, "error");
  assert.match(problems[0].message, /oldProperty/);
});

test("flags an operation on a deleted property", () => {
  const button = {
    ...exit,
    stateOperations: [
      { stateVariableId: "gone", displayName: "oldProperty", operation: "set" },
    ],
  };
  const problems = run({ components: [button] });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].level, "error");
  assert.match(problems[0].message, /no longer exists/);
});

test("flags an operation the property type does not support", () => {
  const button = {
    ...exit,
    stateOperations: [
      { stateVariableId: "fluids", operation: "add", value: 1 },
    ],
  };
  const problems = run({ components: [button] });
  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /can't be used on the boolean property/);
});

test("warns when a number operation has a non-number value", () => {
  const button = {
    ...exit,
    stateOperations: [{ stateVariableId: "hr", operation: "add", value: "5" }],
  };
  const problems = run({ components: [button] });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].level, "warning");
});

test("checks timer operations too", () => {
  const problems = run({
    timerStateOperations: [
      { stateVariableId: "gone", displayName: "oldProperty", operation: "set" },
    ],
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /scene timer/);
});

test("flags a button leading to a scene that is not loaded", () => {
  const button = { id: "b", type: "box", clickable: true, nextScene: "gone" };
  const problems = run({ components: [button], directLink: "somewhere" });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].level, "error");
  assert.match(problems[0].message, /pressing it does nothing/);
});

test("does not flag a clickable with no destination, since shapes default to clickable", () => {
  const shape = { id: "b", type: "box", clickable: true };
  assert.deepEqual(run({ components: [exit, shape] }), []);
});

test("does not check destinations until the scene's neighbours are loaded", () => {
  const button = { id: "b", type: "box", clickable: true, nextScene: "gone" };
  const problems = run(
    { components: [button], directLink: "somewhere" },
    { neighborsLoaded: false }
  );
  assert.deepEqual(problems, []);
});

test("says when nothing leads out of the scene", () => {
  const problems = run({ components: [textbox("The end")] });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].level, "info");
});

test("a direct link counts as a way out", () => {
  assert.deepEqual(run({ components: [], directLink: "next" }), []);
});

test("a button back to the same scene is not a way out", () => {
  const loop = { id: "b", type: "box", clickable: true, nextScene: "scene" };
  const problems = checkScene({
    scene: { _id: "scene", components: [loop] },
    properties,
    hasScene: () => true,
  });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].level, "info");
});

test("checks bindings against the targets for the component", () => {
  const targets = [{ key: "width", label: "Width", propertyType: "number" }];
  const bind = (stateVariableId, target = "width") => ({
    ...exit,
    stateBindings: [{ target, stateVariableId }],
  });
  const check = (component) =>
    run({ components: [component] }, { getBindingTargets: () => targets });

  assert.deepEqual(check(bind("hr")), []);
  assert.match(check(bind("gone"))[0].message, /no longer exists/);
  assert.match(check(bind("fluids"))[0].message, /needs a number property/);
  assert.match(check(bind("hr", "fill"))[0].message, /doesn't apply/);
});

test("sorts errors before warnings before info", () => {
  const deletedOp = {
    id: "b",
    type: "box",
    stateOperations: [{ stateVariableId: "gone", operation: "set" }],
  };
  const problems = run({ components: [textbox("$$nope$$"), deletedOp] });
  assert.deepEqual(
    problems.map((p) => p.level),
    ["error", "warning", "info"]
  );
});

test("labels a component by its text, else its type", () => {
  assert.equal(componentLabel(textbox("Give fluids")), '"Give fluids"');
  assert.equal(
    componentLabel(textbox("A very long label that keeps on going")),
    '"A very long label that…"'
  );
  assert.equal(
    componentLabel({ id: "abcd-1234", type: "ellipse" }),
    "Ellipse abcd"
  );
});

test("describes operations with property names", () => {
  assert.equal(
    describeOperation(
      { stateVariableId: "hr", operation: "subtract", value: 15 },
      properties
    ),
    "heartRate − 15"
  );
  assert.equal(
    describeOperation(
      { stateVariableId: "fluids", operation: "set", value: true },
      properties
    ),
    "fluidsGiven = true"
  );
  assert.equal(
    describeOperation(
      {
        stateVariableId: "gone",
        displayName: "old",
        operation: "set",
        value: "x",
      },
      properties
    ),
    'old (deleted) = "x"'
  );
});

// --- destination rules ---

const rule = (stateVariableId, comparator, value, sceneId = "next") => ({
  stateVariableId,
  comparator,
  value,
  sceneId,
});

const branching = (...rules) => ({
  id: "b",
  type: "box",
  clickable: true,
  nextScene: "next",
  nextSceneRules: rules,
});

const rulesProblems = (...rules) =>
  run({ components: [branching(...rules)] }).map((p) => p.message);

test("rules that can match are fine", () => {
  assert.deepEqual(
    rulesProblems(
      rule("hr", ">", 120),
      rule("fluids", "=", true),
      rule("note", "!=", "x")
    ),
    []
  );
});

test("flags a rule using a property that no longer exists", () => {
  const [problem] = rulesProblems(rule("gone", "=", 1));
  assert.match(problem, /rule 1 uses a property that no longer exists/);
});

test("flags a comparator the property's type can't use", () => {
  const [problem] = rulesProblems(rule("fluids", ">", true));
  assert.match(
    problem,
    /">" can't be used on the boolean property fluidsGiven/
  );
});

test("flags a value of the wrong type", () => {
  const [problem] = rulesProblems(rule("hr", ">", "120"));
  assert.match(problem, /compares heartRate \(number\) with a string/);
});

test("flags a rule that repeats an earlier one, because it is never reached", () => {
  const problems = run(
    {
      components: [
        branching(rule("hr", ">", 120, "a"), rule("hr", ">", 120, "b")),
      ],
    },
    { hasScene: () => true }
  );
  assert.equal(problems.length, 1);
  assert.equal(problems[0].level, "warning");
  assert.match(problems[0].message, /rule 2 has the same condition/);
});

test("does not call different conditions on one property the same", () => {
  assert.deepEqual(
    rulesProblems(rule("hr", ">", 120), rule("hr", ">", 100)),
    []
  );
});

test("flags a rule leading to a scene that no longer exists", () => {
  const [problem] = rulesProblems(rule("hr", ">", 120, "deleted"));
  assert.match(problem, /rule 1 leads to a scene that no longer exists/);
});

test("flags a rule with no scene", () => {
  const [problem] = rulesProblems(rule("hr", ">", 120, ""));
  assert.match(problem, /rule 1 has no scene to go to/);
});

test("leaves a rule's scene alone until the neighbouring scenes have loaded", () => {
  assert.deepEqual(
    run(
      { components: [branching(rule("hr", ">", 120, "deleted"))] },
      { neighborsLoaded: false }
    ),
    []
  );
});

test("counts a rule's scene as a way out of the scene", () => {
  const onlyRules = {
    id: "b",
    type: "box",
    clickable: true,
    nextSceneRules: [rule("hr", ">", 120, "next")],
  };
  assert.deepEqual(run({ components: [onlyRules] }), []);
});
