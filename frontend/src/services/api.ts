import axios from 'axios'
import type {
  Customer,
  Order,
  Payment,
  PaymentReminder,
  OrderException,
  OperationLog,
  DashboardStats
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats').then(res => res.data)
}

export const customerApi = {
  getAll: (params?: { type?: string; status?: string }) =>
    api.get<Customer[]>('/customers', { params }).then(res => res.data),
  getById: (id: number) => api.get<Customer>(`/customers/${id}`).then(res => res.data),
  create: (data: Partial<Customer>) => api.post<Customer>('/customers', data).then(res => res.data),
  update: (id: number, data: Partial<Customer>) =>
    api.put<Customer>(`/customers/${id}`, data).then(res => res.data)
}

export const orderApi = {
  getAll: (params?: { status?: string; customer_id?: number }) =>
    api.get<Order[]>('/orders', { params }).then(res => res.data),
  getById: (id: number) => api.get<Order>(`/orders/${id}`).then(res => res.data),
  create: (data: Partial<Order>) => api.post<Order>('/orders', data).then(res => res.data),
  update: (id: number, data: Partial<Order>) =>
    api.put<Order>(`/orders/${id}`, data).then(res => res.data)
}

export const paymentApi = {
  getAll: (params?: { customer_id?: number }) =>
    api.get<Payment[]>('/payments', { params }).then(res => res.data),
  create: (data: Partial<Payment>) => api.post<Payment>('/payments', data).then(res => res.data)
}

export const reminderApi = {
  getAll: (params?: { status?: string; customer_id?: number }) =>
    api.get<PaymentReminder[]>('/payment-reminders', { params }).then(res => res.data),
  create: (data: Partial<PaymentReminder>) =>
    api.post<PaymentReminder>('/payment-reminders', data).then(res => res.data),
  update: (id: number, data: Partial<PaymentReminder>) =>
    api.put<PaymentReminder>(`/payment-reminders/${id}`, data).then(res => res.data)
}

export const exceptionApi = {
  getAll: (params?: { status?: string; type?: string }) =>
    api.get<OrderException[]>('/exceptions', { params }).then(res => res.data),
  create: (data: Partial<OrderException>) =>
    api.post<OrderException>('/exceptions', data).then(res => res.data),
  update: (id: number, data: Partial<OrderException>) =>
    api.put<OrderException>(`/exceptions/${id}`, data).then(res => res.data)
}

export const logApi = {
  getAll: (params?: { order_id?: number; customer_id?: number }) =>
    api.get<OperationLog[]>('/logs', { params }).then(res => res.data)
}
