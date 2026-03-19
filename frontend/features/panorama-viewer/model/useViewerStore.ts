import { create } from 'zustand';

interface ViewerStore {
  currentSceneId: string;
  pitch: number;
  yaw: number;
  hfov: number;

  setCurrentScene: (sceneId: string) => void;
  setView: (pitch: number, yaw: number) => void;
  setHfov: (hfov: number) => void;
}

export const useViewerStore = create<ViewerStore>((set) => ({
  currentSceneId: '',
  pitch: 0,
  yaw: 0,
  hfov: 110,

  setCurrentScene: (sceneId) => set({ currentSceneId: sceneId }),
  setView: (pitch, yaw) => set({ pitch, yaw }),
  setHfov: (hfov) => set({ hfov }),
}));
