export type OrderStatus = 
  | 'pending'
  | 'sorting'
  | 'washing'
  | 'drying'
  | 'ironing'
  | 'qc'
  | 'completed'
  | 'rewash'
  | 'delivered'

export type IssueType = 'stain' | 'damage' | 'missing' | 'color_fade' | 'other'

export type IssueStatus = 'pending' | 'processing' | 'resolved' | 'escalated'

export interface ClothingItem {
  id: string
  orderId: string
  barcode: string
  type: string
  color: string
  brand?: string
  size?: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Order {
  id: string
  orderNo: string
  storeId: string
  customerName: string
  customerPhone?: string
  items: ClothingItem[]
  status: OrderStatus
  priority: 'normal' | 'urgent' | 'vip'
  receivedAt: number
  estimatedDelivery?: number
  deliveredAt?: number
  currentStage: number
  totalRewashCount: number
  createdAt: number
  updatedAt: number
}

export interface Batch {
  id: string
  batchNo: string
  type: 'wash' | 'rewash'
  orderIds: string[]
  status: 'pending' | 'processing' | 'completed'
  processType: string
  startTime?: number
  endTime?: number
  operator?: string
  notes?: string
  createdAt: number
}

export interface ProcessRecord {
  id: string
  orderId: string
  stage: number
  stageName: string
  operator?: string
  startTime: number
  endTime?: number
  notes?: string
  createdAt: number
}

export interface RewashRecord {
  id: string
  orderId: string
  itemId?: string
  reason: string
  issueType: IssueType
  detectedAt: number
  detectedBy?: string
  rewashCount: number
  resolved: boolean
  resolvedAt?: number
  resolvedBy?: string
  resolution?: string
  evidencePhotos?: string[]
  notes?: string
}

export interface Issue {
  id: string
  orderId: string
  itemId?: string
  type: IssueType
  title: string
  description: string
  status: IssueStatus
  reportedBy?: string
  reportedAt: number
  assignee?: string
  evidence: {
    type: 'photo' | 'note'
    content: string
    timestamp: number
    author?: string
  }[]
  resolution?: string
  resolvedAt?: number
  compensation?: number
  createdAt: number
}

export interface HandoverRecord {
  id: string
  type: 'in' | 'out'
  orderIds: string[]
  storeId: string
  status: 'pending' | 'confirmed'
  operator?: string
  timestamp: number
  confirmedAt?: number
  signature?: string
  notes?: string
}

export interface Store {
  id: string
  name: string
  code: string
  contact?: string
  address?: string
  phone?: string
}

export interface User {
  id: string
  name: string
  role: 'admin' | 'manager' | 'operator' | 'qc' | 'store'
  avatar?: string
}

export interface TimelineEvent {
  id: string
  type: 'order' | 'batch' | 'issue' | 'rewash' | 'handover'
  referenceId: string
  action: string
  description?: string
  operator?: string
  timestamp: number
  metadata?: Record<string, any>
}
