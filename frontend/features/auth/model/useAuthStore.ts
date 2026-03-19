import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  user: AuthUser | null;
  isAuthReady: boolean;
  isLoginModalOpen: boolean;
  isSignupModalOpen: boolean;

  setUser: (user: AuthUser | null) => void;
  openLogin: () => void;
  closeLogin: () => void;
  openSignup: () => void;
  closeSignup: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthReady: false,
  isLoginModalOpen: false,
  isSignupModalOpen: false,

  setUser: (user) => set({ user, isAuthReady: true }),
  openLogin: () => set({ isLoginModalOpen: true, isSignupModalOpen: false }),
  closeLogin: () => set({ isLoginModalOpen: false }),
  openSignup: () => set({ isSignupModalOpen: true, isLoginModalOpen: false }),
  closeSignup: () => set({ isSignupModalOpen: false }),
  logout: () => set({ user: null }),
}));
