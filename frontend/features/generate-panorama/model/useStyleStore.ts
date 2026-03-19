import { create } from 'zustand';

interface StyleStore {
  stylePrompt: string;
  setStylePrompt: (prompt: string) => void;
  reset: () => void;
}

export const useStyleStore = create<StyleStore>((set) => ({
  stylePrompt: '',
  setStylePrompt: (prompt) => set({ stylePrompt: prompt }),
  reset: () => set({ stylePrompt: '' }),
}));
