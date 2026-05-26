import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '@/utils/db'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)

  async function login(username, password) {
    const result = await db.query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    )
    if (result.success && result.data.length > 0) {
      user.value = result.data[0]
      localStorage.setItem('user', JSON.stringify(user.value))
      await db.log('login', 'users', user.value.id, null, '用户登录')
      return true
    }
    return false
  }

  function logout() {
    user.value = null
    localStorage.removeItem('user')
  }

  function restoreSession() {
    const saved = localStorage.getItem('user')
    if (saved) {
      user.value = JSON.parse(saved)
    }
  }

  return {
    user,
    isLoggedIn,
    login,
    logout,
    restoreSession
  }
})
