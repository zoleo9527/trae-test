import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { User, UserRole } from '@/types';
import { users } from '@/mock/data';

export interface LoginCred {
  username: string;
  password: string;
}

const CRED_MAP: Record<string, { password: string; userId: string }> = {
  director:   { password: '123456', userId: 'u_director' },
  dispatcher: { password: '123456', userId: 'u_dispatcher' },
  operator:   { password: '123456', userId: 'u_op_01' },
};

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null);

  const role = computed<UserRole | null>(() => currentUser.value?.role ?? null);

  function login(cred: LoginCred): boolean {
    const hit = CRED_MAP[cred.username];
    if (hit && hit.password === cred.password) {
      currentUser.value = users.find(u => u.id === hit.userId) ?? null;
      return true;
    }
    return false;
  }

  function switchTo(role: UserRole) {
    const user = users.find(u => u.role === role);
    if (user) currentUser.value = user;
  }

  function logout() {
    currentUser.value = null;
  }

  function hasRole(required: UserRole[]) {
    return currentUser.value ? required.includes(currentUser.value.role) : false;
  }

  return { currentUser, role, login, switchTo, logout, hasRole };
});
