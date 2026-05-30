import { create } from 'zustand';
import type { Role } from '@/types';

interface RoleState {
  currentRole: Role;
  setRole: (role: Role) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  currentRole: 'factory_manager',
  setRole: (role) => set({ currentRole: role }),
}));
