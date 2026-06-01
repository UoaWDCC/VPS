import { defaults, parseComponent } from "../../scene/operations/component";
import { add, remove } from "../../scene/operations/modifiers";
import {
  getDocumentText,
  getSelectionContent,
  mergeDocs,
} from "../../scene/operations/text";
import { getComponent } from "../../scene/scene";
import useEditorStore from "../../stores/editor";
import { syncVisualCursor } from "../../text/cursor";
import type { Component, ModelDocument } from "../../types";

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

  const components = e.clipboardData?.getData("application/component");
  const plainTexts = e.clipboardData?.getData("text/plain");

  if (selected && mode.includes("text")) {
    // This one I got gpt to write lowkey not to sure if its good
    if (!selection.start) return;
    let cursor = selection.start;

    if (components) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(components);
      } catch {
        return;
      }
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        const doc = item.type === "textbox" ? item.document : item;
        cursor = mergeDocs(selected, cursor, doc);
      }
      setSelection({ start: cursor, end: null });
    } else if (plainTexts) {
      const doc = plainToDoc(plainTexts) as ModelDocument;
      cursor = mergeDocs(selected, cursor, doc);
      setSelection({ start: cursor, end: null });
    }
    syncVisualCursor();
  } else {
    if (!components) return;
    setSelected([]);

    let newSelection: string[] = [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(components);
    } catch {
      return;
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];

    items.forEach((obj) => {
      if (obj.type) {
        newSelection.push(parseComponent(obj));
      } else {
        //! IMPORTANT I dont think this will ever run because ever copied component has a type
        const component = structuredClone(defaults["textbox"]);
        component.document = structuredClone(obj);
        newSelection.push(add(component));
      }
    });
    setSelected(newSelection);
  }
}

function addToClipboard(e: ClipboardEvent, selected: string[]) {
  const { mode, selection } = useEditorStore.getState();

  const plainTextChunks: string[] = [];
  const components: Component[] = [];
  selected.forEach((id: string) => {
    if (mode.includes("text")) {
      if (!selection.end) return;

      const { text, doc } = getSelectionContent(id, selection);
      if (text) plainTextChunks.push(text);
      if (doc) components.push(doc);
    } else {
      components.push(getComponent(id));
      if (getComponent(id).type === "textbox") {
        const text = getDocumentText(id);
        if (text) plainTextChunks.push(text);
      }
    }
  });

  if (plainTextChunks.length > 0) {
    e.clipboardData?.setData("text/plain", plainTextChunks.join("\n"));
  }
  if (components.length > 0) {
    e.clipboardData?.setData(
      "application/component",
      JSON.stringify(components)
    );
  }
}
