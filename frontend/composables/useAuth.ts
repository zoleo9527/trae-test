import { ref } from 'vue'

export interface User {
  id: string
  username: string
  name: string
  role: string
  phone: string
  avatar: string
}

const user = ref<User | null>(null)
const isAuthenticated = ref(false)

export function useAuth() {
  const config = useRuntimeConfig()

  const login = async (username: string, password: string) => {
    try {
      const response = await $fetch<User>(`${config.public.apiBase}/auth/login`, {
        method: 'POST',
        body: { username, password }
      })
      user.value = response
      isAuthenticated.value = true
      localStorage.setItem('water_delivery_user', JSON.stringify(response))
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('water_delivery_user')
    navigateTo('/login')
  }

  const checkAuth = () => {
    const stored = localStorage.getItem('water_delivery_user')
    if (stored) {
      user.value = JSON.parse(stored)
      isAuthenticated.value = true
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      station_master: '配送站长',
      driver: '司机',
      customer_service: '客服'
    }
    return labels[role] || role
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    getRoleLabel
  }
}
