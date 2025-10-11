import { getComponent, getComponentProp } from "../../scene/scene";
import useEditorStore from "../../stores/editor";
import type { Bounds, Vec2 } from "../../types";
import { add, clamp, correct, deg, divide, getBoxCenter, multiply, rotate, scale, subtract } from "../../util";

type HandleType = "size" | "rotation";

let type: HandleType;
let coords: number[];

export function handleResizeStart(e: React.MouseEvent) {
    const { setMode } = useEditorStore.getState();

    const target = e.target as HTMLElement;
    type = target.dataset.type as HandleType;
    coords = target.dataset.coords!.split(",").map(s => Number(s));

    setMode(["resize"]);
}

export function handleResizeDrag(e: React.MouseEvent, position: Vec2) {
    const { addMode, setMutationBounds, selected } = useEditorStore.getState();
    addMode("mutation");

    const bounds = getComponentProp(selected!, "bounds");

    const newBounds: Partial<Bounds> = {};

    if (type === "size") {
        const relative = rotate(position, getBoxCenter(bounds.verts), -bounds.rotation);
        newBounds.verts = updateResize(relative, coords, e.ctrlKey, e.shiftKey);
    } else if (type === "rotation") {
        newBounds.rotation = getRotation(position, getBoxCenter(bounds.verts), e.shiftKey);
    }

    setMutationBounds((prev) => ({ ...prev, ...newBounds }));
}

function getRotation(v: Vec2, origin: Vec2, snap: boolean) {
    const relative = subtract(v, origin);
    const angle = deg(Math.atan2(relative.x, -relative.y));
    return snap ? Math.round(angle / 15) * 15 : angle;
}

// NOTE: potentially overcomplicated implementation
function getNewTail(verts: Vec2[], newVerts: Vec2[], coords: number[]) {
    const point = { x: 0, y: 0 };
    const inversePoint = { x: 0, y: 0 };
    const newPoint = { x: 0, y: 0 };

    if (coords[0] !== 0.5) {
        point.x = verts[coords[0]].x;
        inversePoint.x = verts[1 - coords[0]].x;
        newPoint.x = newVerts[coords[0]].x;
    }

    if (coords[1] !== 0.5) {
        point.y = verts[coords[1]].y;
        inversePoint.y = verts[1 - coords[1]].y;
        newPoint.y = newVerts[coords[1]].y;
    }

    const diff = subtract(newPoint, point);
    const ratio = divide(subtract(verts[2], inversePoint), subtract(point, inversePoint));
    const scale = clamp(ratio, 0, 1);
    return add(verts[2], multiply(diff, scale));
}

function lockAspect(verts: Vec2[], newVerts: Vec2[], coords: number[]) {
    const inversePoint = { x: verts[1 - coords[0]].x, y: verts[1 - coords[1]].y };
    const newPoint = { x: newVerts[coords[0]].x, y: newVerts[coords[1]].y };

    const { x: dx, y: dy } = subtract(newPoint, inversePoint);
    const aspect = getAspect(verts);
    if (Math.abs(dx) >= Math.abs(dy)) {
        newVerts[coords[1]].y = inversePoint.y + Math.sign(dy) * (Math.abs(dx) / aspect);
    } else {
        newVerts[coords[0]].x = inversePoint.x + Math.sign(dx) * (Math.abs(dy) * aspect);
    }
}

function getAspect(verts: Vec2[]) {
    const width = Math.abs(verts[1].x - verts[0].x);
    const height = Math.abs(verts[1].y - verts[0].y);
    return width / height;
}

function inverse(coords: number[]) {
    return [1 - coords[0], 1 - coords[1]];
}

function updateResize(position: Vec2, coords: number[], anchorCenter: boolean, fixed: boolean) {
    const { selected } = useEditorStore.getState();
    const { bounds, type } = getComponent(selected!);
    const center = getBoxCenter(bounds.verts);

    let verts = modifyVerts(bounds.verts, coords, position);

    if (!coords.includes(2)) { // none of these apply to the speech triangle
        // shift modifier
        if (fixed && !coords.includes(0.5)) {
            lockAspect(bounds.verts, verts, coords);
        }

        if (type === "speech") {
            verts[2] = getNewTail(bounds.verts, verts, coords);
        }

        // alt modifier
        if (anchorCenter) {
            const mirrored = mirror(verts, center, coords);
            if (type === "speech") {
                mirrored[2] = getNewTail(verts, mirrored, inverse(coords));
            }
            verts = mirrored;
        }
    }

    return correct(verts, center, bounds.rotation);
}

function mirror(verts: Vec2[], center: Vec2, coords: number[]) {
    const point = { x: verts[coords[0]].x, y: verts[coords[1]].y };
    const inversePosition = add(scale(subtract(point, center), -1), center);
    return modifyVerts(verts, inverse(coords), inversePosition);
}

function modifyVerts(verts: Vec2[], coords: number[], v: Vec2) {
    const newVerts = verts.map((v) => ({ ...v }));
    if (coords[1] !== 0.5) newVerts[coords[1]].y = v.y;
    if (coords[0] !== 0.5) newVerts[coords[0]].x = v.x;
    return newVerts;
}
