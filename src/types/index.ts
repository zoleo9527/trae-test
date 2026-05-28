export interface Member {
  id: number
  name: string
  phone: string
  wechatId?: string
  memberLevel: 'normal' | 'silver' | 'gold' | 'diamond'
  storageMonths: number
  totalFilms: number
  activeFilms: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export type FilmStatus = 
  | 'registered' 
  | 'waiting_process' 
  | 'processing' 
  | 'rework' 
  | 'waiting_delivery' 
  | 'delivered' 
  | 'stored' 
  | 'expired'

export interface Film {
  id: number
  memberId: number
  memberName: string
  filmNo: string
  filmType: string
  filmBrand: string
  iso: string
  format: '135' | '120' | 'large_format'
  shots: number
  processType: string
  scanResolution: string
  deliveryVersion: 'standard' | 'high' | 'raw'
  status: FilmStatus
  storageStartDate: string
  storageEndDate: string
  isUrgent: boolean
  remark?: string
  rejectReason?: string
  reworkCount: number
  currentHandler: string
  createdAt: string
  updatedAt: string
}

export type ProcessAction = 
  | 'register' 
  | 'start_process' 
  | 'reject' 
  | 'rework' 
  | 'finish_process' 
  | 'ready_delivery' 
  | 'deliver' 
  | 'store'

export interface ProcessRecord {
  id: number
  filmId: number
  filmNo: string
  memberId: number
  memberName: string
  action: ProcessAction
  previousStatus: FilmStatus
  newStatus: FilmStatus
  operator: string
  remark?: string
  timestamp: string
}

export type ReminderType = 'expire' | 'rework' | 'reject' | 'pending'

export interface Reminder {
  id: number
  type: ReminderType
  filmId: number
  filmNo: string
  memberId: number
  memberName: string
  title: string
  content: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  isDismissed: boolean
  dismissedAt?: string
  createdAt: string
}

export interface AuditLog {
  id: number
  action: string
  module: string
  targetId?: number
  operator: string
  detail: string
  ip?: string
  timestamp: string
}

export interface DashboardStats {
  pendingCount: number
  rejectedCount: number
  reworkCount: number
  expiringCount: number
  totalActive: number
  todayProcessed: number
  expiring7Days: Film[]
  pendingList: Film[]
  rejectedList: Film[]
  reworkList: Film[]
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  memberId?: number
  startDate?: string
  endDate?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
