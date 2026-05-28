export type UserRole = 'business' | 'sampling' | 'warehouse'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
}

export type OrderStatus = 
  | 'draft'
  | 'quoting'
  | 'sampling'
  | 'sample_confirmed'
  | 'version_locked'
  | 'scheduled'
  | 'producing'
  | 'qc_passed'
  | 'shipping'
  | 'completed'

export type ExceptionType = 'version_overwrite' | 'shipment_missing' | 'refund_required'
export type ExceptionSeverity = 'critical' | 'warning'
export type ExceptionStatus = 'pending' | 'processing' | 'resolved'

export type SampleVersionStatus = 'pending' | 'confirmed' | 'rejected' | 'locked'

export type ProductionStatus = 'scheduled' | 'producing' | 'qc_passed' | 'qc_failed'

export type ShipmentStatus = 'pending' | 'shipped' | 'partial' | 'delivered'

export type ResponsibleParty = 'factory' | 'client' | 'logistics' | 'internal'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface SampleVersion {
  id: string
  orderId: string
  version: number
  status: SampleVersionStatus
  photoUrl: string
  confirmedBy?: string
  confirmedAt?: string
  changeReason?: string
  specs: Record<string, string>
  createdAt: string
}

export interface ProductionSchedule {
  id: string
  orderId: string
  scheduledDate: string
  productionStatus: ProductionStatus
  qcResult?: string
  quantity: number
  createdAt: string
}

export interface ShipmentItem {
  id: string
  shipmentId: string
  skuName: string
  expectedQty: number
  actualQty: number
  isMissing: boolean
}

export interface Shipment {
  id: string
  orderId: string
  trackingNo?: string
  carrier?: string
  status: ShipmentStatus
  shippedAt?: string
  items: ShipmentItem[]
}

export interface RefundChain {
  id: string
  exceptionId: string
  responsibleParty: ResponsibleParty
  amount: number
  approver?: string
  approvalStatus: ApprovalStatus
  approvedAt?: string
  remark?: string
}

export interface Exception {
  id: string
  orderId: string
  type: ExceptionType
  severity: ExceptionSeverity
  status: ExceptionStatus
  description: string
  createdAt: string
  resolvedAt?: string
  refundChain?: RefundChain
  oldVersionId?: string
  newVersionId?: string
}

export interface OperationLog {
  id: string
  orderId: string
  operator: string
  operatorRole: UserRole
  action: string
  detail: string
  timestamp: string
}

export interface Order {
  id: string
  orderNo: string
  clientName: string
  productName: string
  status: OrderStatus
  assignee: string
  assigneeRole: UserRole
  totalAmount: number
  quantity: number
  createdAt: string
  updatedAt: string
  sampleVersions: SampleVersion[]
  productionSchedules: ProductionSchedule[]
  shipments: Shipment[]
  exceptions: Exception[]
  operationLogs: OperationLog[]
}
