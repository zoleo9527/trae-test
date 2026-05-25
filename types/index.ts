export type UserRole = 'manager' | 'ticketing' | 'event'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
}

export type RecordStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'abnormal'

export type RecordType = 'restock' | 'loss'

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  currentStock: number
  minStock: number
  unit: string
  price: number
}

export interface StatusHistory {
  status: RecordStatus
  timestamp: string
  userId: string
  userName: string
  remark: string
}

export interface InventoryRecord {
  id: string
  type: RecordType
  productId: string
  productName: string
  productSku: string
  quantity: number
  status: RecordStatus
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  createdBy: string
  createdByName: string
  currentHandler: string
  currentHandlerName: string
  history: StatusHistory[]
  relatedEvent?: string
  relatedTicketOrder?: string
  lossReason?: string
  supplier?: string
  expectedDate?: string
  actualDate?: string
  location: string
  remark: string
}

export interface CalendarEvent {
  id: string
  date: string
  type: 'restock' | 'loss' | 'exhibition' | 'event' | 'ticket_peak'
  title: string
  description: string
  status: RecordStatus
  relatedRecordId?: string
}

export interface Notification {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success'
  timestamp: string
  isRead: boolean
  relatedRecordId?: string
  priority: 'low' | 'medium' | 'high'
}

export interface ActivityLog {
  id: string
  action: string
  recordId: string
  recordType: RecordType
  userId: string
  userName: string
  timestamp: string
  details: string
}

export interface RolePermission {
  canViewAll: boolean
  canCreate: boolean
  canApprove: boolean
  canEdit: boolean
  canDelete: boolean
  canExport: boolean
  visibleFields: string[]
}
