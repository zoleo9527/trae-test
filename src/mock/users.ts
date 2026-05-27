import type { User } from '@/types'

export const mockUsers: User[] = [
  {
    id: 'u001',
    name: '张主管',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    phone: '138****1234',
  },
  {
    id: 'u002',
    name: '李巡检',
    role: 'inspector',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=inspector',
    phone: '139****5678',
  },
  {
    id: 'u003',
    name: '王客服',
    role: 'service',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=service',
    phone: '137****9012',
  },
]

export const mockCredentials: Record<string, { password: string; userId: string }> = {
  admin: { password: '123456', userId: 'u001' },
  inspector01: { password: '123456', userId: 'u002' },
  service01: { password: '123456', userId: 'u003' },
}
