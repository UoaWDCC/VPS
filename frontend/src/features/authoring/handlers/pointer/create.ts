import { createComponentFromBounds } from "../../scene/operations/component";
import useEditorStore from "../../stores/editor";
import type { Vec2 } from "../../types";
import { add, mutate, scale, subtract } from "../../util";

export function handleCreateStart(_: React.MouseEvent, position: Vec2) {
  const { setSelected, setOffset, setMutationBounds } =
    useEditorStore.getState();

  setSelected(null);
  setOffset(position);
  setMutationBounds({ verts: [position, position], rotation: 0 });
}

function getTailVert(verts: Vec2[]) {
  const dir = mutate(
    subtract(verts[1], verts[0]),
    (val) => val / Math.abs(val)
  );
  return add(verts[1], scale(dir, 20));
}

export function handleCreateDrag(_: React.MouseEvent, position: Vec2) {
  const { offset, createType, setMutationBounds, addMode } =
    useEditorStore.getState();

  const verts = [offset, position];
  if (createType === "speech") verts.push(getTailVert(verts));
  setMutationBounds((prev) => ({ ...prev, verts }));
  addMode("mutation");
}

export function handleCreateEnd() {
  const { mutationBounds, setMode, setSelected, createType } =
    useEditorStore.getState();
  const id = createComponentFromBounds(createType!, mutationBounds);
  setSelected(id);
  setMode(["normal"]);
}
