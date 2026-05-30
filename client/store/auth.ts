import { api } from '@/services/api';
import { AuthState, User } from '@/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const response = await api.post<{ token: string; user: User }>('/auth/login', {
          username,
          password,
        });

        if (response.success && response.data) {
          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
          });
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          throw new Error(response.message);
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (e) {
          console.error('Logout error:', e);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },

      loadUser: async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
            });

            const response = await api.get<User>('/auth/me');
            if (response.success && response.data) {
              set({ user: response.data.user });
              localStorage.setItem('user', JSON.stringify(response.data.user));
            }
          } catch (e) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
