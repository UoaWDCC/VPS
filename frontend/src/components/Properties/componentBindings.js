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
    propertyType: "number",
    supports: supports(allComponentTypes),
    apply: (component, value) => translateAxis(component, "x", value),
  },
  {
    key: "y",
    label: "Y position",
    propertyType: "number",
    supports: supports(allComponentTypes),
    apply: (component, value) => translateAxis(component, "y", value),
  },
  {
    key: "width",
    label: "Width",
    propertyType: "number",
    supports: supports(allComponentTypes),
    apply: (component, value) => resizeAxis(component, "x", value),
  },
  {
    key: "height",
    label: "Height",
    propertyType: "number",
    supports: supports(allComponentTypes),
    apply: (component, value) => resizeAxis(component, "y", value),
  },
  {
    key: "rotation",
    label: "Rotation",
    propertyType: "number",
    supports: supports(rotatableComponentTypes),
    apply: (component, value) => {
      component.bounds = { ...component.bounds, rotation: value };
    },
  },
  {
    key: "zIndex",
    label: "Layer order",
    propertyType: "number",
    supports: supports(allComponentTypes),
    apply: setProp("zIndex"),
  },
  {
    key: "clickable",
    label: "Clickable",
    propertyType: "boolean",
    supports: supports(allComponentTypes),
    apply: setProp("clickable"),
  },
  {
    key: "fill",
    label: "Fill colour",
    propertyType: "string",
    supports: supports(shapeComponentTypes),
    apply: setValidatedProp("fill", isSafeColor),
  },
  {
    key: "stroke",
    label: "Stroke colour",
    propertyType: "string",
    supports: supports(strokedComponentTypes),
    apply: setValidatedProp("stroke", isSafeColor),
  },
  {
    key: "strokeWidth",
    label: "Stroke width",
    propertyType: "number",
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

export function resolveComponentBindings(component, properties) {
  if (!component?.stateBindings?.length || !properties?.length) {
    return component;
  }

  const resolved = structuredClone(component);
  const propertyById = new Map(
    properties.map((property) => [property.id, property])
  );
  const bindingByTarget = new Map(
    component.stateBindings.map((binding) => [binding.target, binding])
  );

  for (const target of getComponentBindingTargets(component)) {
    const binding = bindingByTarget.get(target.key);
    if (!binding) continue;

    const property = propertyById.get(binding.stateVariableId);
    if (!property || property.type !== target.propertyType) continue;

    target.apply(resolved, property.value);
  }

  return resolved;
}

export function resolveSceneBindings(scene, properties) {
  if (!scene?.components || !properties?.length) return scene;

  return {
    ...scene,
    components: Object.fromEntries(
      Object.entries(scene.components).map(([id, component]) => [
        id,
        resolveComponentBindings(component, properties),
      ])
    ),
  };
}
