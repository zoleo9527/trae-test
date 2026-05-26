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
