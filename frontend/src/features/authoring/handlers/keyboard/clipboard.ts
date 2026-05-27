import {
  defaults,
  parseComponent,
  stringifyComponent,
} from "../../scene/operations/component";
import { add, remove } from "../../scene/operations/modifiers";
import {
  getDocumentText,
  getSelectionContent,
  mergeDocs,
} from "../../scene/operations/text";
import { getComponent } from "../../scene/scene";
import useEditorStore from "../../stores/editor";
import { syncVisualCursor } from "../../text/cursor";
import type { ModelDocument } from "../../types";

function plainToDoc(text: string) {
  const plainBlocks = text.split("\n");
  const blocks = plainBlocks.map((b) => ({
    style: {},
    spans: [{ style: {}, text: b }],
  }));
  return { style: {}, blocks };
}

export function copy(e: ClipboardEvent) {
  const { selected } = useEditorStore.getState();
  if (!selected) return;

  e.preventDefault();

  addToClipboard(e, selected);
}

export function cut(e: ClipboardEvent) {
  const { selected, setSelected } = useEditorStore.getState();
  if (!selected) return;

  e.preventDefault();

  addToClipboard(e, selected);
  remove(selected);
  setSelected([]);
}

export function paste(e: ClipboardEvent) {
  e.preventDefault();
  const { mode, selected, selection, setSelected, setSelection } =
    useEditorStore.getState();

  const app = e.clipboardData?.getData("application/component");
  const text = e.clipboardData?.getData("text/plain");

  if (selected && mode.includes("text")) {
    if (app) {
      const obj = JSON.parse(app);
      const doc = obj.type === "textbox" ? obj.document : obj;
      const cursor = mergeDocs(selected, selection.start!, doc);
      setSelection({ start: cursor, end: null });
    } else if (text) {
      const doc = plainToDoc(text) as ModelDocument;
      const cursor = mergeDocs(selected, selection.start!, doc);
      setSelection({ start: cursor, end: null });
    }
    syncVisualCursor();
  } else {
    let newSelection = [];
    if (app) {
      const obj = JSON.parse(app);
      if (obj.type) {
        newSelection.push(parseComponent(obj));
      } else {
        const component = structuredClone(defaults["textbox"]);
        component.document = structuredClone(obj);
        newSelection.push(add(component));
      }
    } else if (text) {
      const doc = plainToDoc(text);
      const component = structuredClone(defaults["textbox"]);
      component.document = structuredClone(doc);
      newSelection.push(add(component));
    }
    setSelected(newSelection);
  }
}

function addToClipboard(e: ClipboardEvent, selected: string[]) {
  const { mode, selection } = useEditorStore.getState();
  selected.forEach((id: string) => {
    if (mode.includes("text")) {
      if (!selection.end) return;

      const { text, doc } = getSelectionContent(id, selection);
      e.clipboardData?.setData("text/plain", text);
      e.clipboardData?.setData("application/component", JSON.stringify(doc));
    } else {
      e.clipboardData?.setData(
        "application/component",
        stringifyComponent(id) || ""
      );
      if (getComponent(id).type === "textbox") {
        const text = getDocumentText(id);
        e.clipboardData?.setData("text/plain", text);
      }
    }
  });
}
