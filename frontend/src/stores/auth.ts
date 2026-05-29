import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api';
import type { User } from '@/env';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const userRole = computed(() => user.value?.role);

  async function login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password });
    token.value = response.data.accessToken;
    user.value = response.data.user;
    localStorage.setItem('token', response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async function switchRole(username: string) {
    const response = await api.post('/auth/login', { username, password: '123456' });
    token.value = response.data.accessToken;
    user.value = response.data.user;
    localStorage.setItem('token', response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  }

  return {
    token,
    user,
    isLoggedIn,
    userRole,
    login,
    logout,
    switchRole,
  };
});
