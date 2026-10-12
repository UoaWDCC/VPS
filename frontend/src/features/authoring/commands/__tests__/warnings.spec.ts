import { describe, expect, it } from "vitest";
import { spatialIssues } from "../warnings";
import { box, sceneOf, withText } from "./helpers";

const canvas = { width: 1920, height: 1080 };

describe("spatialIssues", () => {
  it("is quiet when everything is where it should be", () => {
    const scene = sceneOf(
      box("a", 100, 100, 200, 100),
      box("b", 500, 100, 200, 100)
    );
    expect(spatialIssues(scene, canvas)).toEqual([]);
  });

  describe("off the canvas", () => {
    it("says which edge, and by how much", () => {
      const scene = sceneOf(box("aaaaaaaa-1", -30, 1050, 200, 100));
      const [issue] = spatialIssues(scene, canvas);
      expect(issue).toContain("30px past the left edge");
      expect(issue).toContain("70px past the bottom edge");
    });

    it("allows exactly touching the edge", () => {
      const scene = sceneOf(box("a", 0, 0, 1920, 1080));
      expect(spatialIssues(scene, canvas)).toEqual([]);
    });

    it("looks at the box as turned, not as drawn", () => {
      // 1000 wide, 100 tall, at the top; turned a quarter it hangs above the canvas
      const scene = sceneOf(
        box("aaaaaaaa-1", 500, 0, 1000, 100, {
          bounds: {
            verts: [
              { x: 500, y: 0 },
              { x: 1500, y: 100 },
            ],
            rotation: 90,
          },
        })
      );
      expect(spatialIssues(scene, canvas)[0]).toContain("past the top edge");
    });
  });

  describe("overlaps", () => {
    it("reports shapes that cover each other", () => {
      const scene = sceneOf(
        box("aaaaaaaa-1", 0, 0, 200, 200),
        box("bbbbbbbb-2", 100, 100, 200, 200)
      );
      const [issue] = spatialIssues(scene, canvas);
      expect(issue).toMatch(/aaaaaaaa.*bbbbbbbb.*overlap by 25%/);
    });

    it("lets a label sit on its button: containing isn't covering", () => {
      const scene = sceneOf(
        box("a", 100, 100, 400, 120),
        box("b", 150, 130, 200, 60)
      );
      expect(spatialIssues(scene, canvas)).toEqual([]);
    });

    it("ignores a graze", () => {
      const scene = sceneOf(
        box("a", 0, 0, 100, 100),
        box("b", 95, 0, 100, 100)
      );
      expect(spatialIssues(scene, canvas)).toEqual([]);
    });
  });

  describe("text that won't fit", () => {
    const labelled = (text: string, height: number, fontSize = 40) =>
      sceneOf(
        withText(box("aaaaaaaa-1", 100, 100, 300, height), text, { fontSize })
      );

    it("warns when there's clearly not enough room", () => {
      const scene = labelled(
        "This is a long message that cannot possibly fit in a short box",
        60
      );
      expect(spatialIssues(scene, canvas)[0]).toMatch(/may not fit its text/);
    });

    it("lets text that fits be", () => {
      expect(spatialIssues(labelled("Continue", 120), canvas)).toEqual([]);
    });

    it("counts each line break", () => {
      const scene = labelled("one\ntwo\nthree\nfour", 60);
      expect(spatialIssues(scene, canvas)[0]).toMatch(/may not fit/);
    });
  });

  it("can be limited to what just changed", () => {
    const scene = sceneOf(
      box("aaaaaaaa-1", -50, 0, 100, 100),
      box("bbbbbbbb-2", 5000, 0, 100, 100)
    );
    expect(spatialIssues(scene, canvas, ["bbbbbbbb-2"])).toHaveLength(1);
    expect(spatialIssues(scene, canvas, ["bbbbbbbb-2"])[0]).toContain(
      "bbbbbbbb"
    );
    expect(spatialIssues(scene, canvas, [])).toEqual([]);
  });
});
