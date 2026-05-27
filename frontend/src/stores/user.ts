import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UserRole } from '@/types';
import type { User } from '@/types';

export const useUserStore = defineStore('user', () => {
  const mockUsers: User[] = [
    {
      id: 'manager-001',
      name: '张主管',
      role: UserRole.OPERATION_MANAGER,
      phone: '13800000001',
    },
    {
      id: 'inspector-001',
      name: '李巡检',
      role: UserRole.INSPECTOR,
      phone: '13800000002',
    },
    {
      id: 'cs-user-001',
      name: '王客服',
      role: UserRole.CUSTOMER_SERVICE,
      phone: '13800000003',
    },
  ];

  const currentRole = ref<UserRole>(UserRole.OPERATION_MANAGER);

  const currentUser = computed(() => {
    return mockUsers.find((u) => u.role === currentRole.value) || mockUsers[0];
  });

  const setRole = (role: UserRole) => {
    currentRole.value = role;
  };

  return {
    currentRole,
    currentUser,
    mockUsers,
    setRole,
  };
});
