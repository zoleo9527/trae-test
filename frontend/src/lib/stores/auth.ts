import { writable } from 'svelte/store';
import { api, type User, type UserRole } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    async login(username: string, password: string): Promise<boolean> {
      update((state) => ({ ...state, loading: true, error: null }));
      try {
        const response = await api.login({ username, password });
        api.setToken(response.token);
        update((state) => ({
          ...state,
          user: response.user,
          isAuthenticated: true,
          loading: false,
        }));
        return true;
      } catch (error) {
        update((state) => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : '登录失败',
        }));
        return false;
      }
    },

    async fetchCurrentUser(): Promise<boolean> {
      if (!api.getToken()) {
        return false;
      }
      update((state) => ({ ...state, loading: true }));
      try {
        const user = await api.getMe();
        update((state) => ({
          ...state,
          user,
          isAuthenticated: true,
          loading: false,
        }));
        return true;
      } catch {
        api.setToken(null);
        update((state) => ({
          ...state,
          user: null,
          isAuthenticated: false,
          loading: false,
        }));
        return false;
      }
    },

    logout() {
      api.setToken(null);
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    },

    hasRole(role: UserRole | UserRole[]): boolean {
      let currentState: AuthState | undefined;
      const unsubscribe = subscribe((state) => {
        currentState = state;
      });
      unsubscribe();
      if (!currentState?.user) return false;
      if (Array.isArray(role)) {
        return role.includes(currentState.user.role);
      }
      return currentState.user.role === role;
    },

    clearError() {
      update((state) => ({ ...state, error: null }));
    },
  };
}

export const auth = createAuthStore();
