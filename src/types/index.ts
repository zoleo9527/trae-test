export type UserRole = 'admin' | 'inspector' | 'service'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
  phone: string
}

export type SiteStatus = 'normal' | 'warning' | 'error'

export interface Site {
  id: string
  name: string
  address: string
  status: SiteStatus
  deviceCount: number
  lastInspection: string
  image: string
}

export type DeviceType = 'washer' | 'pump' | 'gun' | 'dryer' | 'other'
export type DeviceStatus = 'normal' | 'warning' | 'error' | 'maintenance'

export interface Consumable {
  id: string
  name: string
  stock: number
  threshold: number
  unit: string
}

export interface Device {
  id: string
  siteId: string
  name: string
  type: DeviceType
  status: DeviceStatus
  lastMaintenance: string
  consumables: Consumable[]
}

export type WorkOrderType = 'repair' | 'refund' | 'consumable' | 'other'
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent'
export type WorkOrderStatus =
  | 'pending'
  | 'assigned'
  | 'processing'
  | 'returned'
  | 'escalated'
  | 'completed'
  | 'closed'

export interface WorkOrderLog {
  id: string
  workOrderId: string
  operatorId: string
  operatorName: string
  action: string
  remark?: string
  createdAt: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: 'image' | 'video' | 'file'
  uploadedAt: string
}

export interface WorkOrder {
  id: string
  title: string
  description: string
  type: WorkOrderType
  priority: WorkOrderPriority
  status: WorkOrderStatus
  siteId: string
  siteName: string
  deviceId?: string
  deviceName?: string
  reporterId: string
  reporterName: string
  assigneeId?: string
  assigneeName?: string
  createdAt: string
  deadline?: string
  refundAmount?: number
  logs: WorkOrderLog[]
  attachments: Attachment[]
}

export type InspectionStatus = 'pending' | 'in_progress' | 'completed'
export type InspectionItemStatus = 'normal' | 'abnormal' | 'skip'

export interface InspectionItem {
  id: string
  name: string
  status: InspectionItemStatus
  remark?: string
  photoUrl?: string
}

export interface InspectionTask {
  id: string
  siteId: string
  siteName: string
  inspectorId: string
  inspectorName: string
  scheduledDate: string
  status: InspectionStatus
  items: InspectionItem[]
  startedAt?: string
  completedAt?: string
}
