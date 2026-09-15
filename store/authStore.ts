import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getSupabase } from '@/lib/supabase';

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      login: async (email: string, pass: string) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
          });
          const data = await res.json();
          if (data.success && data.user) {
            set({ user: data.user });
            return { success: true };
          }
          return { success: false, error: data.error || 'Invalid credentials.' };
        } catch {
          return { success: false, error: 'Network connection failed during login.' };
        }
      },

      signup: async (email: string, pass: string, name: string) => {
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass, name }),
          });
          const data = await res.json();
          if (data.success && data.user) {
            set({ user: data.user });
            return { success: true };
          }
          return { success: false, error: data.error || 'Registration failed.' };
        } catch {
          return { success: false, error: 'Network connection failed during signup.' };
        }
      },

      logout: async () => {
        try {
          await getSupabase().auth.signOut();
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {}
        set({ user: null });
      },

      updateProfile: (name: string) => {
        set((state) => {
          if (!state.user) return state;
          
          const updatedUser = { ...state.user, name };

          return {
            user: updatedUser,
          };
        });
      },
    }),
    {
      name: 'beadu-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
