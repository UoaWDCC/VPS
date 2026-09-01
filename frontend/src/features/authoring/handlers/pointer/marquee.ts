import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import type { Component, Vec2 } from "../../types";
import {
  expandBoxVerts,
  getRotatedCorners,
  polygonsIntersect,
  subtract,
} from "../../util";

// below this drag distance (canvas units), treat mouseup as a plain click
// rather than a marquee -- otherwise a click with no movement still runs a
// zero-area hit test, which can select a component the user never visually
// touched (e.g. an unfilled shape whose bounds cover that point)
const MIN_DRAG_DISTANCE = 2;

// pre-drag selection, so a shift-drag adds to it rather than replacing it
let baseSelection: string[] = [];

export function handleMarqueeStart(e: React.MouseEvent, position: Vec2) {
  const { selected, setOffset, setMutationBounds, setMode } =
    useEditorStore.getState();

  baseSelection = e.shiftKey ? selected : [];

  setOffset(position);
  setMutationBounds({ verts: [position, position], rotation: 0 });
  setMode(["marquee"]);
}

function getMarqueeHits(
  rectVerts: Vec2[],
  components: Record<string, Component>
) {
  const rectCorners = expandBoxVerts(rectVerts);

  return Object.values(components)
    .filter((component) =>
      polygonsIntersect(rectCorners, getRotatedCorners(component.bounds))
    )
    .map((component) => component.id);
}

export function handleMarqueeDrag(_: React.MouseEvent, position: Vec2) {
  const { offset, setMutationBounds } = useEditorStore.getState();
  setMutationBounds((prev) => ({ ...prev, verts: [offset, position] }));
}

export function handleMarqueeEnd() {
  const { mutationBounds, setSelected, setMode } = useEditorStore.getState();
  const { components } = useVisualScene.getState();

  const [a, b] = mutationBounds.verts;
  const delta = subtract(b, a);
  const dragged = Math.hypot(delta.x, delta.y) > MIN_DRAG_DISTANCE;
  const hits = dragged ? getMarqueeHits(mutationBounds.verts, components) : [];

  setSelected(Array.from(new Set([...baseSelection, ...hits])));
  setMode(["normal"]);
}
