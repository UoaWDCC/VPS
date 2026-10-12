import type { Component, Scene } from "../types";
import { componentText } from "./text";
import { CommandError, type World } from "./types";

// Ways the model can point at things. It can use the ids it was shown (or a
// unique start of one, since a model copying a long id is a model making
// typos), "selected", or just the words on a button. Anything ambiguous is
// an error that lists the candidates, so it can say which one it meant.

/** Ids are shown shortened; the start of an id is enough to find it again. */
export const SHORT_ID_LENGTH = 8;
const MIN_PREFIX = 4;

export function shortId(id: string) {
  return id.slice(0, SHORT_ID_LENGTH);
}

export function describeComponent(component: Component) {
  const text = componentText(component).replace(/\s+/g, " ").trim();
  const label = text
    ? ` "${text.length > 30 ? `${text.slice(0, 29)}…` : text}"`
    : "";
  return `${shortId(component.id)} (${component.type}${label})`;
}

function candidates(list: Component[]) {
  return list.slice(0, 6).map(describeComponent).join(", ");
}

function resolveOne(scene: Scene, ref: string, selection: string[]) {
  const components = Object.values(scene.components);
  const wanted = ref.trim();

  if (wanted.toLowerCase() === "selected") {
    return components.filter((c) => selection.includes(c.id));
  }

  const exact = components.find((c) => c.id === wanted);
  if (exact) return [exact];

  if (wanted.length >= MIN_PREFIX) {
    const byPrefix = components.filter((c) => c.id.startsWith(wanted));
    if (byPrefix.length === 1) return byPrefix;
    if (byPrefix.length > 1)
      throw new CommandError(
        `"${ref}" matches more than one component: ${candidates(byPrefix)}. Use more of the id.`
      );
  }

  const lower = wanted.toLowerCase();
  const sameText = components.filter(
    (c) => componentText(c).trim().toLowerCase() === lower
  );
  if (sameText.length) return sameText;

  const containsText = components.filter((c) =>
    componentText(c).toLowerCase().includes(lower)
  );
  return containsText;
}

/**
 * The components `refs` point at, each once, in the order asked for.
 * A reference that matches several components by its text stands for all of
 * them; one that matches nothing is an error.
 */
export function resolveComponents(
  scene: Scene,
  refs: string[],
  world: Pick<World, "selection" | "openSceneId">
) {
  const selection = scene._id === world.openSceneId ? world.selection : [];
  const found = new Map<string, Component>();

  for (const ref of refs) {
    const matches = resolveOne(scene, ref, selection);

    if (!matches.length) {
      const hint =
        ref.trim().toLowerCase() === "selected"
          ? "Nothing is selected."
          : `No component matches "${ref}". Use get_scene to see the ids.`;
      throw new CommandError(hint);
    }

    matches.forEach((c) => found.set(c.id, c));
  }
  return [...found.values()];
}

/** Exactly one component, for commands that act on a single thing. */
export function resolveComponent(
  scene: Scene,
  ref: string,
  world: Pick<World, "selection" | "openSceneId">
) {
  const matches = resolveComponents(scene, [ref], world);
  if (matches.length > 1)
    throw new CommandError(
      `"${ref}" matches ${matches.length} components: ${candidates(matches)}. Use an id.`
    );
  return matches[0];
}

/** A scene by id, the start of an id, or exact name. */
export function resolveScene(world: World, ref: string) {
  const wanted = ref.trim();
  const scenes = world.scenes;

  const byId = scenes.find((s) => s._id === wanted);
  if (byId) return byId;

  const lower = wanted.toLowerCase();
  const byName = scenes.filter((s) => s.name.trim().toLowerCase() === lower);
  if (byName.length === 1) return byName[0];
  if (byName.length > 1)
    throw new CommandError(
      `More than one scene is called "${ref}". Use its id.`
    );

  if (wanted.length >= MIN_PREFIX) {
    const byPrefix = scenes.filter((s) => s._id.startsWith(wanted));
    if (byPrefix.length === 1) return byPrefix[0];
    if (byPrefix.length > 1)
      throw new CommandError(
        `"${ref}" matches more than one scene (${byPrefix.map((s) => s.name).join(", ")}). Use the scene's name or full id.`
      );
  }

  throw new CommandError(
    `No scene matches "${ref}". Scenes: ${scenes
      .map((s) => `${s.name} (${s._id})`)
      .join(", ")}.`
  );
}
