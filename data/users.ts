import type { User } from '~/types'

export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: '张明远',
    role: 'manager',
    phone: '13800138001',
    email: 'zhang.my@golfclub.com',
    permissions: [
      'patrol:view', 'patrol:create', 'patrol:edit', 'patrol:submit', 'patrol:approve', 'patrol:reject',
      'complaint:view', 'complaint:create', 'complaint:edit', 'complaint:assign', 'complaint:resolve', 'complaint:close',
      'booking:view', 'booking:create', 'booking:edit', 'booking:confirm', 'booking:cancel', 'booking:checkin', 'booking:checkout',
      'prepaid:view', 'prepaid:create', 'prepaid:recharge', 'prepaid:deduct', 'prepaid:adjust', 'prepaid:freeze',
      'equipment:view', 'equipment:create', 'equipment:manage', 'equipment:lend', 'equipment:return', 'equipment:check_return',
      'report:view', 'user:manage'
    ]
  },
  {
    id: 'user-002',
    name: '李教练',
    role: 'coach_supervisor',
    phone: '13800138002',
    email: 'li.coach@golfclub.com',
    permissions: [
      'patrol:view', 'patrol:create', 'patrol:edit', 'patrol:submit',
      'complaint:view', 'complaint:create', 'complaint:edit', 'complaint:resolve',
      'booking:view', 'booking:create', 'booking:edit',
      'equipment:view', 'equipment:check_return'
    ]
  },
  {
    id: 'user-003',
    name: '王前台',
    role: 'reception',
    phone: '13800138003',
    email: 'wang.reception@golfclub.com',
    permissions: [
      'patrol:view',
      'complaint:view', 'complaint:create',
      'booking:view', 'booking:create', 'booking:edit', 'booking:confirm', 'booking:checkin', 'booking:checkout',
      'prepaid:view', 'prepaid:create', 'prepaid:recharge',
      'equipment:view', 'equipment:lend', 'equipment:return', 'equipment:check_return'
    ]
  }
]
