import create from "zustand";
import type { Action, ActionRef, Component, SceneBackground } from "../types";

type VisualComponent = Component;

type VisualComponents = Record<string, VisualComponent>;

export interface VisualSceneState {
  components: VisualComponents;
  id: string | null;
  name: string | null;
  roles: string[] | null;
  actions: Action[];
  defaultActionRefs: ActionRef[];
  timerActionRefs: ActionRef[];
  time: number | null;
  background: SceneBackground | null;

  setVisualScene: (scene: Partial<VisualSceneState>) => void;
  setComponents: (components: VisualComponents) => void;
  updateComponent: (component: VisualComponent) => void;
  deleteComponent: (id: string) => void;
}

const useVisualScene = create<VisualSceneState>((set) => ({
  components: {},
  id: null,
  name: null,
  roles: null,
  actions: [],
  defaultActionRefs: [],
  timerActionRefs: [],
  time: null,
  background: null,

  setVisualScene: (scene) =>
    set(
      (state) =>
        ({
          ...state,
          actions: [],
          defaultActionRefs: [],
          timerActionRefs: [],
          time: null,
          background: null,
          ...scene,
        }) as VisualSceneState
    ),
  setComponents: (components) => set({ components }),
  updateComponent: (component) =>
    set((state) => ({
      components: { ...state.components, [component.id]: component },
    })),
  deleteComponent: (id) =>
    set((state) => {
      const copy = { ...state.components };
      delete copy[id];
      return { components: copy };
    }),
}));

// NOTE: temporary debug hook for manually seeding state from the browser console
(
  window as unknown as Window & { useVisualScene: typeof useVisualScene }
).useVisualScene = useVisualScene;

export default useVisualScene;
