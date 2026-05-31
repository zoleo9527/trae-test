import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  
  login: (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
    set({ user: userData, token })
  },
  
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
  
  setUser: (user) => set({ user }),
  
  switchRole: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
  
  init: () => {
    try {
      const savedUser = localStorage.getItem('user')
      const savedToken = localStorage.getItem('token')
      if (savedUser && savedToken && savedUser !== 'undefined') {
        set({ user: JSON.parse(savedUser), token: savedToken })
      }
    } catch (e) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }
}))

export default useAuthStore
