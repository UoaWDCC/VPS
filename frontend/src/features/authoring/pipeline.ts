import { buildVisualDocument } from "./text/build";
import type { Component, RelativeBounds, Scene, Vec2 } from "./types";
import { add, getBoxCenter, getRelativeBounds, mutate, scale, subtract } from "./util";

export function buildVisualScene(modelScene: Scene) {
    const visualComponents = {};
    for (const component of Object.values(modelScene.components)) {
        visualComponents[component.id] = buildVisualComponent(component);
    }
    return visualComponents;
}

function pad(verts: Vec2[], amount: number) {
    const center = getBoxCenter(verts);
    return verts.map((vert) => {
        const relative = subtract(center, vert);
        const dir = mutate(relative, (val) => val / Math.abs(val));
        return add(vert, scale(dir, amount));
    });
}

export function buildVisualComponent(component: Component): Component {
    switch (component.type) {
        case "textbox":
            const relative = getRelativeBounds(
                pad(component.bounds.verts, component.padding),
            ) as RelativeBounds;
            relative.rotation = component.bounds.rotation;
            const doc = { ...component.document, bounds: relative, id: component.id };
            return { ...component, document: buildVisualDocument(doc) };
        default:
            return { ...component };
    }
}
