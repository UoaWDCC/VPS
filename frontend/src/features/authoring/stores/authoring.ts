import create from "zustand";

interface AuthoringState {
  scenes: Record<string, any>[];
  sceneSaveRef: ((scene: Record<string, any>) => unknown) | null;
  scenarioId: string | null;
  setScenes: (scenes: Record<string, any>[]) => void;
  setSceneSaveRef: (
    ref: ((scene: Record<string, any>) => unknown) | null
  ) => void;
  setScenarioId: (id: string | null) => void;
}

const useAuthoringStore = create<AuthoringState>((set) => ({
  scenes: [],
  sceneSaveRef: null,
  scenarioId: null,
  setScenes: (scenes) => set({ scenes }),
  setSceneSaveRef: (ref) => set({ sceneSaveRef: ref }),
  setScenarioId: (id) => set({ scenarioId: id }),
}));

export default useAuthoringStore;
