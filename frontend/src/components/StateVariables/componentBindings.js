import {
  clamp1,
  getRelativeBounds,
  multiply,
  scale,
  translate,
} from "../../features/authoring/util.ts";

const allComponentTypes = [
  "box",
  "ellipse",
  "image",
  "line",
  "speech",
  "textbox",
];

const shapeComponentTypes = ["box", "ellipse", "speech", "textbox"];
const strokedComponentTypes = [...shapeComponentTypes, "line"];
const rotatableComponentTypes = allComponentTypes.filter(
  (type) => type !== "line"
);

function supports(types) {
  return (component) => types.includes(component.type);
}

function translateAxis(component, axis, value) {
  const bounds = getRelativeBounds(component.bounds.verts);
  const delta = { x: 0, y: 0, [axis]: value - bounds[axis] };
  component.bounds = {
    ...component.bounds,
    verts: translate(component.bounds.verts, delta),
  };
}

function resizeAxis(component, axis, value) {
  const bounds = getRelativeBounds(component.bounds.verts);
  const dimension = axis === "x" ? "width" : "height";
  const size = clamp1(value, 0, Infinity);
  const origin = { x: bounds.x, y: bounds.y };

  if (bounds[dimension] === 0) {
    component.bounds = {
      ...component.bounds,
      verts: component.bounds.verts.map((vert, index) => ({
        ...vert,
        ...(index === 1 && { [axis]: origin[axis] + size }),
      })),
    };
    return;
  }

  const factor = { x: 1, y: 1, [axis]: size / bounds[dimension] };
  const relativeVerts = translate(component.bounds.verts, scale(origin, -1));
  component.bounds = {
    ...component.bounds,
    verts: translate(
      relativeVerts.map((vert) => multiply(vert, factor)),
      origin
    ),
  };
}

function setProp(prop) {
  return (component, value) => {
    component[prop] = value;
  };
}

function setValidatedProp(prop, isValid) {
  return (component, value) => {
    if (isValid(value)) component[prop] = value.trim();
  };
}

function isSafeColor(value) {
  if (typeof value !== "string") return false;

  const color = value.trim();
  if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(color)) {
    return true;
  }

  if (/^(?:transparent|currentcolor)$/i.test(color)) return true;

  return /^(?:rgb|rgba|hsl|hsla)\(\s*-?(?:\d*\.)?\d+%?(?:\s*[,/ ]\s*-?(?:\d*\.)?\d+%?){2,4}\s*\)$/i.test(
    color
  );
}

export const componentBindingTargets = [
  {
    key: "x",
    label: "X position",
    stateType: "number",
    supports: supports(allComponentTypes),
    apply: (component, value) => translateAxis(component, "x", value),
  },
  {
    key: "y",
    label: "Y position",
    stateType: "number",
    supports: supports(allComponentTypes),
    apply: (component, value) => translateAxis(component, "y", value),
  },
  {
    key: "width",
    label: "Width",
    stateType: "number",
    supports: supports(allComponentTypes),
    apply: (component, value) => resizeAxis(component, "x", value),
  },
  {
    key: "height",
    label: "Height",
    stateType: "number",
    supports: supports(allComponentTypes),
    apply: (component, value) => resizeAxis(component, "y", value),
  },
  {
    key: "rotation",
    label: "Rotation",
    stateType: "number",
    supports: supports(rotatableComponentTypes),
    apply: (component, value) => {
      component.bounds = { ...component.bounds, rotation: value };
    },
  },
  {
    key: "zIndex",
    label: "Layer order",
    stateType: "number",
    supports: supports(allComponentTypes),
    apply: setProp("zIndex"),
  },
  {
    key: "clickable",
    label: "Clickable",
    stateType: "boolean",
    supports: supports(allComponentTypes),
    apply: setProp("clickable"),
  },
  {
    key: "fill",
    label: "Fill colour",
    stateType: "string",
    supports: supports(shapeComponentTypes),
    apply: setValidatedProp("fill", isSafeColor),
  },
  {
    key: "stroke",
    label: "Stroke colour",
    stateType: "string",
    supports: supports(strokedComponentTypes),
    apply: setValidatedProp("stroke", isSafeColor),
  },
  {
    key: "strokeWidth",
    label: "Stroke width",
    stateType: "number",
    supports: supports(strokedComponentTypes),
    apply: (component, value) => {
      component.strokeWidth = clamp1(value, 0, Infinity);
    },
  },
];

export function getComponentBindingTargets(component) {
  if (!component) return [];
  return componentBindingTargets.filter((target) => target.supports(component));
}

export function resolveComponentBindings(component, stateVariables) {
  if (!component?.stateBindings?.length || !stateVariables?.length) {
    return component;
  }

  const resolved = structuredClone(component);
  const stateById = new Map(
    stateVariables.map((stateVariable) => [stateVariable.id, stateVariable])
  );
  const bindingByTarget = new Map(
    component.stateBindings.map((binding) => [binding.target, binding])
  );

  for (const target of getComponentBindingTargets(component)) {
    const binding = bindingByTarget.get(target.key);
    if (!binding) continue;

    const stateVariable = stateById.get(binding.stateVariableId);
    if (!stateVariable || stateVariable.type !== target.stateType) continue;

    target.apply(resolved, stateVariable.value);
  }

  return resolved;
}

export function resolveSceneBindings(scene, stateVariables) {
  if (!scene?.components || !stateVariables?.length) return scene;

  return {
    ...scene,
    components: Object.fromEntries(
      Object.entries(scene.components).map(([id, component]) => [
        id,
        resolveComponentBindings(component, stateVariables),
      ])
    ),
  };
}
