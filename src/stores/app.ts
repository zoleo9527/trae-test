import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserRole } from '@/types'

export const useAppStore = defineStore('app', () => {
  const currentRole = ref<UserRole>('manager')
  const sidebarCollapsed = ref(false)

  const roleNames: Record<UserRole, string> = {
    manager: '馆务经理',
    ticket: '票务专员',
    executor: '活动执行'
  }

  const setRole = (role: UserRole) => {
    currentRole.value = role
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    currentRole,
    sidebarCollapsed,
    roleNames,
    setRole,
    toggleSidebar
  }
})
