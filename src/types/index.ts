export enum UserRole {
  STORE_MANAGER = 'store_manager',
  PLANNER = 'planner',
  WAREHOUSE = 'warehouse'
}

export const RoleLabels: Record<UserRole, string> = {
  [UserRole.STORE_MANAGER]: '店长',
  [UserRole.PLANNER]: '企划专员',
  [UserRole.WAREHOUSE]: '仓管'
}

export interface User {
  id: string
  name: string
  role: UserRole
  storeId?: string
  avatar?: string
}

export interface Member {
  id: string
  name: string
  phone: string
  level: '普通' | '银卡' | '金卡' | '钻石'
  totalPoints: number
  availablePoints: number
  frozenPoints: number
  registerDate: string
  lastConsumeDate: string
  storeId: string
}

export interface PointsRecord {
  id: string
  memberId: string
  memberName: string
  type: 'earn' | 'spend' | 'expire' | 'adjust'
  amount: number
  balance: number
  source: 'purchase' | 'exchange' | 'activity' | 'adjust' | 'expire'
  orderNo?: string
  remark: string
  operatorId: string
  operatorName: string
  storeId: string
  createTime: string
}

export enum ProductStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ON_SHELF = 'on_shelf',
  OFF_SHELF = 'off_shelf',
  SYNCING = 'syncing'
}

export const ProductStatusLabels: Record<ProductStatus, string> = {
  [ProductStatus.DRAFT]: '草稿',
  [ProductStatus.PENDING]: '待上架',
  [ProductStatus.ON_SHELF]: '已上架',
  [ProductStatus.OFF_SHELF]: '已下架',
  [ProductStatus.SYNCING]: '同步中'
}

export interface Product {
  id: string
  name: string
  code: string
  category: string
  pointsRequired: number
  stock: number
  lockedStock: number
  availableStock: number
  isCoBranded: boolean
  coBrandPartner?: string
  status: ProductStatus
  syncStatus?: 'synced' | 'pending' | 'failed'
  lastSyncTime?: string
  imageUrl: string
  description: string
  createTime: string
  updateTime: string
}

export enum ExchangeOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  VERIFIED = 'verified',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export const ExchangeOrderStatusLabels: Record<ExchangeOrderStatus, string> = {
  [ExchangeOrderStatus.PENDING]: '待确认',
  [ExchangeOrderStatus.CONFIRMED]: '已确认',
  [ExchangeOrderStatus.SHIPPED]: '已发货',
  [ExchangeOrderStatus.DELIVERED]: '已送达',
  [ExchangeOrderStatus.VERIFIED]: '已核销',
  [ExchangeOrderStatus.CANCELLED]: '已取消',
  [ExchangeOrderStatus.EXPIRED]: '已过期'
}

export interface ExchangeOrder {
  id: string
  orderNo: string
  memberId: string
  memberName: string
  memberPhone: string
  productId: string
  productName: string
  productImage: string
  pointsRequired: number
  quantity: number
  totalPoints: number
  status: ExchangeOrderStatus
  storeId: string
  storeName: string
  applyTime: string
  confirmTime?: string
  confirmBy?: string
  shipTime?: string
  shipBy?: string
  deliverTime?: string
  verifyTime?: string
  verifyBy?: string
  verifyCode?: string
  cancelTime?: string
  cancelBy?: string
  cancelReason?: string
  remark?: string
  currentHandler: UserRole
  isAbnormal: boolean
  abnormalType?: 'stock_mismatch' | 'sync_failed' | 'timeout'
  abnormalRemark?: string
}

export interface InventoryLog {
  id: string
  productId: string
  productName: string
  type: 'in' | 'out' | 'adjust' | 'lock' | 'unlock'
  quantity: number
  beforeStock: number
  afterStock: number
  relatedOrderNo?: string
  remark: string
  operatorId: string
  operatorName: string
  storeId: string
  createTime: string
}

export interface Store {
  id: string
  name: string
  address: string
  managerName: string
  managerPhone: string
}

export interface InspectionIssue {
  id: string
  storeId: string
  storeName: string
  type: 'stock' | 'display' | 'service' | 'other'
  title: string
  description: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  reporterId: string
  reporterName: string
  handlerId?: string
  handlerName?: string
  createTime: string
  resolveTime?: string
  closeTime?: string
  remark?: string
}

export interface DashboardStats {
  totalMembers: number
  totalPoints: number
  todayExchanges: number
  pendingOrders: number
  abnormalOrders: number
  stockWarnings: number
}

export interface RelayNode {
  id: string
  name: string
  role: UserRole
  status: 'pending' | 'current' | 'completed'
  time?: string
  operator?: string
}

export const BusinessFlow: RelayNode[] = [
  { id: 'apply', name: '会员申请兑换', role: UserRole.STORE_MANAGER, status: 'pending' },
  { id: 'confirm', name: '店长确认订单', role: UserRole.STORE_MANAGER, status: 'pending' },
  { id: 'allocate', name: '仓管配货发货', role: UserRole.WAREHOUSE, status: 'pending' },
  { id: 'receive', name: '门店收货确认', role: UserRole.STORE_MANAGER, status: 'pending' },
  { id: 'verify', name: '到店核销完成', role: UserRole.STORE_MANAGER, status: 'pending' }
]
