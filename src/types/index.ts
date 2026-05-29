export interface User {
  id: number
  username: string
  role: 'factory' | 'inspector' | 'store'
  name: string
}

export interface Batch {
  id: number
  batch_no: string
  store_id: number
  store_name: string
  total_count: number
  status: string
  received_at: string
  received_by?: number
  returned_at?: string
  returned_by?: number
  return_signature?: string
}

export interface Clothes {
  id: number
  clothes_no: string
  batch_id?: number
  customer_name?: string
  customer_phone?: string
  category: string
  brand?: string
  color?: string
  size?: string
  price?: number
  services?: string
  status: string
  has_damage: number
  washing_finished_at?: string
  returned_at?: string
  created_at: string
  batch_no?: string
  store_name?: string
}

export interface DamageRecord {
  id: number
  clothes_id: number
  damage_type: string
  description?: string
  severity: 'minor' | 'major' | 'critical'
  evidence_photos?: string
  reported_by: number
  status: string
  dispute_note?: string
  resolved_by?: number
  resolved_at?: string
  compensation_amount?: number
  created_at: string
  clothes_no?: string
  category?: string
  customer_name?: string
  reporter_name?: string
}

export interface OperationLog {
  id: number
  clothes_id?: number
  batch_id?: number
  operation: string
  operator_id: number
  operator_name: string
  note?: string
  created_at: string
}

export interface ReturnOrder {
  id: number
  return_no: string
  batch_id: number
  store_id: number
  store_name: string
  total_count: number
  signed_count: number
  status: string
  sent_at?: string
  sent_by?: number
  signed_at?: string
  signed_by?: number
  signature?: string
  remark?: string
  created_at: string
  batch_no?: string
  batch_total?: number
  items?: ReturnOrderItem[]
}

export interface ReturnOrderItem {
  id: number
  return_order_id: number
  clothes_id: number
  clothes_no: string
  status: string
  signed_at?: string
  signed_by?: number
  damage_found: number
  damage_note?: string
  created_at: string
  customer_name?: string
  category?: string
  clothes_status?: string
}

export const RETURN_ORDER_STATUS = {
  pending: '待发出',
  sent: '已发出待签收',
  completed: '已完成'
}

export const RETURN_ITEM_STATUS = {
  pending: '待签收',
  signed: '已签收'
}

export const CLOTHES_STATUS = {
  received: '已收件',
  sorting: '分拣中',
  sorted: '已分拣',
  damage_reported: '污损待确认',
  washing: '洗涤中',
  washed: '已洗涤',
  returning: '待返回',
  returned: '已返回门店',
  return_to_store: '退回门店'
}

export const DAMAGE_STATUS = {
  pending: '待处理',
  confirmed: '已确认洗涤',
  rejected: '退回门店'
}

export const ROLE_NAMES = {
  factory: '厂长',
  inspector: '质检员',
  store: '门店'
}

export const DAMAGE_TYPES = [
  '衣物破损',
  '污渍严重',
  '褪色',
  '变形',
  '配件缺失',
  '其他'
]

export const CLOTHES_CATEGORIES = [
  '衬衫',
  'T恤',
  '外套',
  '西装',
  '大衣',
  '羽绒服',
  '裤子',
  '裙子',
  '毛衣',
  '内衣',
  '其他'
]
