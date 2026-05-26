import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const users = ref([])

  async function loadUsers() {
    const data = await storage.get('users')
    if (data) {
      users.value = data
    }
  }

  async function login(username, password) {
    await loadUsers()
    const user = users.value.find(u => u.username === username && u.password === password)
    if (user) {
      currentUser.value = { ...user }
      await storage.set('currentUser', currentUser.value)
      return true
    }
    return false
  }

  async function logout() {
    currentUser.value = null
    await storage.del('currentUser')
  }

  async function restoreSession() {
    const saved = await storage.get('currentUser')
    if (saved) {
      currentUser.value = saved
      return true
    }
    return false
  }

  function getRoleName(role) {
    const roleMap = {
      director: '合作社理事',
      dispatcher: '调度员',
      operator: '机手'
    }
    return roleMap[role] || role
  }

  return {
    currentUser,
    users,
    login,
    logout,
    restoreSession,
    getRoleName
  }
})
