import { browser } from '$app/environment';
import { writable } from 'svelte/store';

function createUserStore() {
  let initial = null;
  if (browser) {
    const saved = localStorage.getItem('user');
    initial = saved ? JSON.parse(saved) : null;
  }
  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    login: (userData) => {
      if (browser) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      set(userData);
    },
    logout: () => {
      if (browser) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      set(null);
    },
    set,
    update,
  };
}

export const user = createUserStore();
