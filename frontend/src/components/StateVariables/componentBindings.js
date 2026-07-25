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

function updateBounds(component, updater) {
  component.bounds = {
    ...component.bounds,
    verts: component.bounds.verts.map((vert) => ({ ...vert })),
  };
  updater(component.bounds);
}

function translateAxis(component, axis, value) {
  updateBounds(component, (bounds) => {
    const current = Math.min(bounds.verts[0][axis], bounds.verts[1][axis]);
    const delta = value - current;
    bounds.verts.forEach((vert) => {
      vert[axis] += delta;
    });
  });
}

function resizeAxis(component, axis, value) {
  updateBounds(component, (bounds) => {
    const size = Math.max(0, value);
    const currentMin = Math.min(bounds.verts[0][axis], bounds.verts[1][axis]);
    const currentSize = Math.abs(bounds.verts[1][axis] - bounds.verts[0][axis]);

    if (currentSize === 0) {
      bounds.verts[1][axis] = bounds.verts[0][axis] + size;
      return;
    }

    const scale = size / currentSize;
    bounds.verts.forEach((vert) => {
      vert[axis] = currentMin + (vert[axis] - currentMin) * scale;
    });
  });
}

function setProp(prop) {
  return (component, value) => {
    component[prop] = value;
  };
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
    key: "opacity",
    label: "Opacity",
    stateType: "number",
    supports: supports(allComponentTypes),
    apply: (component, value) => {
      component.opacity = Math.max(0, Math.min(1, value));
    },
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
    apply: setProp("fill"),
  },
  {
    key: "stroke",
    label: "Stroke colour",
    stateType: "string",
    supports: supports(strokedComponentTypes),
    apply: setProp("stroke"),
  },
  {
    key: "strokeWidth",
    label: "Stroke width",
    stateType: "number",
    supports: supports(strokedComponentTypes),
    apply: (component, value) => {
      component.strokeWidth = Math.max(0, value);
    },
  },
  {
    key: "padding",
    label: "Text padding",
    stateType: "number",
    supports: supports(["textbox"]),
    apply: (component, value) => {
      component.padding = Math.max(0, value);
    },
  },
  {
    key: "href",
    label: "Image source",
    stateType: "string",
    supports: supports(["image"]),
    apply: setProp("href"),
  },
  {
    key: "preserveAspectRatio",
    label: "Image aspect ratio",
    stateType: "string",
    supports: supports(["image"]),
    apply: setProp("preserveAspectRatio"),
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
