import create from "zustand";
import type { ModelSelection, VisualSelection } from "../text/types";
import type { BaseTextStyle, Bounds, Vec2 } from "../types";
import { getComponent } from "../scene/scene";
import { getStyleForSelection } from "../scene/operations/text";

type Mode = "normal" | "resize" | "create" | "text" | "mutation";

interface EditorState {
  selected: string | null;
  createType: string | null;
  mouseDown: boolean;
  mutationBounds: Bounds;
  offset: Vec2;

  setSelected: (id: string | null) => void;
  setCreateType: (type: string) => void;
  setMouseDown: (mouseDown: boolean) => void;
  setMutationBounds: Dynamic<Bounds>;
  setOffset: (offset: Vec2) => void;

  // text editing
  selection: ModelSelection;
  visualSelection: VisualSelection;
  desiredColumn: number | null;
  activeStyle: BaseTextStyle | null;

  setSelection: (selection: ModelSelection) => void;
  setVisualSelection: Dynamic<VisualSelection>;
  setDesiredColumn: (column: number | null) => void;
  setActiveStyle: (style: BaseTextStyle) => void;

  // modes
  mode: Mode[];
  setMode: (mode: Mode[]) => void;
  addMode: (mode: Mode) => void;
  removeMode: (mode: Mode) => void;

  clear: () => void;
}

type Dynamic<T> = (arg: T | ((prev: T) => T)) => void;

function setter<K extends keyof EditorState>(set: Function, prop: K) {
  return (arg: EditorState[K] | ((prev: EditorState[K]) => EditorState[K])) =>
    set((state: EditorState) => ({
      [prop]:
        typeof arg === "function"
          ? (arg as (prev: EditorState[K]) => EditorState[K])(state[prop])
          : arg,
    }));
}

const useEditorStore = create<EditorState>((set) => ({
  selected: null,
  createType: null,
  mouseDown: false,
  mutationBounds: { verts: [], rotation: 0 },
  offset: { x: 0, y: 0 },

  setSelected: (id) => set({ selected: id }),
  setCreateType: (type: string) => set({ createType: type }),
  setMouseDown: (mouseDown) => set({ mouseDown }),
  setMutationBounds: setter(set, "mutationBounds"),
  setOffset: (offset) => set({ offset }),

  selection: { start: null, end: null },
  visualSelection: { start: null, end: null },
  activeStyle: null,
  desiredColumn: null,

  setSelection: (selection) =>
    set(({ selected }) => {
      if (selected && getComponent(selected).type === "textbox") {
        const activeStyle = getStyleForSelection(selected, selection);
        return { selection, activeStyle };
      }
      return { selection };
    }),
  setVisualSelection: setter(set, "visualSelection"),
  setActiveStyle: (style: BaseTextStyle) => set({ activeStyle: style }),
  setDesiredColumn: (column) => set({ desiredColumn: column }),

  mode: ["normal"],
  setMode: (mode) => set({ mode }),
  addMode: (arg) => set((state) => ({ mode: [...state.mode, arg] })),
  removeMode: (arg) =>
    set((state) => ({ mode: state.mode.filter((x: Mode) => x !== arg) })),

  clear: () =>
    set({
      selected: null,
      selection: { start: null, end: null },
      visualSelection: { start: null, end: null },
      mode: ["normal"],
    }),
}));

export default useEditorStore;
