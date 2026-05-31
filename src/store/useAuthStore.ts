import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { mockUsers, testAccounts } from '../utils/mockData';

interface AuthState {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  login: (username: string, password: string) => {
    let matchedRole: UserRole | null = null;

    if (
      username === testAccounts.manager.username &&
      password === testAccounts.manager.password
    ) {
      matchedRole = 'manager';
    } else if (
      username === testAccounts.chef.username &&
      password === testAccounts.chef.password
    ) {
      matchedRole = 'chef';
    } else if (
      username === testAccounts.customer_service.username &&
      password === testAccounts.customer_service.password
    ) {
      matchedRole = 'customer_service';
    }

    if (matchedRole) {
      const user = mockUsers.find((u) => u.role === matchedRole);
      if (user) {
        set({ user });
        localStorage.setItem('bakery_user', JSON.stringify(user));
        return true;
      }
    }
    return false;
  },

  logout: () => {
    set({ user: null });
    localStorage.removeItem('bakery_user');
  },

  hasPermission: (allowedRoles: UserRole[]) => {
    const user = get().user;
    if (!user) return false;
    return allowedRoles.includes(user.role);
  },
}));

const savedUser = localStorage.getItem('bakery_user');
if (savedUser) {
  try {
    useAuthStore.setState({ user: JSON.parse(savedUser) });
  } catch (e) {
    localStorage.removeItem('bakery_user');
  }
}
