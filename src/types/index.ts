export type Role = 'merchandiser' | 'warehouse' | 'finance' | 'manager'

export const RoleLabels: Record<Role, string> = {
  merchandiser: '跟单员',
  warehouse: '仓管员',
  finance: '财务员',
  manager: '管理层',
}

export type OrderStatus = 'draft' | 'sampling' | 'confirmed' | 'scheduled' | 'split' | 'shipped' | 'completed' | 'rejected'

export const OrderStatusLabels: Record<OrderStatus, string> = {
  draft: '草稿',
  sampling: '打样中',
  confirmed: '已确认',
  scheduled: '排期中',
  split: '已拆单',
  shipped: '已发货',
  completed: '已完成',
  rejected: '已驳回',
}

export type SplitStatus = 'pending' | 'shipped' | 'partial' | 'completed'

export const SplitStatusLabels: Record<SplitStatus, string> = {
  pending: '待发货',
  shipped: '已发货',
  partial: '部分发货',
  completed: '已完成',
}

export type ReceiptStatus = 'pending' | 'signed' | 'exception'

export const ReceiptStatusLabels: Record<ReceiptStatus, string> = {
  pending: '待回执',
  signed: '已签收',
  exception: '异常',
}

export type RefundStatus = 'pending' | 'finance_approved' | 'manager_approved' | 'rejected' | 'completed'

export const RefundStatusLabels: Record<RefundStatus, string> = {
  pending: '待审核',
  finance_approved: '财务已审核',
  manager_approved: '管理层已确认',
  rejected: '已驳回',
  completed: '退款完成',
}

export type ResponsibilityType = 'merchandiser_miss' | 'warehouse_error' | 'logistics_damage' | 'customer_reason' | 'other'

export const ResponsibilityTypeLabels: Record<ResponsibilityType, string> = {
  merchandiser_miss: '跟单遗漏',
  warehouse_error: '仓管错发',
  logistics_damage: '物流损坏',
  customer_reason: '客户原因',
  other: '其他原因',
}

export interface OrderItem {
  id: string
  name: string
  spec: string
  quantity: number
  unitPrice: number
  category: string
}

export interface OrderVersion {
  id: string
  orderId: string
  versionNo: number
  content: string
  confirmedBy: string
  isCurrent: boolean
  needsReview: boolean
  overrideReason?: string
  createdAt: Date
  items: OrderItem[]
}

export interface Order {
  id: string
  orderNo: string
  customerName: string
  contactPhone: string
  status: OrderStatus
  createdBy: string
  createdAt: Date
  updatedAt: Date
  items: OrderItem[]
  versions: OrderVersion[]
  needsReview: boolean
  reviewReason?: string
  rejectionReason?: string
}

export interface SplitItem {
  id: string
  orderItemId: string
  name: string
  spec: string
  quantity: number
  category: string
}

export interface SplitOrder {
  id: string
  orderId: string
  splitNo: string
  items: SplitItem[]
  status: SplitStatus
  trackingNo?: string
  shippedBy?: string
  shippedAt?: Date
  createdAt: Date
  missingWarning?: boolean
}

export interface Receipt {
  id: string
  splitId: string
  status: ReceiptStatus
  signedBy?: string
  signedAt?: Date
  exceptionNote?: string
  photos?: string[]
  createdAt: Date
}

export interface ResponsibilityChain {
  id: string
  type: ResponsibilityType
  description: string
  responsiblePerson: string
  relatedRecordId?: string
  relatedRecordType?: 'order' | 'split' | 'receipt'
}

export interface Refund {
  id: string
  orderId: string
  splitId?: string
  amount: number
  reason: string
  responsibilityChainId: string
  status: RefundStatus
  financeOpinion?: string
  financeApprovedBy?: string
  financeApprovedAt?: Date
  managerOpinion?: string
  managerApprovedBy?: string
  managerApprovedAt?: Date
  createdBy: string
  createdAt: Date
}

export interface TimelineEvent {
  id: string
  type: 'order_create' | 'version_confirm' | 'version_override' | 'order_schedule' | 'split_create' | 'split_ship' | 'receipt_sign' | 'receipt_exception' | 'refund_create' | 'refund_approve' | 'refund_reject'
  orderId: string
  splitId?: string
  refundId?: string
  title: string
  description: string
  operator: string
  timestamp: Date
  isException?: boolean
  needsReview?: boolean
  metadata?: Record<string, unknown>
}

export interface DashboardStats {
  pending: number
  rejected: number
  needsReview: number
  pendingItems: Array<{
    id: string
    type: 'order' | 'split' | 'receipt' | 'refund'
    title: string
    subTitle: string
    status: string
    priority: 'high' | 'medium' | 'low'
  }>
}
