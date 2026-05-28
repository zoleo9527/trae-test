import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserRole, UserInfo } from '@/types'
import { USERS } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const currentRole = ref<UserRole | null>(null)
  const currentUser = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => currentRole.value !== null)
  const isBoss = computed(() => currentRole.value === 'boss')
  const isConsultant = computed(() => currentRole.value === 'consultant')
  const isRepair = computed(() => currentRole.value === 'repair')
  const userName = computed(() => currentUser.value?.name || '')

  function login(role: UserRole, password: string): boolean {
    const user = USERS[role]
    if (user && user.password === password) {
      currentRole.value = role
      currentUser.value = user
      return true
    }
    return false
  }

  function logout() {
    currentRole.value = null
    currentUser.value = null
  }

  function hasAccess(allowedRoles: UserRole[]): boolean {
    return currentRole.value !== null && allowedRoles.includes(currentRole.value)
  }

  return { currentRole, currentUser, userName, isLoggedIn, isBoss, isConsultant, isRepair, login, logout, hasAccess }
})
