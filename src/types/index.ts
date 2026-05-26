export type RoleType = 'manager' | 'consultant' | 'coordinator'

export interface RoleInfo {
  id: RoleType
  name: string
  description: string
  color: string
}

export type OrderStatus =
  | 'customizing'
  | 'arriving'
  | 'installing'
  | 'completed'
  | 'after_sales'

export interface StatusHistory {
  status: OrderStatus
  changedAt: string
  changedBy: string
  note: string
}

export interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  note: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
}

export interface AfterSalesTicket {
  id: string
  orderId: string
  type: 'supplementary' | 'compensation'
  status: 'pending' | 'processing' | 'confirmed' | 'resolved' | 'rejected'
  title: string
  description: string
  createdBy: string
  createdAt: string
  updatedAt: string
  assignee: string
  priority: 'low' | 'medium' | 'high'
  parts: SupplementaryPart[]
  compensation: CompensationInfo | null
  history: TicketHistory[]
  relatedOrder: Order | null
}

export interface SupplementaryPart {
  id: string
  name: string
  sku: string
  reason: string
  quantity: number
  confirmed: boolean
  confirmedBy: string | null
  confirmedAt: string | null
  note: string
}

export interface CompensationInfo {
  id: string
  amount: number
  reason: string
  customerRequest: string
  internalDiscussion: string
  approvedBy: string | null
  approvedAt: string | null
  status: 'proposed' | 'negotiating' | 'approved' | 'rejected'
}

export interface TicketHistory {
  action: string
  by: string
  at: string
  detail: string
}

export interface SampleLending {
  id: string
  orderId: string
  itemName: string
  sku: string
  quantity: number
  lentBy: string
  lentTo: string
  lentAt: string
  expectedReturn: string
  returned: boolean
  returnedAt: string | null
  note: string
  overdue: boolean
}

export interface Order {
  id: string
  orderNo: string
  customer: Customer
  items: OrderItem[]
  status: OrderStatus
  statusHistory: StatusHistory[]
  contractDate: string
  expectedDelivery: string
  actualDelivery: string | null
  installDate: string | null
  salesConsultant: string
  coordinator: string
  manager: string
  totalAmount: number
  afterSalesTickets: AfterSalesTicket[]
  sampleLendings: SampleLending[]
  notes: string[]
}