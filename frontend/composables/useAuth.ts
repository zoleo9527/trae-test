import { ref } from 'vue'

export interface User {
  id: string
  username: string
  name: string
  role: string
  phone: string
  avatar: string
}

export type UserRole = 'station_master' | 'driver' | 'customer_service'

const user = ref<User | null>(null)
const isAuthenticated = ref(false)

const ROLE_DEFAULT_PAGES: Record<UserRole, string> = {
  station_master: '/dashboard',
  driver: '/routes',
  customer_service: '/exceptions'
}

const ROLE_ALLOWED_PAGES: Record<UserRole, string[]> = {
  station_master: ['/dashboard', '/routes', '/exceptions', '/customers', '/buckets'],
  driver: ['/routes', '/exceptions'],
  customer_service: ['/exceptions', '/customers', '/routes']
}

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

  const getDefaultPage = (role: string) => {
    return ROLE_DEFAULT_PAGES[role as UserRole] || '/dashboard'
  }

  const hasAccessToPage = (role: string, path: string) => {
    const normalizedPath = path.split('/').slice(0, 2).join('/') || '/'
    if (normalizedPath === '/login') return true
    const allowedPages = ROLE_ALLOWED_PAGES[role as UserRole]
    if (!allowedPages) return false
    return allowedPages.includes(normalizedPath)
  }

  const canViewDashboard = (role: string) => role === 'station_master'
  const canViewRoutes = (role: string) => ['station_master', 'driver', 'customer_service'].includes(role)
  const canViewExceptions = (role: string) => ['station_master', 'driver', 'customer_service'].includes(role)
  const canViewCustomers = (role: string) => ['station_master', 'customer_service'].includes(role)
  const canViewBuckets = (role: string) => role === 'station_master'

  return {
    user,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    getRoleLabel,
    getDefaultPage,
    hasAccessToPage,
    canViewDashboard,
    canViewRoutes,
    canViewExceptions,
    canViewCustomers,
    canViewBuckets
  }
}
