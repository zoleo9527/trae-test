export interface Customer {
  id: number
  name: string
  phone: string
  address?: string
  type: string
  price_per_bucket: number
  balance_buckets: number
  credit_limit: number
  current_debt: number
  status: string
  created_at: string
  updated_at?: string
}

export interface Order {
  id: number
  customer_id: number
  order_no: string
  buckets_delivered: number
  buckets_returned: number
  delivery_route?: string
  delivery_person?: string
  sign_photo_url?: string
  sign_by?: string
  sign_time?: string
  status: string
  delivery_date?: string
  remark?: string
  created_at: string
  updated_at?: string
  customer?: Customer
}

export interface Payment {
  id: number
  customer_id: number
  amount: number
  payment_method: string
  payment_date?: string
  remark?: string
  operator?: string
  created_at: string
}

export interface PaymentReminder {
  id: number
  customer_id: number
  amount_due: number
  due_date: string
  status: string
  reminder_count: number
  last_reminder_time?: string
  remark?: string
  created_at: string
  updated_at?: string
  customer?: Customer
}

export interface OrderException {
  id: number
  order_id: number
  type: string
  description: string
  status: string
  reported_by?: string
  handled_by?: string
  handled_at?: string
  handle_result?: string
  created_at: string
}

export interface OperationLog {
  id: number
  order_id?: number
  customer_id?: number
  operator: string
  action: string
  old_value?: string
  new_value?: string
  ip_address?: string
  created_at: string
}

export interface DashboardStats {
  pending_orders: number
  rejected_orders: number
  review_needed: number
  pending_exceptions: number
  pending_reminders: number
  total_customers: number
  today_deliveries: number
  monthly_revenue: number
}
