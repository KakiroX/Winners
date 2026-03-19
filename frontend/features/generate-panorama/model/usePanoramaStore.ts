import { create } from 'zustand';
import type { Walkthrough } from '@/entities/panorama/model/types';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface PanoramaStore {
  status: Status;
  walkthrough: Walkthrough | null;
  currentRoomId: string | null;
  errorMessage: string;

  setLoading: () => void;
  setSuccess: (walkthrough: Walkthrough) => void;
  setError: (message: string) => void;
  setCurrentRoom: (roomId: string) => void;
  updateWalkthrough: (walkthrough: Walkthrough) => void;
  reset: () => void;
}

export const usePanoramaStore = create<PanoramaStore>((set) => ({
  status: 'idle',
  walkthrough: null,
  currentRoomId: null,
  errorMessage: '',

  setLoading: () => set({ status: 'loading', errorMessage: '' }),
  setSuccess: (walkthrough) =>
    set({
      status: 'success',
      walkthrough,
      currentRoomId: walkthrough.rooms[0]?.room_id ?? null,
    }),
  setError: (message) => set({ status: 'error', errorMessage: message }),
  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),
  updateWalkthrough: (walkthrough) => set({ walkthrough }),
  reset: () =>
    set({
      status: 'idle',
      walkthrough: null,
      currentRoomId: null,
      errorMessage: '',
    }),
}));
