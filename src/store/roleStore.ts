import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '../types'

interface RoleState {
  currentRole: Role
  setRole: (role: Role) => void
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      currentRole: 'merchandiser',
      setRole: (role) => set({ currentRole: role }),
    }),
    {
      name: 'role-storage',
    }
  )
)
