import create from "zustand";
import type { ModelSelection, VisualSelection } from "../text/types";
import type { BaseTextStyle, Bounds, Guide, Vec2 } from "../types";
import { getComponent } from "../scene/scene";
import { getStyleForSelection } from "../scene/operations/text";

type Mode = "normal" | "resize" | "create" | "text" | "mutation";

// An image that is being uploaded, drawn on the canvas until the real
// component takes its place.
export interface PendingImage {
  id: string;
  sceneId: string;
  bounds: Bounds;
  // local object URL of the file being uploaded, used as a preview
  previewUrl: string;
  // upload progress, 0 to 1
  progress: number;
  // upload finished — the placeholder resolves before the real image takes over
  settled: boolean;
}

interface EditorState {
  loading: boolean;
  pendingImages: PendingImage[];
  selected: string[];
  hovered: string | null;
  createType: string | null;
  mouseDown: boolean;
  mutationBounds: Bounds;
  offset: Vec2;
  activeGuides: Guide[];

  setSelected: (id: string[]) => void;
  setHovered: (id: string | null) => void;
  setCreateType: (type: string) => void;
  setMouseDown: (mouseDown: boolean) => void;
  setMutationBounds: Dynamic<Bounds>;
  setOffset: (offset: Vec2) => void;
  setActiveGuides: (guides: Guide[]) => void;

  // text editing
  selection: ModelSelection;
  visualSelection: VisualSelection;
  desiredColumn: number | null;
  activeStyle: BaseTextStyle | null;

  setLoading: (loading: boolean) => void;
  addPendingImage: (image: PendingImage) => void;
  updatePendingImage: (id: string, patch: Partial<PendingImage>) => void;
  removePendingImage: (id: string) => void;
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

type ZustandSet = (
  updater: (state: EditorState) => Partial<EditorState>
) => void;

function setter<K extends keyof EditorState>(set: ZustandSet, prop: K) {
  return (arg: EditorState[K] | ((prev: EditorState[K]) => EditorState[K])) =>
    set((state: EditorState) => ({
      [prop]:
        typeof arg === "function"
          ? (arg as (prev: EditorState[K]) => EditorState[K])(state[prop])
          : arg,
    }));
}

const useEditorStore = create<EditorState>((set) => ({
  loading: false,
  pendingImages: [],
  selected: [],
  hovered: null,
  createType: null,
  mouseDown: false,
  mutationBounds: { verts: [], rotation: 0 },
  offset: { x: 0, y: 0 },
  activeGuides: [],

  setLoading: (value: boolean) => set({ loading: value }),
  addPendingImage: (image) =>
    set((state) => ({ pendingImages: [...state.pendingImages, image] })),
  updatePendingImage: (id, patch) =>
    set((state) => ({
      pendingImages: state.pendingImages.map((image) =>
        image.id === id ? { ...image, ...patch } : image
      ),
    })),
  removePendingImage: (id) =>
    set((state) => ({
      pendingImages: state.pendingImages.filter((image) => image.id !== id),
    })),
  setSelected: (id) => set({ selected: id }),
  setHovered: (id) => set({ hovered: id }),
  setCreateType: (type: string) => set({ createType: type }),
  setMouseDown: (mouseDown) => set({ mouseDown }),
  setMutationBounds: setter(set, "mutationBounds"),
  setOffset: (offset) => set({ offset }),
  setActiveGuides: (guides) => set({ activeGuides: guides }),

  selection: { start: null, end: null },
  visualSelection: { start: null, end: null },
  activeStyle: null,
  desiredColumn: null,

  setSelection: (selection) =>
    set(({ selected }) => {
      const mainTarget = selected[0];
      const component = mainTarget ? getComponent(mainTarget) : null;
      if (component?.type === "textbox") {
        const activeStyle = getStyleForSelection(mainTarget, selection);
        return { selection, activeStyle };
      }
      return { selection, activeStyle: null };
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
      selected: [],
      selection: { start: null, end: null },
      visualSelection: { start: null, end: null },
      mode: ["normal"],
      activeGuides: [],
    }),
}));

export default useEditorStore;
