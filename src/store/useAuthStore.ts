// store/useAuthStore.ts — session lock state (not persisted; re-locks on refresh)
import { create } from 'zustand';

interface AuthState {
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  unlocked: false,
  unlock: () => set({ unlocked: true }),
  lock: () => set({ unlocked: false }),
}));
