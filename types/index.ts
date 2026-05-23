export type OrderType = 'custom' | 'repair' | 'remodel' | 'transfer'
export type OrderStatus = 'pending' | 'preparing' | 'processing' | 'quality_check' | 'completed' | 'abnormal'
export type ProgressStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'abnormal'
export type AbnormalType = 'stone_shortage' | 'craft_issue' | 'customer_change' | 'quality_issue' | 'damage' | 'other'
export type AbnormalLevel = 'low' | 'medium' | 'high' | 'critical'
export type AbnormalStatus = 'pending' | 'processing' | 'resolved' | 'closed'
export type HandoverType = 'receive' | 'transfer' | 'deliver' | 'return'
export type UserRole = 'manager' | 'sales' | 'service'

export interface Customer {
  id: string
  name: string
  phone: string
  wechat?: string
  memberLevel?: string
}

export interface Stone {
  type: string
  carat: number
  color?: string
  clarity?: string
  cut?: string
  quantity?: number
}

export interface Jewelry {
  category: 'ring' | 'necklace' | 'bracelet' | 'earring' | 'pendant'
  material: string
  mainStone?: Stone
  sideStones?: Stone[]
  size?: string
  weight?: number
}

export interface PriceInfo {
  basePrice: number
  stonePrice: number
  craftPrice: number
  discount?: number
  total: number
  deposit?: number
  remaining?: number
}

export interface ProgressNode {
  id: string
  step: string
  status: ProgressStatus
  startTime?: Date
  endTime?: Date
  operator?: string
  remark?: string
  photos?: string[]
}

export interface Note {
  id: string
  content: string
  createdAt: Date
  operator: string
  isPrivate?: boolean
}

export interface HandoverItem {
  name: string
  quantity: number
  description?: string
}

export interface HandoverRecord {
  id: string
  orderId: string
  orderNo: string
  customerName: string
  type: HandoverType
  fromParty: string
  toParty: string
  items: HandoverItem[]
  photos: string[]
  signature?: string
  timestamp: Date
  remark?: string
}

export interface AbnormalHistory {
  id: string
  action: string
  content: string
  operator: string
  timestamp: Date
}

export interface AbnormalRecord {
  id: string
  orderId: string
  orderNo: string
  customerName: string
  type: AbnormalType
  level: AbnormalLevel
  status: AbnormalStatus
  description: string
  cause?: string
  solution?: string
  compensation?: number
  createdAt: Date
  operator: string
  history: AbnormalHistory[]
}

export interface Order {
  id: string
  orderNo: string
  customer: Customer
  type: OrderType
  status: OrderStatus
  jewelry: Jewelry
  requirements: string
  price: PriceInfo
  progress: ProgressNode[]
  createdAt: Date
  estimatedDelivery: Date
  actualDelivery?: Date
  operator: string
  notes: Note[]
  handoverRecords: string[]
  abnormalRecords: string[]
  remodelCount: number
}

export interface FilterOptions {
  search?: string
  status?: OrderStatus[]
  type?: OrderType[]
  dateRange?: {
    start: Date
    end: Date
  }
  operator?: string
}

export interface OverviewStats {
  todayOrders: number
  pendingOrders: number
  abnormalOrders: number
  completionRate: number
  totalRevenue: number
  avgProcessingTime: number
}

export interface TrendData {
  date: string
  orders: number
  completed: number
}

export interface TodoItem {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  type: 'order' | 'abnormal' | 'handover'
  relatedId?: string
  deadline?: Date
}

export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  avatar?: string
}
