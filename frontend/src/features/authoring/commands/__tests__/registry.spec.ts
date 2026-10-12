import { describe, expect, it } from "vitest";
import { validateArgs } from "../define";
import { commands, getCommand, toolDefinitions } from "../registry";

describe("the command registry", () => {
  it("has uniquely named, snake_case commands that all explain themselves", () => {
    const names = commands.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const command of commands) {
      expect(command.name).toMatch(/^[a-z]+(_[a-z]+)*$/);
      expect(command.description.length).toBeGreaterThan(30);
      expect(["read", "write", "destructive"]).toContain(command.kind);
    }
  });

  it("compiles every schema, so a typo in one can't wait until it's called", () => {
    for (const command of commands) {
      // an empty object is either valid or fails with an ordinary error
      expect(() => validateArgs(command, {})).not.toThrow();
    }
  });

  it("only asks for arguments that exist", () => {
    for (const command of commands) {
      const { properties, required } = command.schema as {
        properties: Record<string, unknown>;
        required?: string[];
      };
      for (const name of required ?? [])
        expect(Object.keys(properties), `${command.name}.${name}`).toContain(
          name
        );
    }
  });

  it("lets every command act on a chosen scene", () => {
    for (const command of commands) {
      const { properties } = command.schema as {
        properties: Record<string, unknown>;
      };
      expect(properties.sceneId, command.name).toBeDefined();
    }
  });

  it("keeps deleting the only destructive command", () => {
    const destructive = commands.filter((c) => c.kind === "destructive");
    expect(destructive.map((c) => c.name)).toEqual(["delete_components"]);
  });

  it("looks commands up by name", () => {
    expect(getCommand("add_button")?.kind).toBe("write");
    expect(getCommand("nope")).toBeUndefined();
  });
});

describe("tool definitions", () => {
  it("are in the function-calling format, one per command", () => {
    const tools = toolDefinitions();
    expect(tools).toHaveLength(commands.length);
    for (const tool of tools) {
      expect(tool.type).toBe("function");
      expect(tool.function.parameters).toMatchObject({ type: "object" });
    }
  });

  it("can be limited by kind, as a read-only mode will need", () => {
    const readOnly = toolDefinitions(["read"]);
    const names = readOnly.map((t) => t.function.name);
    expect(names).toContain("get_scene");
    expect(names).not.toContain("add_shape");
    expect(names).not.toContain("delete_components");
  });
});

describe("argument validation", () => {
  const command = getCommand("move")!;

  it("accepts good arguments", () => {
    expect(validateArgs(command, { targets: ["a"], dx: 5 })).toMatchObject({
      ok: true,
    });
  });

  it("says what's wrong in plain words", () => {
    const result = validateArgs(command, { dx: 5 });
    expect(result).toMatchObject({ ok: false });
    expect(!result.ok && result.error).toMatch(/Invalid arguments for move/);
    expect(!result.ok && result.error).toMatch(/targets/);
  });

  it("forgives a lone value where a list was wanted, and numbers sent as text", () => {
    const result = validateArgs(command, { targets: "a", dx: "5" });
    expect(result).toMatchObject({ ok: true, args: { targets: ["a"], dx: 5 } });
  });

  it("drops arguments the command doesn't have", () => {
    const result = validateArgs(command, {
      targets: ["a"],
      dx: 1,
      colour: "red",
    });
    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.args).not.toHaveProperty("colour");
  });

  it("rejects values outside the allowed ones", () => {
    const align = getCommand("align")!;
    const result = validateArgs(align, {
      targets: ["a"],
      alignment: "diagonal",
    });
    expect(result.ok).toBe(false);
  });

  it("doesn't change what it was given", () => {
    const given = { targets: "a", dx: "5" };
    validateArgs(command, given);
    expect(given).toEqual({ targets: "a", dx: "5" });
  });
});
