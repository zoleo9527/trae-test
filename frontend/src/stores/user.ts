import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref<any>(null)

  const setUser = (userData: any) => {
    user.value = userData
    localStorage.setItem('camp_user', JSON.stringify(userData))
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem('camp_user')
  }

  const loadUser = () => {
    const saved = localStorage.getItem('camp_user')
    if (saved) {
      user.value = JSON.parse(saved)
    }
  }

  return {
    user,
    setUser,
    logout,
    loadUser,
  }
})
