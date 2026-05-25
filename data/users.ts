import type { User, RolePermission, UserRole } from '~/types'

export const users: User[] = [
  {
    id: 'u001',
    name: '张明远',
    role: 'manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager'
  },
  {
    id: 'u002',
    name: '李票务',
    role: 'ticketing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ticketing'
  },
  {
    id: 'u003',
    name: '林小艺',
    role: 'event',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=event'
  }
]

export const rolePermissions: Record<UserRole, RolePermission> = {
  manager: {
    canViewAll: true,
    canCreate: true,
    canApprove: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    visibleFields: ['all']
  },
  ticketing: {
    canViewAll: false,
    canCreate: true,
    canApprove: false,
    canEdit: true,
    canDelete: false,
    canExport: false,
    visibleFields: ['location', 'supplier', 'expectedDate', 'actualDate', 'lossDate', 'relatedTicketOrder']
  },
  event: {
    canViewAll: false,
    canCreate: true,
    canApprove: false,
    canEdit: true,
    canDelete: false,
    canExport: false,
    visibleFields: ['location', 'lossDate', 'relatedEvent', 'lossReason']
  }
}

export const roleNames: Record<UserRole, string> = {
  manager: '馆务经理',
  ticketing: '票务专员',
  event: '活动执行'
}
