import { defineStore } from 'pinia'
import type { User, UserRole } from '~/types'
import { mockUsers } from '~/data/mock'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
  }),

  getters: {
    userRole: (state): UserRole | null => state.user?.role || null,
    userName: (state): string => state.user?.name || '',
    canViewDashboard: (state): boolean => state.user?.role === 'manager',
    canEditOrders: (state): boolean => ['manager', 'sales'].includes(state.user?.role || ''),
    canHandleAbnormal: (state): boolean => ['manager', 'service'].includes(state.user?.role || ''),
  },

  actions: {
    login(username: string, password: string): boolean {
      const user = mockUsers.find(u => u.username === username)
      if (user && password === '123456') {
        this.user = user
        this.isAuthenticated = true
        return true
      }
      return false
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
    },

    setUser(user: User) {
      this.user = user
      this.isAuthenticated = true
    },
  },
})
