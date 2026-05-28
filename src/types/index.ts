export type UserRole = 'boss' | 'consultant' | 'repair'

export interface UserInfo {
  role: UserRole
  name: string
  password: string
  label: string
}

export const USERS: Record<UserRole, UserInfo> = {
  boss: { role: 'boss', name: '王建国', password: 'boss123', label: '门店老板' },
  consultant: { role: 'consultant', name: '李小芳', password: 'consult123', label: '租赁顾问' },
  repair: { role: 'repair', name: '张师傅', password: 'repair123', label: '维修师傅' },
}

export type OrderStatus =
  | 'checkout_pending'
  | 'checked_out'
  | 'overdue'
  | 'return_pending'
  | 'inspecting'
  | 'damage_assessing'
  | 'repairing'
  | 'repair_reviewing'
  | 'settling'
  | 'disputed'
  | 'completed'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  checkout_pending: '待租出',
  checked_out: '已租出',
  overdue: '超时未还',
  return_pending: '待归还',
  inspecting: '验收中',
  damage_assessing: '损坏判定中',
  repairing: '维修中',
  repair_reviewing: '维修复检中',
  settling: '结算中',
  disputed: '争议中',
  completed: '已完成',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  checkout_pending: 'bg-gray-100 text-gray-700',
  checked_out: 'bg-blue-100 text-blue-700',
  overdue: 'bg-red-100 text-red-700',
  return_pending: 'bg-amber-100 text-amber-700',
  inspecting: 'bg-indigo-100 text-indigo-700',
  damage_assessing: 'bg-orange-100 text-orange-700',
  repairing: 'bg-purple-100 text-purple-700',
  repair_reviewing: 'bg-violet-100 text-violet-700',
  settling: 'bg-cyan-100 text-cyan-700',
  disputed: 'bg-rose-100 text-rose-700',
  completed: 'bg-emerald-100 text-emerald-700',
}

export const ORDER_STATUS_DOT_COLORS: Record<OrderStatus, string> = {
  checkout_pending: 'bg-gray-400',
  checked_out: 'bg-blue-500',
  overdue: 'bg-red-500',
  return_pending: 'bg-amber-500',
  inspecting: 'bg-indigo-500',
  damage_assessing: 'bg-orange-500',
  repairing: 'bg-purple-500',
  repair_reviewing: 'bg-violet-500',
  settling: 'bg-cyan-500',
  disputed: 'bg-rose-500',
  completed: 'bg-emerald-500',
}

export type DamageLevel = 'none' | 'minor' | 'moderate' | 'severe'

export const DAMAGE_LEVEL_LABELS: Record<DamageLevel, string> = {
  none: '无损坏',
  minor: '轻微',
  moderate: '中度',
  severe: '严重',
}

export type LiabilityParty = 'customer' | 'natural_wear' | 'quality_issue' | 'undetermined'

export const LIABILITY_PARTY_LABELS: Record<LiabilityParty, string> = {
  customer: '客户责任',
  natural_wear: '自然损耗',
  quality_issue: '质量问题',
  undetermined: '待判定',
}

export type RepairTaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'returned'

export const REPAIR_STATUS_LABELS: Record<RepairTaskStatus, string> = {
  pending: '待接单',
  in_progress: '维修中',
  review: '待复检',
  completed: '已完成',
  returned: '已退回',
}

export type DeductionType = 'rental' | 'damage' | 'repair' | 'overdue' | 'other'

export const DEDUCTION_TYPE_LABELS: Record<DeductionType, string> = {
  rental: '租金',
  damage: '损坏赔偿',
  repair: '维修费',
  overdue: '超时费',
  other: '其他',
}

export type SettlementStatus = 'pending' | 'approved' | 'disputed' | 'completed'

export type InstrumentType = 'violin' | 'cello' | 'guitar' | 'piano' | 'flute' | 'erhu' | 'drum' | 'saxophone'

export const INSTRUMENT_TYPE_LABELS: Record<InstrumentType, string> = {
  violin: '小提琴',
  cello: '大提琴',
  guitar: '吉他',
  piano: '钢琴',
  flute: '长笛',
  erhu: '二胡',
  drum: '架子鼓',
  saxophone: '萨克斯',
}

