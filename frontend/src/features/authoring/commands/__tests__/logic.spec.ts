import { describe, expect, it } from "vitest";
import { resolveDestination } from "../../../../components/Properties/destination.js";
import type { Component } from "../../types";
import { blankScene } from "../memory";
import { snapshotScenario, snapshotScene } from "../snapshot";
import {
  box,
  find,
  ok,
  refused,
  sceneOf,
  sessionFor,
  withText,
} from "./helpers";

const BUTTON = "aaaaaaaa-1111-4111-8111-111111111111";
const WORSE = "507f1f77bcf86cd799439022";
const STABLE = "507f1f77bcf86cd799439033";

const properties = [
  { id: "hr", name: "heartRate", type: "number", value: 110 },
  { id: "fluids", name: "fluidsGiven", type: "boolean", value: false },
  { id: "who", name: "patient", type: "string", value: "Sam" },
];

const worse = blankScene({ _id: WORSE, name: "Deteriorates" });
const stable = blankScene({ _id: STABLE, name: "Stable" });

function setup(
  button: Component = withText(box(BUTTON, 0, 0, 300, 100), "Next")
) {
  return sessionFor(sceneOf(button), { others: [worse, stable], properties });
}

const rule = (extra: Record<string, unknown> = {}) => ({
  property: "heartRate",
  comparator: ">",
  value: "120",
  scene: "Deteriorates",
  ...extra,
});

type Rules = {
  stateVariableId: string;
  comparator: string;
  value: unknown;
  sceneId: string;
}[];
const storedRules = (component: Component) =>
  (component as unknown as { nextSceneRules?: Rules }).nextSceneRules;
const nextScene = (component: Component) =>
  (component as unknown as { nextScene?: string | null }).nextScene;

