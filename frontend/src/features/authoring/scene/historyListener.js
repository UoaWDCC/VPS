import { unstable_batchedUpdates } from "react-dom";
import useEditorStore from "../stores/editor";
import { replaceComponent } from "./operations/modifiers";
import { diffToSelection, findEditDiff } from "./operations/text";
import { syncVisualCursor } from "../text/cursor";
import { syncPropertyChips } from "../text/property";
import { getScene } from "./scene";

export function createHistoryListener({
  sceneId,
  switchScene,
  properties,
  setSaving,
  debounced,
}) {
  const { setSelected } = useEditorStore.getState();
  // History events also originate from native keyboard listeners. React 17
  // must finish restoring the scene and selection before rendering either.
  return ({ operation, record }) =>
    unstable_batchedUpdates(() => {
      if (operation === "undo" || operation === "redo") {
        const editorState = useEditorStore.getState();

        // Discard text positions from the old document before restoring a
        // possibly shorter one. Restore the relevant edit selection below.
        editorState.setSelection({ start: null, end: null });
        editorState.setVisualSelection({ start: null, end: null });
        setSelected([]);

        const batch = record;
        const targetSceneId = batch[0]?.sceneId;
        if (targetSceneId && targetSceneId !== sceneId) {
          switchScene(getScene(), targetSceneId);
        }

        const restoredIds = [];
        batch.forEach((item) => {
          const state = operation === "undo" ? item.before : item.after;
          if (state?.type === "textbox" && state.document && properties)
            syncPropertyChips(state.document, properties);
          replaceComponent(item.id, state);
          if (state !== null) restoredIds.push(item.id);
        });
        setSelected(restoredIds);

        // jump straight to the exact text that was undone/redone, the way
        // undo/redo works in any text editor, by diffing the before/after
        // documents rather than relying on wherever the cursor used to be
        // -- only meaningful when the batch touches a single component
        if (batch.length === 1) {
          const [item] = batch;
          const state = operation === "undo" ? item.before : item.after;
          const beforeBlocks = item.before?.document?.blocks;
          const afterBlocks = item.after?.document?.blocks;
          const targetBlocks = state?.document?.blocks;
          const diff =
            beforeBlocks?.length && afterBlocks?.length
              ? findEditDiff(beforeBlocks, afterBlocks)
              : null;
          if (diff && targetBlocks?.length) {
            const selection = diffToSelection(targetBlocks, diff);
            editorState.setMode(["text"]);
            editorState.setSelection(selection);
            syncVisualCursor();
          }
        }
      }

      setSaving(true);
      debounced();
    });
}
