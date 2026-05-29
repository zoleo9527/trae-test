import { defineStore } from 'pinia'
import { login, getCurrentUser } from '../api/endpoints'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('access_token') || null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role || '',
    isBoss: (state) => state.user?.role === 'BOSS',
    isSales: (state) => state.user?.role === 'SALES',
    isWarehouse: (state) => state.user?.role === 'WAREHOUSE',
    userName: (state) => {
      if (!state.user) return ''
      return `${state.user.first_name}${state.user.last_name}`
    }
  },

  actions: {
    async login(username, password) {
      const response = await login(username, password)
      this.token = response.access
      this.user = response.user
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
      localStorage.setItem('user', JSON.stringify(response.user))
      return response
    },

    async fetchUser() {
      try {
        const response = await getCurrentUser()
        this.user = response
        localStorage.setItem('user', JSON.stringify(response))
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  }
})
