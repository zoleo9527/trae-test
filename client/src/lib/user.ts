import { writable } from 'svelte/store';
import type { User } from './types';

function createUserStore() {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
  const initial: User | null = raw ? JSON.parse(raw) : null;
  const { subscribe, set } = writable<User | null>(initial);

  return {
    subscribe,
    set(u: User | null) {
      if (u) {
        localStorage.setItem('user', JSON.stringify(u));
      } else {
        localStorage.removeItem('user');
      }
      set(u);
    },
    clear() {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      set(null);
    }
  };
}

export const currentUser = createUserStore();

export function getUserSync(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export type Role = 'manager' | 'editor' | 'service';

export function requireRoles(allowed: Role[], redirectTo = '/orders') {
  const user = getUserSync();
  if (!user) return { redirect: '/login' };
  if (!allowed.includes(user.role as Role)) return { redirect: redirectTo };
  return { user };
}
