import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Role = '基地负责人' | '养护员' | '销售跟单'

export interface RoleInfo {
  key: Role
  label: string
  permissions: string[]
}

export const roles: RoleInfo[] = [
  {
    key: '基地负责人',
    label: '基地负责人',
    permissions: ['view_all', 'approve_transfer', 'view_reports', 'confirm_disease'],
  },
  {
    key: '养护员',
    label: '养护员',
    permissions: ['handle_maintenance', 'report_disease', 'confirm_lifting'],
  },
  {
    key: '销售跟单',
    label: '销售跟单',
    permissions: ['create_transfer', 'fill_loading', 'record_followup', 'handle_negotiation'],
  },
]

export const useAppStore = defineStore('app', () => {
  const currentRole = ref<Role>('基地负责人')
  const sidebarCollapsed = ref(false)

  function setRole(role: Role) {
    currentRole.value = role
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function hasPermission(permission: string): boolean {
    const roleInfo = roles.find(r => r.key === currentRole.value)
    return roleInfo ? roleInfo.permissions.includes(permission) : false
  }

  return {
    currentRole,
    sidebarCollapsed,
    setRole,
    toggleSidebar,
    hasPermission,
  }
})
