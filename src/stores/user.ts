import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '@/types'
import { mockUsers, getCurrentUser, saveCurrentUser } from '@/mock/data'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User>(getCurrentUser())
  const allUsers = ref<User[]>(mockUsers)

  const roleLabel = computed(() => {
    const labels: Record<UserRole, string> = {
      business: '项目商务',
      sampling: '打样跟单',
      warehouse: '仓配协调'
    }
    return labels[currentUser.value.role]
  })

  const switchUser = (userId: string) => {
    const user = allUsers.value.find(u => u.id === userId)
    if (user) {
      currentUser.value = user
      saveCurrentUser(user)
    }
  }

  const hasPermission = (permission: string): boolean => {
    const permissions: Record<UserRole, string[]> = {
      business: ['view_all', 'create_order', 'initiate_refund', 'handle_exception'],
      sampling: ['view_own', 'handle_sampling', 'lock_version', 'handle_sample_exception'],
      warehouse: ['view_own', 'schedule_production', 'manage_shipment', 'handle_shipment_exception']
    }
    return permissions[currentUser.value.role].includes(permission)
  }

  return {
    currentUser,
    allUsers,
    roleLabel,
    switchUser,
    hasPermission
  }
})
