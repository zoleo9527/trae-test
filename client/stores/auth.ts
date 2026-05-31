import { defineStore } from 'pinia'
import type { User, UserRole } from '~/types'
import { mockUsers } from '~/data/mockData'

interface AuthState {
  currentUser: User | null
  availableRoles: UserRole[]
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    currentUser: mockUsers[0],
    availableRoles: ['project_manager', 'scheduling_specialist', 'quality_inspector']
  }),

  getters: {
    currentRole: (state): UserRole => state.currentUser?.role || 'project_manager',
    isProjectManager: (state): boolean => state.currentUser?.role === 'project_manager',
    isSchedulingSpecialist: (state): boolean => state.currentUser?.role === 'scheduling_specialist',
    isQualityInspector: (state): boolean => state.currentUser?.role === 'quality_inspector',
    hasPermission: (state) => (requiredRoles: UserRole[]): boolean => {
      if (!state.currentUser) return false
      return requiredRoles.includes(state.currentUser.role)
    }
  },

  actions: {
    switchRole(role: UserRole) {
      const user = mockUsers.find(u => u.role === role)
      if (user) {
        this.currentUser = user
      }
    },
    setUser(user: User) {
      this.currentUser = user
    }
  }
})
