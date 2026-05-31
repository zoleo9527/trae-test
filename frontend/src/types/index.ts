export type OrderStatus = 'pending' | 'confirmed' | 'scheduled' | 'producing' | 'completed' | 'exception' | 'refunded'
export type PickupStatus = 'waiting' | 'notified' | 'verified' | 'completed'
export type RemakeStatus = 'open' | 'scheduled' | 'producing' | 'completed' | 'closed'
export type RefundStatus = 'requested' | 'tracing' | 'approved' | 'completed' | 'rejected'
export type ChangeType = 'item_change' | 'time_change' | 'quantity_change' | 'cancel_item'
export type RemakeCategory = 'quality' | 'customer_complaint' | 'wrong_item' | 'damaged'
export type RoleType = 'manager' | 'kitchen' | 'service'

export interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
  specs?: string
}

export interface Order {
  id: string
  customerName: string
  phone: string
  items: OrderItem[]
  totalPrice: number
  status: OrderStatus
  pickupDate: string
  pickupTime: string
  createdAt: string
  updatedAt?: string
  remark?: string
}

export interface OrderChange {
  id: string
  orderId: string
  changeType: ChangeType
  oldValue: string
  newValue: string
  reason: string
  pushedToSchedule: boolean
  createdAt: string
}

export interface ScheduleItem {
  id: string
  orderId: string
  date: string
  timeSlot: string
  station: string
  status: 'pending' | 'producing' | 'completed'
  isChanged: boolean
  isRemake: boolean
  remakeTicketId?: string
}

export interface Pickup {
  id: string
  orderId: string
  status: PickupStatus
  verifiedAt?: string
  verifiedBy?: string
}

export interface RemakeTicket {
  id: string
  orderId: string
  reason: string
  category: RemakeCategory
  status: RemakeStatus
  createdAt: string
  completedAt?: string
}

export interface MaterialLoss {
  id: string
  remakeTicketId: string
  materialName: string
  quantity: number
  unit: string
  cost: number
  recordedBy: string
  recordedAt: string
}

export interface Refund {
  id: string
  orderId: string
  amount: number
  reason: string
  status: RefundStatus
  approvedBy?: string
  createdAt: string
  completedAt?: string
}

export interface RefundTrace {
  id: string
  refundId: string
  traceType: 'order' | 'change' | 'remake' | 'loss'
  traceTargetId: string
  summary: string
}

export interface ReviewItem {
  id: string
  type: 'change' | 'remake' | 'refund'
  targetId: string
  orderId: string
  summary: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt?: string
  reviewer?: string
}

export interface FlowNode {
  step: string
  label: string
  role: RoleType
  status: 'done' | 'current' | 'pending'
  timestamp?: string
  actor?: string
  detail?: string
}
