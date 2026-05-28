export type Role = 'manager' | 'coordinator' | 'clerk'

export interface User {
  id: string
  name: string
  role: Role
  avatar?: string
}

export type SuppliesStatus = 
  | 'draft'
  | 'pending_review'
  | 'reviewed'
  | 'rejected'
  | 'supplier_assigned'
  | 'in_progress'
  | 'completed'
  | 'paid'

export type SuppliesCategory = 
  | 'provisions'
  | 'engine'
  | 'deck'
  | 'medical'
  | 'documents'
  | 'other'

export interface SuppliesItem {
  id: string
  name: string
  category: SuppliesCategory
  quantity: number
  unit: string
  specification?: string
  urgency: 'normal' | 'urgent' | 'critical'
}

export interface DocumentItem {
  id: string
  name: string
  type: string
  deadline: string
  status: 'pending' | 'received' | 'expired'
  reminderDays: number[]
}

export interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  category: SuppliesCategory[]
  rating: number
  lastCooperation: string
}

export interface Comment {
  id: string
  userId: string
  userName: string
  userRole: Role
  content: string
  timestamp: string
  type: 'system' | 'comment' | 'reject' | 'reminder'
}

export interface StatusHistory {
  id: string
  status: SuppliesStatus
  timestamp: string
  userId: string
  userName: string
  remark?: string
}

export interface SuppliesApplication {
  id: string
  applicationNo: string
  vesselName: string
  port: string
  berthDate: string
  departureDate: string
  applicantId: string
  applicantName: string
  items: SuppliesItem[]
  totalAmount: number
  status: SuppliesStatus
  currentHandlerId?: string
  currentHandlerName?: string
  supplierId?: string
  supplierName?: string
  documents: DocumentItem[]
  advancePayment: number
  actualPayment?: number
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  paymentDueDate?: string
  comments: Comment[]
  statusHistory: StatusHistory[]
  createdAt: string
  updatedAt: string
}

export interface BatchReviewItem {
  applicationId: string
  applicationNo: string
  vesselName: string
  selected: boolean
  approved: boolean | null
  rejectReason?: string
}
