import { create } from 'zustand';

interface ViewerStore {
  currentSceneId: string;
  pitch: number;
  yaw: number;
  hfov: number;
  sceneToLoad: string | null;

  setCurrentScene: (sceneId: string) => void;
  setView: (pitch: number, yaw: number) => void;
  setHfov: (hfov: number) => void;
  loadScene: (sceneId: string) => void;
  clearSceneToLoad: () => void;
}

export const useViewerStore = create<ViewerStore>((set) => ({
  currentSceneId: '',
  pitch: 0,
  yaw: 0,
  hfov: 110,
  sceneToLoad: null,

  setCurrentScene: (sceneId) => set({ currentSceneId: sceneId }),
  setView: (pitch, yaw) => set({ pitch, yaw }),
  setHfov: (hfov) => set({ hfov }),
  loadScene: (sceneId) => set({ sceneToLoad: sceneId }),
  clearSceneToLoad: () => set({ sceneToLoad: null }),
}));
