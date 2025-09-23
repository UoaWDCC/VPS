import create from "zustand";
import type { Component } from "../types";

type VisualComponent = Component;

type VisualComponents = Record<string, VisualComponent>;

interface VisualSceneState {
    components: Record<string, any>;

    setComponents: (components: VisualComponents) => void;
    updateComponent: (component: VisualComponent) => void;
    deleteComponent: (id: string) => void;
}

const useVisualScene = create<VisualSceneState>((set) => ({
    components: {},

    setComponents: components => set({ components }),
    updateComponent: (component) => set(state => ({ components: { ...state.components, [component.id]: component } })),
    deleteComponent: (id) => set(state => {
        const copy = { ...state.components };
        delete copy[id];
        return { components: copy };
    })
}))

export default useVisualScene;
