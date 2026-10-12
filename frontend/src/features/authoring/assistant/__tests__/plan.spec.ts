import { describe, expect, it } from "vitest";
import {
  box,
  createdId,
  find,
  frameOf,
  sceneOf,
  sessionFor,
  withText,
} from "../../commands/__tests__/helpers";
import { runCommand } from "../../commands/run";
import {
  applyPlan,
  createPlanRecorder,
  describeStep,
  toggleStep,
} from "../plan";

const BUTTON = "aaaaaaaa-1111-4111-8111-111111111111";

function setup() {
  const live = sessionFor(
    sceneOf(withText(box(BUTTON, 100, 100, 300, 100), "Existing"))
  );
  return { live, plan: createPlanRecorder(live) };
}

const count = (session: ReturnType<typeof setup>["live"]) =>
  Object.keys(session.scene().components).length;

/** Plans: add a button, move it, and (separately) move the existing one. */
async function planned() {
  const { live, plan } = setup();
  const added = await plan.execute("add_button", {
    label: "New",
    x: 800,
    y: 100,
  });
  const id = createdId(added);
  await plan.execute("move", { targets: [id], y: 500 });
  await plan.execute("move", { targets: [BUTTON], x: 50 });
  return { live, plan, id };
}

describe("planning", () => {
  describe("the private copy", () => {
    it("takes the changes without touching the real scenario", async () => {
      const { live, plan } = setup();
      await plan.execute("add_button", { label: "New" });
      await plan.execute("move", { targets: [BUTTON], x: 999 });

      expect(count(live)).toBe(1);
      expect(frameOf(find(live, BUTTON)).x).toBe(100);
      expect(live.writes).toHaveLength(0);
      expect(count(plan.session)).toBe(2);
    });

    it("shows later steps what the earlier ones did", async () => {
      const { plan } = setup();
      await plan.execute("add_button", { label: "Brand new" });
      const seen = await runCommand(plan.session, "get_scene", {});
      expect(JSON.stringify(seen.output)).toContain("Brand new");
    });

    it("is a copy: changing the real scenario later doesn't change it", async () => {
      const { live, plan } = setup();
      await runCommand(live, "move", { targets: [BUTTON], x: 700 });
      expect(frameOf(find(plan.session, BUTTON)).x).toBe(100);
    });
  });

  describe("the steps", () => {
    it("records each change, in order, with what it does", async () => {
      const { plan } = await planned();
      const steps = plan.steps();

      expect(steps.map((s) => s.name)).toEqual(["add_button", "move", "move"]);
      expect(steps.map((s) => s.id)).toEqual(["step-1", "step-2", "step-3"]);
      expect(steps[0].summary).toMatch(/^Added/);
      expect(steps[0].kind).toBe("write");
      expect(steps[0].args).toEqual({ label: "New", x: 800, y: 100 });
    });

    it("keeps the ids of what a step creates", async () => {
      const { plan, id } = await planned();
      const [first, second] = plan.steps();
      expect(first.created).toHaveLength(1);
      expect(first.created[0].startsWith(id)).toBe(true);
      expect(second.created).toEqual([]);
    });

    it("leaves out looking, failing and doing nothing", async () => {
      const { plan } = setup();
      await plan.execute("get_scene", {});
      await plan.execute("run_checks", {});
      await plan.execute("move", { targets: ["nothing-here"], x: 1 });
      await plan.execute("move", { targets: [BUTTON], x: 100 }); // already there
      expect(plan.steps()).toEqual([]);
    });

    it("keeps the warnings a step gave", async () => {
      const { plan } = setup();
      await plan.execute("move", { targets: [BUTTON], x: 1800 });
      expect(plan.steps()[0].warnings?.join(" ")).toMatch(
        /past the right edge/
      );
    });

    it("marks deleting as deleting", async () => {
      const { plan } = setup();
      await plan.execute("delete_components", { targets: [BUTTON] });
      expect(plan.steps()[0].kind).toBe("destructive");
    });

    it("notes which steps use what an earlier step made", async () => {
      const { plan } = await planned();
      expect(plan.steps().map((s) => s.dependsOn)).toEqual([
        [],
        ["step-1"],
        [],
      ]);
    });
  });

  describe("choosing steps", () => {
    it("unticking a step unticks the ones that need it", async () => {
      const { plan } = await planned();
      const all = new Set(plan.steps().map((s) => s.id));

      const without = toggleStep(plan.steps(), all, "step-1", false);
      expect([...without]).toEqual(["step-3"]);
    });

    it("ticking a step ticks the ones it needs", async () => {
      const { plan } = await planned();
      const chosen = toggleStep(plan.steps(), new Set(), "step-2", true);
      expect([...chosen].sort()).toEqual(["step-1", "step-2"]);
    });

    it("leaves independent steps alone", async () => {
      const { plan } = await planned();
      const all = new Set(plan.steps().map((s) => s.id));
      expect(toggleStep(plan.steps(), all, "step-3", false).has("step-1")).toBe(
        true
      );
    });

    it("doesn't change the set it was given", async () => {
      const { plan } = await planned();
      const all = new Set(plan.steps().map((s) => s.id));
      toggleStep(plan.steps(), all, "step-1", false);
      expect(all.size).toBe(3);
    });
  });

  describe("applying", () => {
    const everything = (plan: ReturnType<typeof setup>["plan"]) =>
      new Set(plan.steps().map((s) => s.id));

    it("gives the real scenario exactly what the plan showed, ids included", async () => {
      const { live, plan } = await planned();
      const result = await applyPlan(live, plan.steps(), everything(plan));

      expect(result.failed).toEqual([]);
      expect(result.applied).toHaveLength(3);
      expect(live.scene().components).toEqual(plan.session.scene().components);
    });

    it("is one undo step, however many steps there are", async () => {
      const { live, plan } = await planned();
      const before = live.batches();
      await applyPlan(live, plan.steps(), everything(plan));
      expect(live.batches()).toBe(before + 1);
    });

    it("applies only the steps that were picked", async () => {
      const { live, plan } = await planned();
      const picked = toggleStep(
        plan.steps(),
        everything(plan),
        "step-1",
        false
      );
      const result = await applyPlan(live, plan.steps(), picked);

      expect(result.applied.map((s) => s.id)).toEqual(["step-3"]);
      expect(count(live)).toBe(1);
      expect(frameOf(find(live, BUTTON)).x).toBe(50);
    });

    it("reports a step that can't be done, and carries on with the rest", async () => {
      const { live, plan } = await planned();
      // step 2 picked without the step that makes its button
      const result = await applyPlan(
        live,
        plan.steps(),
        new Set(["step-2", "step-3"])
      );

      expect(result.applied.map((s) => s.id)).toEqual(["step-3"]);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].step.id).toBe("step-2");
      expect(result.failed[0].error).toMatch(/No component matches/);
    });

    it("reports a step whose target the author has since deleted", async () => {
      const { live, plan } = setup();
      await plan.execute("move", { targets: [BUTTON], x: 5 });
      await runCommand(live, "delete_components", { targets: [BUTTON] });

      const result = await applyPlan(live, plan.steps(), everything(plan));
      expect(result.applied).toEqual([]);
      expect(result.failed).toHaveLength(1);
    });

    it("applies nothing if nothing was picked", async () => {
      const { live, plan } = await planned();
      const result = await applyPlan(live, plan.steps(), new Set());
      expect(result).toEqual({ applied: [], failed: [] });
      expect(count(live)).toBe(1);
    });

    it("can be applied twice to different scenarios and make the same ids both times", async () => {
      const { live, plan } = await planned();
      const other = sessionFor(
        sceneOf(withText(box(BUTTON, 100, 100, 300, 100), "Existing"))
      );

      await applyPlan(live, plan.steps(), everything(plan));
      await applyPlan(other, plan.steps(), everything(plan));
      expect(Object.keys(other.scene().components).sort()).toEqual(
        Object.keys(live.scene().components).sort()
      );
    });
  });

  describe("describing steps for the author", () => {
    it("says what is being added, in words", async () => {
      const { plan } = setup();
      await plan.execute("add_button", { label: "Continue" });
      await plan.execute("add_text", {
        text: "Triage: heartRate is $$heartRate$$",
      });
      await plan.execute("add_shape", { shape: "ellipse" });
      await plan.execute("add_shape", { shape: "box" });

      expect(plan.steps().map(describeStep)).toEqual([
        'Add a button "Continue"',
        'Add text "Triage: heartRate is $$heartRate$$"',
        "Add an ellipse",
        "Add a box",
      ]);
    });

    it("leaves ids out of changes to what's already there", async () => {
      const { plan } = setup();
      await plan.execute("move", { targets: [BUTTON], x: 50 });
      await plan.execute("set_style", { targets: [BUTTON], fill: "red" });

      for (const step of plan.steps())
        expect(describeStep(step)).not.toMatch(/[0-9a-f]{8}/);
      expect(describeStep(plan.steps()[0])).toBe(
        'Moved the box "Existing" by -50, 0.'
      );
    });

    it("takes ids out of the descriptions whatever they look like", () => {
      const step = {
        id: "step-1",
        name: "resize",
        args: {},
        kind: "write" as const,
        summary:
          'Resized btn-next (box "Next"), 3f2a1b9c (box "Calm down"), zzzzzzzz (box).',
        created: [],
        dependsOn: [],
      };
      expect(describeStep(step)).toBe(
        'Resized the box "Next", the box "Calm down", the box.'
      );
    });

    it("cuts very long text", async () => {
      const { plan } = setup();
      await plan.execute("add_text", { text: "word ".repeat(40) });
      expect(describeStep(plan.steps()[0]).length).toBeLessThan(60);
    });
  });
});
