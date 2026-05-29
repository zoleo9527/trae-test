export interface DashboardStats {
  pending_appeals: number
  rejected_appeals: number
  need_review: number
  abnormal_orders: number
  pending_settlements: number
  total_subsidy: number
}

export interface Merchant {
  id: string
  name: string
  phone: string
  address: string
  rating: number
  total_orders: number
  balance: number
}

export interface Order {
  id: string
  merchant_id: string
  merchant_name: string
  order_no: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  goods_desc: string
  goods_amount: number
  delivery_fee: number
  total_amount: number
  status: string
  created_at: string
  expected_delivery_time: string
  actual_delivery_time?: string
  is_abnormal: boolean
  abnormal_reason?: string
  abnormal_time?: string
}

export interface Appeal {
  id: string
  order_id: string
  order_no: string
  merchant_id: string
  merchant_name: string
  type: string
  reason: string
  description: string
  screenshot_urls: string[]
  status: string
  created_at: string
  processed_at?: string
  processor?: string
  process_note?: string
  subsidy_amount?: number
}

export interface Subsidy {
  id: string
  order_id: string
  order_no: string
  merchant_id: string
  merchant_name: string
  appeal_id?: string
  type: string
  amount: number
  reason: string
  description: string
  created_at: string
  created_by: string
  is_settled: boolean
  settled_at?: string
}

export interface Settlement {
  id: string
  merchant_id: string
  merchant_name: string
  period_start: string
  period_end: string
  total_orders: number
  total_goods_amount: number
  total_delivery_fee: number
  total_subsidy: number
  total_deduction: number
  net_amount: number
  status: string
  created_at: string
  settled_at?: string
}

export interface OperationLog {
  id: string
  order_id?: string
  appeal_id?: string
  action: string
  operator: string
  operator_role: string
  description: string
  old_value?: string
  new_value?: string
  created_at: string
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  page_size: number
  data: T[]
}

export type AppealStatus = 'pending' | 'approved' | 'rejected' | 'need_review'
