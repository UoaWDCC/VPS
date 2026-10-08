import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import type { Bounds, Component, Vec2 } from "../../types";
import {
  expandBoxVerts,
  getRotatedCorners,
  polygonsIntersect,
  subtract,
} from "../../util";
import { getSelectedComponentBounds } from "./pointer";

// below this drag distance (canvas units), treat the gesture as a plain
// click rather than a marquee -- this both skips the (otherwise zero-area)
// hit test on mouseup, and gates marquee-only visuals (crosshair cursor,
// the dashed rectangle) so they don't flash on an ordinary click
const MIN_DRAG_DISTANCE = 2;

export function hasMarqueeMoved(bounds: Bounds) {
  const [a, b] = bounds.verts;
  const delta = subtract(b, a);
  return Math.hypot(delta.x, delta.y) > MIN_DRAG_DISTANCE;
}

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

function getMarqueeHits(rectVerts: Vec2[], components: Component[]) {
  const rectCorners = expandBoxVerts(rectVerts);

  return components
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
  const { mutationBounds, setSelected, setMutationBounds, setMode } =
    useEditorStore.getState();
  const { components } = useVisualScene.getState();

  // filter out audio components
  const visualComponents = Object.values(components).filter(
    (c) => c.type !== "audio"
  );

  const hits = hasMarqueeMoved(mutationBounds)
    ? getMarqueeHits(mutationBounds.verts, visualComponents)
    : [];

  setSelected(Array.from(new Set([...baseSelection, ...hits])));

  // mutationBounds still holds the marquee drag rectangle -- refresh it to
  // match the actual selection, otherwise the next resize/rotate (which only
  // overwrites part of mutationBounds) starts from the stale marquee rect
  const bounds = getSelectedComponentBounds();
  if (bounds) setMutationBounds(bounds);

  setMode(["normal"]);
}