describe("set_conditional_destination", () => {
  it("makes a button lead to different scenes depending on a property", async () => {
    const session = setup();
    const result = await ok(session, "set_conditional_destination", {
      target: BUTTON,
      rules: [rule()],
      otherwise: "Stable",
    });

    const button = find(session, BUTTON);
    expect(storedRules(button)).toEqual([
      { stateVariableId: "hr", comparator: ">", value: 120, sceneId: WORSE },
    ]);
    expect(nextScene(button)).toBe(STABLE);
    expect(result.summary).toContain("heartRate > 120 → Deteriorates");
    expect(result.summary).toContain("otherwise to Stable");
  });

  it("is judged the way the server will judge it", async () => {
    const session = setup();
    await ok(session, "set_conditional_destination", {
      target: BUTTON,
      rules: [rule()],
      otherwise: "Stable",
    });
    const button = find(session, BUTTON);

    const heartRate = (value: number) => [{ ...properties[0], value }];
    expect(resolveDestination(button, heartRate(130)).sceneId).toBe(WORSE);
    expect(resolveDestination(button, heartRate(100)).sceneId).toBe(STABLE);
  });

  it("finds the button by the words on it", async () => {
    const session = setup();
    await ok(session, "set_conditional_destination", {
      target: "Next",
      rules: [rule()],
    });
    expect(storedRules(find(session, BUTTON))).toHaveLength(1);
  });

  it("finds properties and scenes by name or id, whatever the case", async () => {
    const session = setup();
    await ok(session, "set_conditional_destination", {
      target: BUTTON,
      rules: [rule({ property: "HEARTRATE", scene: WORSE })],
      otherwise: "stable",
    });
    const button = find(session, BUTTON);
    expect(storedRules(button)?.[0]).toMatchObject({
      stateVariableId: "hr",
      sceneId: WORSE,
    });
    expect(nextScene(button)).toBe(STABLE);
  });

  it("keeps the order of the rules", async () => {
    const session = setup();
    await ok(session, "set_conditional_destination", {
      target: BUTTON,
      rules: [
        rule({ value: "150", scene: "Stable" }),
        rule({ value: "120", scene: "Deteriorates" }),
      ],
    });
    expect(storedRules(find(session, BUTTON))?.map((r) => r.value)).toEqual([
      150, 120,
    ]);
  });

  describe("values", () => {
    it("reads a value as the property's own type", async () => {
      const session = setup();
      await ok(session, "set_conditional_destination", {
        target: BUTTON,
        rules: [
          rule({ value: "120" }),
          rule({ property: "fluidsGiven", comparator: "=", value: "TRUE" }),
          rule({ property: "patient", comparator: "!=", value: "Alex" }),
        ],
      });
      expect(storedRules(find(session, BUTTON))?.map((r) => r.value)).toEqual([
        120,
        true,
        "Alex",
      ]);
    });

    it("copes with a model sending a real number or boolean", async () => {
      const session = setup();
      await ok(session, "set_conditional_destination", {
        target: BUTTON,
        rules: [
          rule({ value: 120 }),
          rule({ property: "fluidsGiven", comparator: "=", value: false }),
        ],
      });
      expect(storedRules(find(session, BUTTON))?.map((r) => r.value)).toEqual([
        120,
        false,
      ]);
    });

    it("refuses text where a number is needed", async () => {
      const error = await refused(setup(), "set_conditional_destination", {
        target: BUTTON,
        rules: [rule({ value: "high" })],
      });
      expect(error).toContain("heartRate is a number");
    });

    it("refuses anything but true or false for a true/false property", async () => {
      const error = await refused(setup(), "set_conditional_destination", {
        target: BUTTON,
        rules: [
          rule({ property: "fluidsGiven", comparator: "=", value: "yes" }),
        ],
      });
      expect(error).toContain("true or false");
    });
  });

  describe("refuses what could never work", () => {
    it("a comparator the property's type can't use", async () => {
      const error = await refused(setup(), "set_conditional_destination", {
        target: BUTTON,
        rules: [
          rule({ property: "fluidsGiven", comparator: ">", value: "true" }),
        ],
      });
      expect(error).toContain("Rule 1");
      expect(error).toContain("Use = or !=");
    });

    it("a property that doesn't exist, listing the ones that do", async () => {
      const error = await refused(setup(), "set_conditional_destination", {
        target: BUTTON,
        rules: [rule({ property: "bloodPressure" })],
      });
      expect(error).toContain('No property matches "bloodPressure"');
      expect(error).toContain("heartRate (number)");
    });

    it("a scene that doesn't exist", async () => {
      const error = await refused(setup(), "set_conditional_destination", {
        target: BUTTON,
        rules: [rule({ scene: "Nowhere" })],
      });
      expect(error).toContain('No scene matches "Nowhere"');
    });

    it("an unknown comparator, before anything else", async () => {
      const error = await refused(setup(), "set_conditional_destination", {
        target: BUTTON,
        rules: [rule({ comparator: ">=" })],
      });
      expect(error).toContain("Invalid arguments");
    });

    it("a sound, which can't be pressed", async () => {
      const sound = {
        id: "ssssssss-1",
        type: "audio",
        name: "Beep",
        url: "u",
        loop: false,
      } as unknown as Component;
      const session = sessionFor(sceneOf(sound), {
        others: [worse],
        properties,
      });
      const error = await refused(session, "set_conditional_destination", {
        target: "ssssssss",
        rules: [],
        otherwise: "Deteriorates",
      });
      expect(error).toContain("can't be pressed");
    });

    it("changes nothing when it refuses", async () => {
      const session = setup();
      await refused(session, "set_conditional_destination", {
        target: BUTTON,
        rules: [rule(), rule({ property: "bloodPressure" })],
        otherwise: "Stable",
      });
      expect(storedRules(find(session, BUTTON))).toBeUndefined();
      expect(nextScene(find(session, BUTTON))).toBeUndefined();
      expect(session.writes).toHaveLength(0);
    });
  });

  describe("replacing what's there", () => {
    const withRules = async () => {
      const session = setup();
      await ok(session, "set_conditional_destination", {
        target: BUTTON,
        rules: [rule()],
        otherwise: "Stable",
      });
      return session;
    };

    it("swaps the rules for the new list", async () => {
      const session = await withRules();
      await ok(session, "set_conditional_destination", {
        target: BUTTON,
        rules: [rule({ comparator: "<", value: "40", scene: "Stable" })],
      });
      const rules = storedRules(find(session, BUTTON));
      expect(rules).toHaveLength(1);
      expect(rules?.[0]).toMatchObject({ comparator: "<", value: 40 });
    });

    it("keeps the button's own scene unless told otherwise", async () => {
      const session = await withRules();
      await ok(session, "set_conditional_destination", {
        target: BUTTON,
        rules: [rule({ value: "130" })],
      });
      expect(nextScene(find(session, BUTTON))).toBe(STABLE);
    });

    it("removes the rules with an empty list, leaving a plain link", async () => {
      const session = await withRules();
      await ok(session, "set_conditional_destination", {
        target: BUTTON,
        rules: [],
      });
      const button = find(session, BUTTON);
      expect(storedRules(button)).toBeUndefined();
      expect(nextScene(button)).toBe(STABLE);
    });

    it("clears the button's own scene with null", async () => {
      const session = await withRules();
      const result = await ok(session, "set_conditional_destination", {
        target: BUTTON,
        rules: [rule()],
        otherwise: null,
      });
      expect(nextScene(find(session, BUTTON))).toBeNull();
      expect(result.warnings?.join(" ")).toContain("stay on this scene");
    });

    it("is also how a plain link is made", async () => {
      const session = setup();
      await ok(session, "set_conditional_destination", {
        target: BUTTON,
        rules: [],
        otherwise: "Stable",
      });
      const button = find(session, BUTTON);
      expect(storedRules(button)).toBeUndefined();
      expect(nextScene(button)).toBe(STABLE);
    });

    it("says when there was nothing to change", async () => {
      const session = await withRules();
      const result = await ok(session, "set_conditional_destination", {
        target: BUTTON,
        rules: [rule()],
        otherwise: "Stable",
      });
      expect(result.summary).toContain("nothing needed to change");
      expect(session.writes).toHaveLength(1);
    });
  });

  it("warns about a rule that can never be reached", async () => {
    const result = await ok(setup(), "set_conditional_destination", {
      target: BUTTON,
      rules: [rule(), rule({ scene: "Stable" })],
      otherwise: "Stable",
    });
    expect(result.warnings?.join(" ")).toContain(
      "Rule 2 has the same condition as rule 1"
    );
  });

  it("warns when no scene is set for when nothing matches", async () => {
    const result = await ok(setup(), "set_conditional_destination", {
      target: BUTTON,
      rules: [rule()],
    });
    expect(result.warnings?.join(" ")).toContain("otherwise");
  });

  it("makes a button that can't be pressed pressable", async () => {
    const session = setup(
      withText(box(BUTTON, 0, 0, 300, 100, { clickable: false }), "Next")
    );
    const result = await ok(session, "set_conditional_destination", {
      target: BUTTON,
      rules: [],
      otherwise: "Stable",
    });
    expect(find(session, BUTTON).clickable).toBe(true);
    expect(result.summary).toContain("wasn't pressable");
  });

  it("works on a scene that isn't open", async () => {
    const elsewhere = blankScene({
      _id: "507f1f77bcf86cd799439044",
      name: "Elsewhere",
      components: { [BUTTON]: withText(box(BUTTON, 0, 0, 300, 100), "Go") },
    });
    const session = sessionFor(sceneOf(), {
      others: [elsewhere, worse, stable],
      properties,
    });
    await ok(session, "set_conditional_destination", {
      sceneId: "Elsewhere",
      target: BUTTON,
      rules: [rule()],
    });
    expect(
      storedRules(find(session, BUTTON, "507f1f77bcf86cd799439044"))
    ).toHaveLength(1);
  });
});

