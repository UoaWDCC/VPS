import { describe, expect, it } from "@jest/globals";

import {
  MODES,
  TOOL_KINDS,
  isKnownTool,
  isMode,
  isToolAllowed,
  toolsFor,
} from "../modes.js";

describe("modes", () => {
  it("has the five modes", () => {
    expect(MODES).toEqual(["ask", "plan", "build", "test", "review"]);
    expect(isMode("ask")).toBe(true);
    expect(isMode("admin")).toBe(false);
    expect(isMode(undefined)).toBe(false);
    expect(isMode("toString")).toBe(false);
  });

  it("only knows the tools it lists", () => {
    expect(isKnownTool("get_scene")).toBe(true);
    expect(isKnownTool("drop_database")).toBe(false);
    expect(isKnownTool("constructor")).toBe(false);
    expect(isKnownTool(42)).toBe(false);
  });

  describe("ask", () => {
    it("can look but not change", () => {
      expect(isToolAllowed("ask", "get_scene")).toBe(true);
      expect(isToolAllowed("ask", "run_checks")).toBe(true);
      expect(isToolAllowed("ask", "select")).toBe(true);
      expect(isToolAllowed("ask", "move")).toBe(false);
      expect(isToolAllowed("ask", "set_conditional_destination")).toBe(false);
      expect(isToolAllowed("ask", "delete_components")).toBe(false);
    });

    it("is offered nothing but read tools", () => {
      const kinds = new Set(toolsFor("ask").map((name) => TOOL_KINDS[name]));
      expect([...kinds]).toEqual(["read"]);
    });
  });

  describe.each(["plan", "build"])("%s", (mode) => {
    it("can read, write and delete", () => {
      expect(isToolAllowed(mode, "get_scene")).toBe(true);
      expect(isToolAllowed(mode, "add_button")).toBe(true);
      expect(isToolAllowed(mode, "delete_components")).toBe(true);
    });
  });

  it("keeps test and review to reading, plus their own tools", () => {
    for (const mode of ["test", "review"]) {
      expect(isToolAllowed(mode, "get_scene")).toBe(true);
      expect(isToolAllowed(mode, "move")).toBe(false);
      expect(isToolAllowed(mode, "delete_components")).toBe(false);
    }
  });

  it("allows nothing for a mode that doesn't exist", () => {
    expect(isToolAllowed("admin", "get_scene")).toBe(false);
    expect(isToolAllowed("constructor", "get_scene")).toBe(false);
    expect(toolsFor("admin")).toEqual([]);
  });
});
