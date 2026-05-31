import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '~/types'
import { mockUsers } from '~/data/users'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const users = ref<User[]>(mockUsers)
  const roleLabelMap: Record<UserRole, string> = {
    manager: '场馆经理',
    coach_supervisor: '教练主管',
    reception: '前台'
  }

  const isLoggedIn = computed(() => currentUser.value !== null)
  const currentRole = computed(() => currentUser.value?.role || null)
  const currentRoleLabel = computed(() => currentRole.value ? roleLabelMap[currentRole.value] : '')
  const currentPermissions = computed(() => currentUser.value?.permissions || [])

  function hasPermission(permission: string): boolean {
    if (!currentUser.value) return false
    return currentUser.value.permissions.includes(permission)
  }

  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => hasPermission(p))
  }

  function switchRole(role: UserRole) {
    const user = users.value.find(u => u.role === role)
    if (user) {
      currentUser.value = user
      localStorage.setItem('currentUserId', user.id)
    }
  }

  function initFromStorage() {
    const savedUserId = localStorage.getItem('currentUserId')
    if (savedUserId) {
      const user = users.value.find(u => u.id === savedUserId)
      if (user) {
        currentUser.value = user
        return
      }
    }
    currentUser.value = users.value[0]
  }

  function getRoleLabel(role: UserRole): string {
    return roleLabelMap[role] || role
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('currentUserId')
  }

  return {
    currentUser,
    users,
    isLoggedIn,
    currentRole,
    currentRoleLabel,
    currentPermissions,
    hasPermission,
    hasAnyPermission,
    switchRole,
    initFromStorage,
    getRoleLabel,
    logout
  }
})
