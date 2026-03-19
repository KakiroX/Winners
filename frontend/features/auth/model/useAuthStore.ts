import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  user: AuthUser | null;
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
  isLoginModalOpen: false,
  isSignupModalOpen: false,

  setUser: (user) => set({ user }),
  openLogin: () => set({ isLoginModalOpen: true, isSignupModalOpen: false }),
  closeLogin: () => set({ isLoginModalOpen: false }),
  openSignup: () => set({ isSignupModalOpen: true, isLoginModalOpen: false }),
  closeSignup: () => set({ isSignupModalOpen: false }),
  logout: () => set({ user: null }),
}));
