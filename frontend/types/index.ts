export interface Customer {
  id: string
  name: string
  contact: string
  phone: string
  address: string
  water_type: string
  price_per_bucket: number
  deposit_buckets: number
  total_buckets_delivered: number
  total_buckets_returned: number
  outstanding_buckets: number
}

export interface Order {
  id: string
  customer_id: string
  customer_name: string
  order_date: string
  water_type: string
  quantity: number
  price_per_bucket: number
  total_amount: number
  status: 'pending' | 'delivered' | 'exception'
  delivery_route_id: string | null
  delivery_sequence: number | null
  note: string | null
  created_at: string
  signed_photo_url: string | null
  delivered_quantity: number
  returned_empty_buckets: number
  actual_delivered_at: string | null
  recipient_signature: string | null
}

export interface Route {
  id: string
  name: string
  driver_id: string
  driver_name: string
  date: string
  status: 'pending' | 'in_progress' | 'completed'
  total_orders: number
  delivered_orders: number
  pending_orders: number
  exception_orders: number
  total_buckets: number
  delivered_buckets: number
  returned_buckets: number
  start_time: string | null
  end_time: string | null
  vehicle_no: string
  estimated_return_time: string | null
  orders?: Order[]
}

export interface ExceptionReport {
  id: string
  order_id: string
  route_id: string
  type: string
  title: string
  description: string
  reported_by: string
  reported_at: string
  status: 'pending' | 'resolved'
  handled_by: string | null
  handled_at: string | null
  resolution: string | null
  photos: string[]
}

export interface BucketTransaction {
  id: string
  customer_id: string
  customer_name: string
  order_id: string | null
  type: 'delivery' | 'return'
  buckets_change: number
  balance_before: number
  balance_after: number
  operator: string
  created_at: string
  note: string | null
}

export interface DashboardStats {
  today_routes: number
  in_progress_routes: number
  today_orders: number
  delivered_orders: number
  pending_orders: number
  exception_orders: number
  total_buckets_delivered: number
  total_buckets_returned: number
  pending_exceptions: number
}

export const STATUS_LABELS: Record<string, string> = {
  pending: '待配送',
  delivered: '已签收',
  exception: '异常',
  in_progress: '进行中',
  completed: '已完成'
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  delivered: 'success',
  exception: 'danger',
  in_progress: 'info',
  completed: 'success'
}

export const EXCEPTION_TYPES: Record<string, string> = {
  shortage: '送水不足',
  bucket_dispute: '空桶争议',
  customer_absent: '客户不在',
  damaged: '桶身损坏',
  address_error: '地址错误',
  other: '其他'
}
