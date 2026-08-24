import { render } from "../../../../components/ContextMenu/portal";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import { getListGroupRange } from "../../text/list";
import type { VisualDocument } from "../../text/types";
import ComponentMenu from "./ComponentContext";
import MarkerMenu from "./MarkerContext";

export function handleContextGlobal(e: React.MouseEvent) {
  const target = e.target as HTMLElement;

  if (target.dataset.type === "marker") {
    handleMarkerContext(e);
  } else if (target.dataset.id) {
    handleComponentContext(e);
  }
}

function handleComponentContext(e: React.MouseEvent) {
  const target = e.target as HTMLElement;
  const id = target.dataset.id as string;
  const { selected, setSelected } = useEditorStore.getState();
  const ids = selected.includes(id) ? selected : [id];

  if (ids !== selected) setSelected(ids);

  e.preventDefault();
  render({
    menu: ComponentMenu({ ids }),
    position: { x: e.clientX, y: e.clientY },
  });
}

// right-clicking a marker that's already part of the current marker
// selection keeps that selection (so right-click works the same as the
// dropdown on an existing mass selection); otherwise it establishes one
// first, same as a single left click would
function handleMarkerContext(e: React.MouseEvent) {
  const target = e.target as HTMLElement;
  const id = target.dataset.id as string;
  const blockI = Number(target.dataset.blockIndex);

  const {
    markerSelection,
    setMarkerSelection,
    setSelected,
    setMode,
    setSelection,
    setVisualSelection,
  } = useEditorStore.getState();

  const alreadySelected =
    markerSelection?.id === id &&
    blockI >= markerSelection.start &&
    blockI <= markerSelection.end;

  let range = alreadySelected
    ? { start: markerSelection.start, end: markerSelection.end }
    : null;

  if (!range) {
    const component = useVisualScene.getState().components[id];
    const { document: doc } = component as unknown as {
      document: VisualDocument;
    };
    range = getListGroupRange(doc, blockI);

    setSelected([id]);
    setMode(["normal"]);
    setSelection({ start: null, end: null });
    setVisualSelection({ start: null, end: null });
    setMarkerSelection({ id, ...range });
  }

  e.preventDefault();
  render({
    menu: MarkerMenu({ id, start: range.start, end: range.end }),
    position: { x: e.clientX, y: e.clientY },
  });
}
