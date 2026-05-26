import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '@/types'
import dbApi from '@/db'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)

  const isLoggedIn = computed(() => currentUser.value !== null)
  const role = computed(() => currentUser.value?.role)
  const userName = computed(() => currentUser.value?.name)

  async function login(username: string): Promise<boolean> {
    const user = await dbApi.getUserByUsername(username)
    if (user) {
      currentUser.value = user
      await window.app.setCurrentUser(user)
      return true
    }
    return false
  }

  function logout(): void {
    currentUser.value = null
    window.app.setCurrentUser(null)
  }

  async function restoreSession(): Promise<void> {
    const user = await window.app.getCurrentUser()
    if (user) {
      currentUser.value = user
    }
  }

  function hasRole(allowedRoles: UserRole[]): boolean {
    if (!currentUser.value) return false
    return allowedRoles.includes(currentUser.value.role)
  }

  return { currentUser, isLoggedIn, role, userName, login, logout, restoreSession, hasRole }
})
