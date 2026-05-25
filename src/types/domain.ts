export type Role = 'channel' | 'issuer' | 'finance'

export type RoleName = '渠道经理' | '发行专员' | '财务对接'

export type ReturnStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'closed'

export type TransferStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'rejected'

export type ReceiptStatus = 'pending' | 'submitted' | 'missing' | 'confirmed'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface BookItem {
  isbn: string
  title: string
  author: string
  category: string
  price: number
}

export interface ReturnLine {
  isbn: string
  title: string
  author: string
  category: string
  price: number
  distributedQty: number
  returnedQty: number
  reason: string
}

export interface ReturnApplication {
  id: string
  channelCode: string
  channelName: string
  manager: string
  createdAt: string
  deadline: string
  status: ReturnStatus
  totalAmount: number
  lines: ReturnLine[]
  note: string
  attachments: string[]
  history: HistoryEntry[]
  linkedTransferId?: string
}

export interface TransferLine {
  isbn: string
  title: string
  qty: number
  from: string
  to: string
}

export interface StockTransfer {
  id: string
  returnApplicationId?: string
  initiator: string
  status: TransferStatus
  createdAt: string
  expectedDate: string
  completedAt?: string
  lines: TransferLine[]
  courier?: string
  trackingNo?: string
  risk: RiskLevel
  note: string
  history: HistoryEntry[]
}

export type ReceiptMethod = 'mail' | 'online' | 'note'

export interface SampleReceipt {
  id: string
  returnApplicationId: string
  channel: string
  bookTitle: string
  qty: number
  status: ReceiptStatus
  submittedAt?: string
  confirmedAt?: string
  receiptCode?: string
  method?: ReceiptMethod
  remark?: string
  note: string
  history: HistoryEntry[]
}

export interface ReconciliationRecord {
  id: string
  month: string
  channel: string
  bookTitle: string
  expectedReturn: number
  actualReturn: number
  delta: number
  caliber: string
  status: 'matched' | 'mismatch' | 'pending'
  lastCheckedAt: string
  checker: string
  history: HistoryEntry[]
}

export interface HistoryEntry {
  id: string
  timestamp: string
  role: Role
  operator: string
  action: string
  from?: string
  to?: string
  comment?: string
}

export interface OverviewSummary {
  pending: number
  rejected: number
  needReview: number
  inTransfer: number
  receiptsMissing: number
  mismatches: number
  reconciled: number
}
