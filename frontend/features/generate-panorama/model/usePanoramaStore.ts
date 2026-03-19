import { create } from 'zustand';
import type { Walkthrough } from '@/entities/panorama/model/types';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface ProgressInfo {
  current: number;
  total: number;
  roomLabel: string;
  phase: 'generating' | 'linking' | 'done';
}

interface PanoramaStore {
  status: Status;
  walkthrough: Walkthrough | null;
  currentRoomId: string | null;
  errorMessage: string;
  progress: ProgressInfo;

  setLoading: (totalRooms: number) => void;
  setProgress: (progress: ProgressInfo) => void;
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
  progress: { current: 0, total: 0, roomLabel: '', phase: 'generating' },

  setLoading: (totalRooms) =>
    set({
      status: 'loading',
      errorMessage: '',
      progress: { current: 0, total: totalRooms, roomLabel: '', phase: 'generating' },
    }),
  setProgress: (progress) => set({ progress }),
  setSuccess: (walkthrough) =>
    set({
      status: 'success',
      walkthrough,
      currentRoomId: walkthrough.rooms[0]?.room_id ?? null,
      progress: { current: walkthrough.rooms.length, total: walkthrough.rooms.length, roomLabel: '', phase: 'done' },
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
      progress: { current: 0, total: 0, roomLabel: '', phase: 'generating' },
    }),
}));