export type CustomerType = 'individual' | 'school' | 'organization'

export interface Instrument {
  id: string
  name: string
  type: InstrumentType
  brand: string
  status: 'available' | 'rented' | 'repairing' | 'retired'
  imageUrl: string
  dailyRate: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  type: CustomerType
  schoolName?: string
}

export interface OrderLog {
  id: string
  orderId: string
  action: string
  operator: string
  operatorRole: UserRole
  operatedAt: string
  note?: string
}

export interface ReturnInspection {
  id: string
  orderId: string
  inspectedBy: string
  inspectedAt: string
  hasDamage: boolean
  damageLevel: DamageLevel
  damageDescription?: string
  damagePhotos: string[]
  liabilityParty: LiabilityParty
  isDisputed: boolean
}

export interface RepairLog {
  id: string
  repairTaskId: string
  action: string
  operator: string
  operatedAt: string
  note?: string
}

export interface RepairTask {
  id: string
  orderId: string
  assignedTo: string
  status: RepairTaskStatus
  damageCause: string
  liabilityParty: LiabilityParty
  estimatedCost: number
  actualCost?: number
  startedAt?: string
  completedAt?: string
  returnedForRework: boolean
  returnReason?: string
  logs: RepairLog[]
}

export interface DeductionItem {
  id: string
  settlementId: string
  type: DeductionType
  amount: number
  description: string
  isDisputed: boolean
}

export interface DepositSettlement {
  id: string
  orderId: string
  originalAmount: number
  totalDeduction: number
  refundAmount: number
  status: SettlementStatus
  approvedBy?: string
  settledAt?: string
  deductions: DeductionItem[]
}

export interface Order {
  id: string
  orderNo: string
  instrumentId: string
  customerId: string
  status: OrderStatus
  checkoutBy: string
  checkoutAt: string
  expectedReturnAt: string
  actualReturnAt?: string
  depositAmount: number
  rentalFee: number
  schoolCooperation: boolean
  schoolPaymentSchedule?: SchoolPaymentSchedule[]
  checkoutPhotos: string[]
  logs: OrderLog[]
  returnInspection?: ReturnInspection
  repairTask?: RepairTask
  depositSettlement?: DepositSettlement
}

export interface SchoolPaymentSchedule {
  installment: number
  amount: number
  dueDate: string
  paidAt?: string
  status: 'pending' | 'paid' | 'overdue'
}

export interface Alert {
  id: string
  type: 'overdue' | 'damage_dispute' | 'repair_returned' | 'deposit_dispute' | 'school_payment_overdue'
  orderId: string
  orderNo: string
  message: string
  severity: 'high' | 'medium' | 'low'
  createdAt: string
  dismissed: boolean
}

export const ROLE_NAV_ITEMS: Record<UserRole, Array<{ path: string; label: string; icon: string }>> = {
  boss: [
    { path: '/dashboard', label: '工作台', icon: 'LayoutDashboard' },
    { path: '/orders', label: '订单链路', icon: 'GitBranch' },
    { path: '/checkout', label: '租出办理', icon: 'LogOut' },
    { path: '/return', label: '归还验收', icon: 'LogIn' },
    { path: '/repair', label: '维修管理', icon: 'Wrench' },
    { path: '/deposit', label: '押金结算', icon: 'Wallet' },
  ],
  consultant: [
    { path: '/dashboard', label: '工作台', icon: 'LayoutDashboard' },
    { path: '/orders', label: '订单链路', icon: 'GitBranch' },
    { path: '/checkout', label: '租出办理', icon: 'LogOut' },
    { path: '/return', label: '归还验收', icon: 'LogIn' },
  ],
  repair: [
    { path: '/dashboard', label: '工作台', icon: 'LayoutDashboard' },
    { path: '/orders', label: '订单链路', icon: 'GitBranch' },
    { path: '/repair', label: '维修管理', icon: 'Wrench' },
  ],
}
