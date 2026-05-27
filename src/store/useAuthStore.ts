import { create } from 'zustand'
import type { User, UserRole } from '@/types'
import { mockUsers, mockCredentials } from '@/mock/users'

interface AuthState {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  switchRole: (role: UserRole) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: async (username, password) => {
    const cred = mockCredentials[username]
    if (cred && cred.password === password) {
      const user = mockUsers.find((u) => u.id === cred.userId)
      if (user) {
        set({ user })
        localStorage.setItem('auth_user', JSON.stringify(user))
        return true
      }
    }
    return false
  },
  logout: () => {
    set({ user: null })
    localStorage.removeItem('auth_user')
  },
  switchRole: (role) => {
    const user = mockUsers.find((u) => u.role === role)
    if (user) {
      set({ user })
      localStorage.setItem('auth_user', JSON.stringify(user))
    }
  },
}))

const savedUser = localStorage.getItem('auth_user')
if (savedUser) {
  try {
    const user = JSON.parse(savedUser)
    useAuthStore.setState({ user })
  } catch (e) {
    // ignore
  }
}
