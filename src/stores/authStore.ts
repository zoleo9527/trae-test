import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'owner' | 'developer' | 'cs'

export interface User {
  id: string
  name: string
  role: UserRole
}

interface AuthState {
  currentUser: User | null
  login: (role: UserRole) => void
  logout: () => void
}

const USER_MAP: Record<UserRole, User> = {
  owner: { id: 'staff-owner', name: '陈店主', role: 'owner' },
  developer: { id: 'staff-dev', name: '李冲印师', role: 'developer' },
  cs: { id: 'staff-cs', name: '王客服', role: 'cs' },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      login: (role: UserRole) => {
        set({ currentUser: USER_MAP[role] })
      },
      logout: () => {
        set({ currentUser: null })
      },
    }),
    {
      name: 'film-lab-auth',
    }
  )
)
