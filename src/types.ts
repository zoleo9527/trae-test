export type Role = 'manager' | 'optometrist' | 'workshop' | 'service'

export interface Actor {
  id: string
  name: string
  role: Role
  store: string
  title: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  memberNo: string
}

export interface Pkg {
  id: string
  name: string
  price: number
  lensType: string
  frameIncluded: boolean
}

export type OrderStatus = 'pending' | 'redeemed' | 'in_workshop' | 'quality_check' | 'delivered' | 'refunded'

export interface Order {
  id: string
  code: string
  customerId: string
  packageId: string
  createdAt: string
  status: OrderStatus
  store: string
  salesperson: string
}

export interface EyeRx {
  sphere: number
  cylinder: number
  axis: number
  add?: number
}

export interface Rx {
  orderId: string
  od: EyeRx
  os: EyeRx
  pd: number
  note?: string
  measuredBy: string
  measuredAt: string
}

export type JobStage = 'pending' | 'cutting' | 'edging' | 'quality' | 'done'

export interface Job {
  id: string
  orderId: string
  stage: JobStage
  updatedAt: string
  assignee: string
}

export type TransferStatus = 'sent' | 'in_transit' | 'received' | 'lost'

export interface Transfer {
  id: string
  orderId: string
  fromStore: string
  toStore: string
  logistics: string
  trackingNo: string
  status: TransferStatus
  sentAt: string
  receivedAt?: string
  lost?: boolean
  note?: string
  operator?: string
  lostConfirmedBy?: string
}

export type RepairStatus = 'reported' | 'factory' | 'returned' | 'completed'

export interface Repair {
  id: string
  orderId: string
  reason: string
  owner: string
  eta: string
  status: RepairStatus
  createdAt: string
  completedAt?: string
  note?: string
}

export type RefundStatus = 'requested' | 'reviewing' | 'approved' | 'rejected'

export interface Refund {
  id: string
  orderId: string
  amount: number
  reason: string
  status: RefundStatus
  requestedBy: string
  requestedAt: string
  reviewer?: string
  reviewedAt?: string
  decision?: string
}

export type NoteKind = 'note' | 'reject' | 'supplement' | 'evidence'

export interface NoteItem {
  id: string
  orderId: string
  kind: NoteKind
  role: Role
  actor: string
  content: string
  createdAt: string
  attach?: string
}

export interface Database {
  actors: Actor[]
  customers: Customer[]
  packages: Pkg[]
  orders: Order[]
  rxList: Rx[]
  jobs: Job[]
  transfers: Transfer[]
  repairs: Repair[]
  refunds: Refund[]
  notes: NoteItem[]
}
