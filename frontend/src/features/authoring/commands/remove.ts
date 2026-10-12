import { defineCommand } from "./define";
import { describeComponent, resolveComponents } from "./resolve";
import * as s from "./schemas";
import type { Command } from "./types";

const deleteComponents = defineCommand<{ targets: string[] }>({
  name: "delete_components",
  description:
    "Delete components from the scene. This removes them for good (the author can undo it, but nothing else will bring them back), so only use it when asked or when it's clearly what's wanted.",
  kind: "destructive",
  schema: {
    required: ["targets"],
    properties: { targets: s.targets },
  },
  run: ({ scene, args, world }) => {
    const next = structuredClone(scene);
    const chosen = resolveComponents(next, args.targets, world);
    const names = chosen.map(describeComponent);

    chosen.forEach((c) => delete next.components[c.id]);

    return {
      scene: next,
      // whatever was selected and is now gone shouldn't stay selected
      select:
        scene._id === world.openSceneId
          ? world.selection.filter((id) => !chosen.some((c) => c.id === id))
          : undefined,
      summary: `Deleted ${names.join(", ")}.`,
    };
  },
});

export const removeCommands: Command[] = [deleteComponents];
