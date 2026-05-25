import { create } from 'zustand';
import { authAPI } from '../lib/api';

export type UserRole = 'THEATER_MANAGER' | 'TICKET_SUPERVISOR' | 'BACKEND_COORDINATOR';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const roleNames: Record<UserRole, string> = {
  THEATER_MANAGER: '剧院经理',
  TICKET_SUPERVISOR: '票务主管',
  BACKEND_COORDINATOR: '后台统筹',
};

export const getRoleName = (role: UserRole): string => roleNames[role] || role;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(username, password);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || '登录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        set({ user: JSON.parse(savedUser), token: savedToken });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },
}));
