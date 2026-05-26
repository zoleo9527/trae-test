const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getUsers: () => apiFetch<User[]>('/auth/users'),

  getOrders: (params?: { page?: number; page_size?: number; status?: string; keyword?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.page_size) qs.set('page_size', String(params.page_size))
    if (params?.status) qs.set('status', params.status)
    if (params?.keyword) qs.set('keyword', params.keyword)
    return apiFetch<{ total: number; orders: Order[]; page: number; page_size: number }>(`/orders?${qs}`)
  },

  getOrderStats: () => apiFetch<OrderStats>('/orders/stats'),

  getOrder: (id: number) => apiFetch<Order>(`/orders/${id}`),

  createOrder: (data: any) =>
    apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  updateOrder: (id: number, data: any) =>
    apiFetch<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteOrder: (id: number) =>
    apiFetch(`/orders/${id}`, { method: 'DELETE' }),

  addItem: (orderId: number, data: any) =>
    apiFetch<OrderItem>(`/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify(data) }),

  updateItem: (orderId: number, itemId: number, data: any) =>
    apiFetch<OrderItem>(`/orders/${orderId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteItem: (orderId: number, itemId: number) =>
    apiFetch(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' }),

  getConfigs: (orderId: number) =>
    apiFetch<OrderConfig[]>(`/orders/${orderId}/configs`),

  addConfig: (orderId: number, data: any) =>
    apiFetch<OrderConfig>(`/orders/${orderId}/configs`, { method: 'POST', body: JSON.stringify(data) }),

  updateConfig: (orderId: number, configId: number, data: any) =>
    apiFetch<OrderConfig>(`/orders/${orderId}/configs/${configId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteConfig: (orderId: number, configId: number) =>
    apiFetch(`/orders/${orderId}/configs/${configId}`, { method: 'DELETE' }),

  getArrivals: (orderId: number) =>
    apiFetch<Arrival[]>(`/orders/${orderId}/arrivals`),

  addArrival: (orderId: number, data: any) =>
    apiFetch<Arrival>(`/orders/${orderId}/arrivals`, { method: 'POST', body: JSON.stringify(data) }),

  updateArrival: (orderId: number, arrivalId: number, data: any) =>
    apiFetch<Arrival>(`/orders/${orderId}/arrivals/${arrivalId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteArrival: (orderId: number, arrivalId: number) =>
    apiFetch(`/orders/${orderId}/arrivals/${arrivalId}`, { method: 'DELETE' }),

  getInstallations: (orderId: number) =>
    apiFetch<Installation[]>(`/orders/${orderId}/installations`),

  addInstallation: (orderId: number, data: any) =>
    apiFetch<Installation>(`/orders/${orderId}/installations`, { method: 'POST', body: JSON.stringify(data) }),

  updateInstallation: (orderId: number, instId: number, data: any) =>
    apiFetch<Installation>(`/orders/${orderId}/installations/${instId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteInstallation: (orderId: number, instId: number) =>
    apiFetch(`/orders/${orderId}/installations/${instId}`, { method: 'DELETE' }),

  getSamples: (orderId: number) =>
    apiFetch<SampleLending[]>(`/orders/${orderId}/samples`),

  addSample: (orderId: number, data: any) =>
    apiFetch<SampleLending>(`/orders/${orderId}/samples`, { method: 'POST', body: JSON.stringify(data) }),

  updateSample: (orderId: number, sampleId: number, data: any) =>
    apiFetch<SampleLending>(`/orders/${orderId}/samples/${sampleId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteSample: (orderId: number, sampleId: number) =>
    apiFetch(`/orders/${orderId}/samples/${sampleId}`, { method: 'DELETE' }),

  getReplacements: (orderId: number) =>
    apiFetch<ReplacementPart[]>(`/orders/${orderId}/replacements`),

  addReplacement: (orderId: number, data: any) =>
    apiFetch<ReplacementPart>(`/orders/${orderId}/replacements`, { method: 'POST', body: JSON.stringify(data) }),

  updateReplacement: (orderId: number, repId: number, data: any) =>
    apiFetch<ReplacementPart>(`/orders/${orderId}/replacements/${repId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteReplacement: (orderId: number, repId: number) =>
    apiFetch(`/orders/${orderId}/replacements/${repId}`, { method: 'DELETE' }),

  getAfterSales: (orderId: number) =>
    apiFetch<any>(`/orders/${orderId}/after-sales`),

  raiseAfterSales: (orderId: number) =>
    apiFetch(`/orders/${orderId}/after-sales/raise`, { method: 'POST' }),
}

export interface User {
  id: number
  username: string
  role: string
  display_name: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_name: string
  product_code: string
  quantity: number
  unit_price: number
  subtotal: number
  status: string
  remarks: string | null
}

export interface OrderConfig {
  id: number
  order_id: number
  item_id: number | null
  config_type: string
  config_key: string
  config_value: string
  config_description: string | null
  confirmed: boolean
  confirmed_at: string | null
}

export interface Arrival {
  id: number
  order_id: number
  item_id: number | null
  arrival_date: string
  quantity: number
  tracking_no: string | null
  status: string
  received_by: number | null
  warehouse_location: string | null
  remarks: string | null
  is_partial: boolean
  damaged_qty: number
  missing_qty: number
}

export interface Installation {
  id: number
  order_id: number
  item_id: number | null
  scheduled_date: string
  installer: string
  contact_name: string
  contact_phone: string
  status: string
  actual_start_date: string | null
  actual_end_date: string | null
  reschedule_count: number
  problem_description: string | null
  remarks: string | null
}

export interface SampleLending {
  id: number
  order_id: number
  sample_name: string
  sample_code: string | null
  lent_to: string
  lent_date: string
  due_date: string
  returned_date: string | null
  status: string
  condition: string | null
  remarks: string | null
}

export interface ReplacementPart {
  id: number
  order_id: number
  item_id: number | null
  part_name: string
  part_code: string | null
  quantity: number
  reason: string
  status: string
  requested_date: string
  ordered_date: string | null
  arrived_date: string | null
  installed_date: string | null
  confirmed_date: string | null
  remarks: string | null
}

export interface OrderTimeline {
  id: number
  order_id: number
  event_type: string
  event_description: string
  event_time: string
  operator_name: string | null
  metadata_json: string | null
}

export interface Order {
  id: number
  order_no: string
  customer_name: string
  customer_phone: string
  customer_address: string
  total_amount: number
  deposit_amount: number
  status: string
  sales_consultant_id: number | null
  showroom_manager_id: number | null
  expected_delivery_date: string | null
  created_at: string
  updated_at: string
  remarks: string | null
  items: OrderItem[]
  configs: OrderConfig[]
  arrivals: Arrival[]
  installations: Installation[]
  sample_lendings: SampleLending[]
  replacement_parts: ReplacementPart[]
  timeline: OrderTimeline[]
}

export interface OrderStats {
  total: number
  by_status: Record<string, number>
  total_amount: number
  pending: number
  after_sales: number
  installing: number
  arrived: number
}