import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserRole } from '@/types';
import { USERS } from '@/constants';

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User>(USERS[0]);

  const role = computed(() => currentUser.value.role);
  const isFactoryManager = computed(() => currentUser.value.role === 'factory_manager');
  const isQualityInspector = computed(() => currentUser.value.role === 'quality_inspector');
  const isStoreManager = computed(() => currentUser.value.role === 'store_manager');

  function switchUser(userId: string) {
    const user = USERS.find(u => u.id === userId);
    if (user) {
      currentUser.value = user;
    }
  }

  function switchRole(role: UserRole) {
    const user = USERS.find(u => u.role === role);
    if (user) {
      currentUser.value = user;
    }
  }

  return {
    currentUser,
    role,
    isFactoryManager,
    isQualityInspector,
    isStoreManager,
    switchUser,
    switchRole
  };
}, {
  persist: true
});