describe("what the model sees of the rules", () => {
  async function branching() {
    const session = setup();
    await ok(session, "set_conditional_destination", {
      target: BUTTON,
      rules: [rule(), rule({ value: "60", comparator: "<", scene: "Stable" })],
      otherwise: "Stable",
    });
    return session;
  }

  it("lists a button's rules in order, with its own scene as goesTo", async () => {
    const session = await branching();
    const world = session.world();
    const [button] = snapshotScene(session.scene(), world).components;
    expect(button).toMatchObject({
      clickable: true,
      goesTo: "Stable",
      rules: [
        "if heartRate > 120 → Deteriorates",
        "if heartRate < 60 → Stable",
      ],
    });
  });

  it("shows each way out in the scenario's links", async () => {
    const session = await branching();
    const overview = snapshotScenario(session.world());
    expect(overview.scenes[0].links).toEqual([
      { from: "Next", to: "Deteriorates", when: "heartRate > 120" },
      { from: "Next", to: "Stable", when: "heartRate < 60" },
      { from: "Next", to: "Stable", when: "otherwise" },
    ]);
  });

  it("calls a button with only rules clickable", async () => {
    const session = setup();
    await ok(session, "set_conditional_destination", {
      target: BUTTON,
      rules: [rule()],
    });
    const [button] = snapshotScene(session.scene(), session.world()).components;
    expect(button.clickable).toBe(true);
    expect(button.goesTo).toBeUndefined();
  });

  it("marks a rule on a deleted property", async () => {
    const session = await branching();
    const world = session.world();
    world.properties = [];
    const [button] = snapshotScene(session.scene(), world).components;
    expect(button.rules?.[0]).toContain("a deleted property");
  });

  it("is reported by run_checks when a rule can't match", async () => {
    const session = await branching();
    const button = find(session, BUTTON);
    (button as unknown as { nextSceneRules: Rules }).nextSceneRules[0].value =
      "high";
    const result = await ok(session, "run_checks");
    expect(JSON.stringify(result.output)).toContain("never matches");
  });
});
