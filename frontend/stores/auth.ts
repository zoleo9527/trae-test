import { defineStore } from 'pinia'

export interface User {
  id: number
  username: string
  name: string
  role: 'stall_manager' | 'picker' | 'finance'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as User | null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    role: (s) => s.user?.role || '',
    roleName: (s) => {
      const map: Record<string, string> = {
        stall_manager: '档口负责人',
        picker: '配货员',
        finance: '财务记账',
      }
      return map[s.user?.role || ''] || s.user?.role || ''
    },
  },
  actions: {
    async login(username: string, password: string) {
      const { $api } = useNuxtApp()
      const resp = await $api<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: { username, password },
      })
      this.token = resp.access_token
      this.user = resp.user
      if (import.meta.client) {
        localStorage.setItem('fruit_token', this.token)
        localStorage.setItem('fruit_user', JSON.stringify(this.user))
      }
    },
    initFromStorage() {
      if (!import.meta.client) return
      const t = localStorage.getItem('fruit_token')
      const u = localStorage.getItem('fruit_user')
      if (t && u) {
        this.token = t
        try { this.user = JSON.parse(u) } catch { /* noop */ }
      }
    },
    logout() {
      this.token = ''
      this.user = null
      if (import.meta.client) {
        localStorage.removeItem('fruit_token')
        localStorage.removeItem('fruit_user')
      }
    },
  },
})
