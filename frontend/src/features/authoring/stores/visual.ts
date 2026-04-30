import create from "zustand";
import type { Component } from "../types";

type VisualComponent = Component;

type VisualComponents = Record<string, VisualComponent>;

export interface VisualSceneState {
  components: Record<string, any>;
  id: string | null;
  name: string | null;
  roles: string[] | null;
  directLink: boolean;
  directLinkScene: string | null;

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
  directLink: false,
  directLinkScene: null,

  setVisualScene: (scene) =>
  set((state) => ({
    components: scene.components ?? state.components,
    id: scene.id ?? state.id,
    name: scene.name ?? state.name,
    roles: scene.roles ?? state.roles,
    directLink: scene.directLink ?? state.directLink,
    directLinkScene: scene.directLinkScene ?? state.directLinkScene,
  })),
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
