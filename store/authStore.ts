import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
}

interface AuthState {
  user: User | null;
  users: User[]; // Registered users registry
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => void;
}

// Initial store administrator account reference without sensitive password in client bundle
const ADMIN_ACCOUNT: User = {
  id: 'usr_admin',
  email: 'admin@beadu.in',
  name: 'Store Administrator',
  role: 'ADMIN',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: [ADMIN_ACCOUNT],

      login: async (email: string, pass: string) => {
        try {
          const state = get();
          const localUser = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
          
          if (localUser && localUser.role !== 'ADMIN') {
            if (localUser.password !== pass) {
              return { success: false, error: 'Incorrect password.' };
            }
            set({ user: localUser });
            return { success: true };
          }

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
        const state = get();
        if (state.users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return { success: false, error: 'An account with this email already exists.' };
        }

        const newUser: User = {
          id: `usr_${Date.now()}`,
          email,
          name,
          role: 'USER', // New signups are ALWAYS 'USER'
          password: pass,
        };

        set((s) => ({
          users: [...s.users, newUser],
          user: newUser,
        }));

        return { success: true };
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {}
        set({ user: null });
      },

      updateProfile: (name: string) => {
        set((state) => {
          if (!state.user) return state;
          
          const updatedUser = { ...state.user, name };
          const updatedUsers = state.users.map(u => 
            u.id === updatedUser.id ? updatedUser : u
          );

          return {
            user: updatedUser,
            users: updatedUsers,
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
