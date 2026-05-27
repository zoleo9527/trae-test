import { writable } from 'svelte/store';

function createUserStore() {
  const saved = localStorage.getItem('user');
  const initial = saved ? JSON.parse(saved) : null;
  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    login: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      set(user);
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set(null);
    },
    set,
    update,
  };
}

export const user = createUserStore();
