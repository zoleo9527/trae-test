import { defineStore } from 'pinia';
import type { UserRole } from '~/types/workorder';

const STORAGE_KEY = 'watch-service-role';

export const useUserStore = defineStore('user', {
  state: () => ({
    currentRole: 'manager' as UserRole,
    userName: '张经理',
  }),
  
  actions: {
    initFromStorage() {
      if (process.client) {
        const savedRole = localStorage.getItem(STORAGE_KEY) as UserRole;
        if (savedRole) {
          this.setRole(savedRole);
        }
      }
    },
    
    setRole(role: UserRole) {
      this.currentRole = role;
      const roleNames: Record<UserRole, string> = {
        manager: '张经理',
        consultant: '李顾问',
        technician: '王技师',
      };
      this.userName = roleNames[role];
      
      if (process.client) {
        localStorage.setItem(STORAGE_KEY, role);
      }
    },
  },
});
