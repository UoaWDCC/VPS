import { describe, expect, it } from "vitest";
import { PALETTE } from "../../library/palette.js";
import { contrastRatio, parseColor, readableTextColor } from "../colors";
import { CommandError } from "../types";

describe("parseColor", () => {
  it("turns hex codes into the editor's 8 digit form", () => {
    expect(parseColor("#0080a7")).toBe("#0080a7ff");
    expect(parseColor("#0080a780")).toBe("#0080a780");
    expect(parseColor("#abc")).toBe("#aabbccff");
    expect(parseColor("#abcd")).toBe("#aabbccdd");
  });

  it("is forgiving about case, spaces and the missing #", () => {
    expect(parseColor("  #0080A7 ")).toBe("#0080a7ff");
    expect(parseColor("0080a7")).toBe("#0080a7ff");
  });

  it("understands basic names", () => {
    expect(parseColor("White")).toBe("#ffffffff");
    expect(parseColor("black")).toBe("#000000ff");
    expect(parseColor("grey")).toBe(parseColor("gray"));
  });

  it("understands the app's own theme colours, so builds match the product", () => {
    expect(parseColor("accent")).toBe(`${PALETTE.accent}ff`);
    expect(parseColor("success")).toBe(`${PALETTE.success}ff`);
    expect(parseColor("danger")).toBe(parseColor("error"));
  });

  it("has a way to clear a colour", () => {
    expect(parseColor("transparent")).toBe("#00000000");
    expect(parseColor("none")).toBe("#00000000");
  });

  it("says what is accepted when it can't understand", () => {
    expect(() => parseColor("blurple")).toThrow(CommandError);
    expect(() => parseColor("blurple")).toThrow(/accent/);
    expect(() => parseColor("#12")).toThrow(CommandError);
    expect(() => parseColor("rgb(1,2,3)")).toThrow(CommandError);
  });
});

describe("readableTextColor", () => {
  it("picks light text on dark fills and dark text on light fills", () => {
    expect(readableTextColor("#000000ff")).toBe(PALETTE.onSolid);
    expect(readableTextColor("#ffffffff")).toBe(PALETTE.content);
    expect(readableTextColor(`${PALETTE.neutral}ff`)).toBe(PALETTE.onSolid);
    expect(readableTextColor("#fdd835ff")).toBe(PALETTE.content);
  });

  it("treats a clear fill as the white canvas", () => {
    expect(readableTextColor("#00000000")).toBe(PALETTE.content);
    expect(readableTextColor(undefined)).toBe(PALETTE.content);
  });

  it("always reaches readable contrast on the theme's own colours", () => {
    for (const fill of [
      PALETTE.accent,
      PALETTE.success,
      PALETTE.error,
      PALETTE.warning,
      PALETTE.info,
      PALETTE.neutral,
    ]) {
      const text = readableTextColor(`${fill}ff`);
      expect(contrastRatio(text, fill), fill).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for the same colour", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });
});
