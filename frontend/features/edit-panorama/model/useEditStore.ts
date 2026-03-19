import { create } from 'zustand';

interface EditPoint {
  pitch: number;
  yaw: number;
  clientX: number;
  clientY: number;
}

interface EditStore {
  selectedPoint: EditPoint | null;
  editPrompt: string;
  isEditing: boolean;

  setSelectedPoint: (point: EditPoint) => void;
  setEditPrompt: (prompt: string) => void;
  setIsEditing: (editing: boolean) => void;
  clearSelection: () => void;
}

export const useEditStore = create<EditStore>((set) => ({
  selectedPoint: null,
  editPrompt: '',
  isEditing: false,

  setSelectedPoint: (point) => set({ selectedPoint: point, editPrompt: '' }),
  setEditPrompt: (prompt) => set({ editPrompt: prompt }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  clearSelection: () => set({ selectedPoint: null, editPrompt: '', isEditing: false }),
}));
