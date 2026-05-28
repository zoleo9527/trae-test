import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Role } from '@/types'

const users: User[] = [
  { id: '1', name: '张明', role: 'manager', avatar: '👨‍💼' },
  { id: '2', name: '李强', role: 'coordinator', avatar: '👷' },
  { id: '3', name: '王芳', role: 'clerk', avatar: '👩‍💻' }
]

const roleLabels: Record<Role, string> = {
  manager: '代理经理',
  coordinator: '现场协调',
  clerk: '单证专员'
}

const rolePermissions: Record<Role, string[]> = {
  manager: ['review', 'batch_review', 'assign_supplier', 'view_all', 'approve_payment'],
  coordinator: ['create', 'edit', 'submit', 'view_own', 'start_progress', 'complete_progress', 'resubmit'],
  clerk: ['document_management', 'update_document_status', 'payment_tracking', 'update_payment', 'view_all', 'record_keeping', 'mark_paid']
}

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User>(users[0])

  const currentRoleLabel = computed(() => roleLabels[currentUser.value.role])
  const permissions = computed(() => rolePermissions[currentUser.value.role])

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      currentUser.value = user
    }
  }

  const hasPermission = (permission: string) => {
    return permissions.value.includes(permission)
  }

  return {
    currentUser,
    currentRoleLabel,
    permissions,
    users,
    roleLabels,
    switchUser,
    hasPermission
  }
})
