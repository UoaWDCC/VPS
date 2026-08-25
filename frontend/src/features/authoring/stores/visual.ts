import create from "zustand";
import type { Component, SceneBackground } from "../types";

type VisualComponent = Component;

type VisualComponents = Record<string, VisualComponent>;

export interface VisualSceneState {
  components: VisualComponents;
  id: string | null;
  name: string | null;
  roles: string[] | null;
  directLink: string | null;
  directLinkKey: string | null;
  time: number | null;
  timerStateOperations: Record<string, unknown>[] | null;
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
  directLink: null,
  directLinkKey: null,
  time: null,
  timerStateOperations: null,
  background: null,

  setVisualScene: (scene) =>
    set(
      (state) =>
        ({
          ...state,
          directLink: null,
          directLinkKey: null,
          time: null,
          timerStateOperations: null,
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

export default useVisualScene;
