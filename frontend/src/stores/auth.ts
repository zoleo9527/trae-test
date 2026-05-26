import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserRole } from '../types';
import { authApi } from '../api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role);
  const userName = computed(() => user.value?.name);

  async function login(username: string, password: string) {
    const result = await authApi.login(username, password);
    token.value = result.token;
    user.value = result.user;
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    return result;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function restoreSession() {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token.value) {
      try {
        user.value = JSON.parse(savedUser);
      } catch {
        logout();
      }
    }
  }

  function hasRole(role: UserRole | UserRole[]) {
    if (!user.value) return false;
    if (Array.isArray(role)) {
      return role.includes(user.value.role);
    }
    return user.value.role === role;
  }

  return {
    user,
    token,
    isAuthenticated,
    userRole,
    userName,
    login,
    logout,
    restoreSession,
    hasRole,
  };
});
