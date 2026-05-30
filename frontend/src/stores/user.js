import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const currentRole = ref('')

  const isLoggedIn = computed(() => !!currentUser.value)

  const roleConfig = {
    director: {
      name: '馆长',
      permissions: ['all'],
      description: '全局视角，关注整体运营数据和跨部门协同'
    },
    coordinator: {
      name: '志愿者协调',
      permissions: ['schedule', 'checkin', 'feedback', 'volunteers'],
      description: '负责排班、签到和志愿者管理'
    },
    operator: {
      name: '活动运营',
      permissions: ['checkin', 'feedback'],
      description: '关注活动签到和反馈处理'
    }
  }

  const users = [
    { id: 1, username: 'director', password: '123456', role: 'director', name: '张馆长' },
    { id: 2, username: 'coordinator', password: '123456', role: 'coordinator', name: '李协调' },
    { id: 3, username: 'operator', password: '123456', role: 'operator', name: '王运营' }
  ]

  function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password)
    if (user) {
      currentUser.value = user
      currentRole.value = user.role
      return true
    }
    return false
  }

  function switchRole(role) {
    const user = users.find(u => u.role === role)
    if (user) {
      currentUser.value = user
      currentRole.value = role
      return true
    }
    return false
  }

  function logout() {
    currentUser.value = null
    currentRole.value = ''
  }

  function hasPermission(permission) {
    if (!currentRole.value) return false
    const config = roleConfig[currentRole.value]
    return config.permissions.includes('all') || config.permissions.includes(permission)
  }

  return {
    currentUser,
    currentRole,
    isLoggedIn,
    roleConfig,
    users,
    login,
    switchRole,
    logout,
    hasPermission
  }
})
