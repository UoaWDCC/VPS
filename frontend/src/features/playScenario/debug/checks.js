import { validOperations } from "../../../components/Properties/propertyTypes.js";
import { componentLabel } from "./describe.js";

// Matches the `$$name$$` substitution done in PlayScenarioCanvas. Chips are
// swapped for a NUL before scanning so a match can't span one, as at runtime.
const PLACEHOLDER = /\$\$([^\0\n]*?)\$\$/g;
const CHIP = "\0";

const LEVEL_ORDER = { error: 0, warning: 1, info: 2 };

function checkText(component, label, properties, add) {
  const propertyById = new Map(properties.map((p) => [p.id, p]));
  const propertyNames = new Set(properties.map((p) => p.name));
  const reported = new Set();

  for (const block of component.document?.blocks ?? []) {
    let text = "";
    for (const span of block.spans ?? []) {
      if (span.property) {
        text += CHIP;
        if (
          !propertyById.has(span.property.id) &&
          !reported.has(span.property.id)
        ) {
          reported.add(span.property.id);
          add(
            "error",
            `${label} shows the property "${span.property.displayName}", which no longer exists`
          );
        }
      } else {
        text += span.text ?? "";
      }
    }

    for (const match of text.matchAll(PLACEHOLDER)) {
      const name = match[1];
      if (propertyNames.has(name) || reported.has(`$$${name}`)) continue;
      reported.add(`$$${name}`);
      add(
        "warning",
        `${label} contains $$${name}$$ but no property is named "${name}", so it shows as typed`
      );
    }
  }
}

function checkBindings(component, label, properties, getBindingTargets, add) {
  const bindings = component.stateBindings ?? [];
  if (!bindings.length) return;

  const targets = getBindingTargets(component);
  for (const binding of bindings) {
    const target = targets.find(
      (candidate) => candidate.key === binding.target
    );
    const targetName = target?.label ?? binding.target;
    const property = properties.find((p) => p.id === binding.stateVariableId);

    if (!property) {
      add(
        "error",
        `${label}: ${targetName} is bound to a property that no longer exists`
      );
    } else if (!target) {
      add(
        "warning",
        `${label}: the "${binding.target}" binding doesn't apply to this kind of component`
      );
    } else if (property.type !== target.propertyType) {
      add(
        "error",
        `${label}: ${targetName} needs a ${target.propertyType} property, but ${property.name} is ${property.type}`
      );
    }
  }
}

function checkOperations(ops, owner, properties, add) {
  for (const op of ops ?? []) {
    const property = properties.find((p) => p.id === op.stateVariableId);

    if (!property) {
      add(
        "error",
        `${owner} changes a property that no longer exists (${op.displayName ?? "unknown"}), so that change is skipped`
      );
    } else if (!validOperations[property.type]?.includes(op.operation)) {
      add(
        "error",
        `${owner}: "${op.operation}" can't be used on the ${property.type} property ${property.name}`
      );
    } else if (property.type === "number" && typeof op.value !== "number") {
      add(
        "warning",
        `${owner}: the value for ${property.name} isn't a number, so "${op.operation}" will give wrong results`
      );
    }
  }
}

// New shapes are clickable by default, so a clickable with no destination is
// normal and not worth flagging. A destination that's gone is.
function checkDestination(component, label, hasScene, add) {
  if (!component.clickable || !component.nextScene) return;
  if (hasScene(component.nextScene)) return;

  add(
    "error",
    `${label} leads to a scene that no longer exists, so pressing it does nothing`
  );
}

/**
 * Static checks for the scene being played, looking for things that fail
 * silently at runtime. Pure so it can be unit tested.
 *
 * @param {object} args
 * @param {object} args.scene scene as returned by the navigate API
 * @param {Array} args.properties the player's current properties
 * @param {(sceneId: string) => boolean} args.hasScene whether a scene is loaded
 * @param {boolean} args.neighborsLoaded whether the scenes this one links to have been loaded yet. Until they have, a missing scene proves nothing, so destinations aren't checked
 * @param {(component: object) => Array} args.getBindingTargets valid binding targets for a component
 * @returns {{ level: "error" | "warning" | "info", message: string }[]}
 */
export function checkScene({
  scene,
  properties = [],
  hasScene = () => true,
  neighborsLoaded = true,
  getBindingTargets = () => [],
}) {
  if (!scene) return [];

  const problems = [];
  const add = (level, message) => problems.push({ level, message });
  const components = Object.values(scene.components ?? {});

  for (const component of components) {
    const label = componentLabel(component);
    checkText(component, label, properties, add);
    checkBindings(component, label, properties, getBindingTargets, add);
    checkOperations(component.stateOperations, label, properties, add);
    if (neighborsLoaded) checkDestination(component, label, hasScene, add);
  }

  checkOperations(
    scene.timerStateOperations,
    "The scene timer",
    properties,
    add
  );

  const hasExit =
    Boolean(scene.directLink) ||
    components.some(
      (c) => c.clickable && c.nextScene && c.nextScene !== scene._id
    );
  if (!hasExit) {
    add(
      "info",
      "Nothing in this scene leads to another scene. Fine for a last scene, otherwise players get stuck"
    );
  }

  return problems.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}
