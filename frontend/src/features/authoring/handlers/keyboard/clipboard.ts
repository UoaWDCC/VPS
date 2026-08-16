import {
  defaults,
  getNextZIndex,
  parseComponent,
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
import type { Component, ModelDocument } from "../../types";

function plainToDoc(text: string) {
  const plainBlocks = text.split("\n");
  const blocks = plainBlocks.map((b) => ({
    style: {},
    spans: [{ style: {}, text: b }],
  }));
  return { style: {}, blocks };
}

function isInputTarget(e: ClipboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA";
}

export function copy(e: ClipboardEvent) {
  if (isInputTarget(e)) return;
  const { selected } = useEditorStore.getState();
  if (!selected.length) return;

  e.preventDefault();

  addToClipboard(e, selected);
}

export function cut(e: ClipboardEvent) {
  if (isInputTarget(e)) return;
  const { selected, setSelected } = useEditorStore.getState();
  if (!selected.length) return;

  e.preventDefault();

  addToClipboard(e, selected);
  setSelected([]);
  remove(selected);
}

export function paste(e: ClipboardEvent) {
  if (isInputTarget(e)) return;
  e.preventDefault();
  const { mode, selected, selection, setSelected, setSelection } =
    useEditorStore.getState();

  const appData = e.clipboardData?.getData("application/component");
  const textData = e.clipboardData?.getData("text/plain");

  if (selected.length && mode.includes("text")) {
    let cursor = selection.start!;

    if (appData) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(appData);
      } catch {
        return;
      }

      const items = (Array.isArray(parsed) ? parsed : [parsed]) as {
        type?: string;
        document?: ModelDocument;
      }[];

      for (const item of items) {
        const doc =
          item.type === "textbox"
            ? item.document!
            : (item as unknown as ModelDocument);
        cursor = mergeDocs(selected, cursor, doc);
      }

      setSelection({ start: cursor, end: null });
    } else if (textData) {
      const doc = plainToDoc(textData) as ModelDocument;
      cursor = mergeDocs(selected, cursor, doc);
      setSelection({ start: cursor, end: null });
    }
    syncVisualCursor();
  } else {
    if (appData) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(appData);
      } catch {
        return;
      }

      const items = (Array.isArray(parsed) ? parsed : [parsed]) as {
        type?: string;
      }[];
      const newSelection: string[] = [];

      // assign pasted items increasing zIndex above everything else so a
      // multi-item paste can't collide with an existing component's zIndex
      let nextZIndex = getNextZIndex();

      items.forEach((obj) => {
        if (obj.type) {
          newSelection.push(
            parseComponent(obj as unknown as Component, nextZIndex++)
          );
        } else {
          const component = structuredClone(defaults["textbox"]);
          component.document = structuredClone(obj as unknown as ModelDocument);
          component.zIndex = nextZIndex++;
          newSelection.push(add(component));
        }
      });

      setSelected(newSelection);
    } else if (textData) {
      console.log("hi");
      const doc = plainToDoc(textData);
      const component = structuredClone(defaults["textbox"]);
      component.document = structuredClone(doc);
      setSelected([add(component)]);
    }
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
