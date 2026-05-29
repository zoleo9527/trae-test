import api from './index'

export const login = (username, password) => {
  return api.post('/login/', { username, password })
}

export const getCurrentUser = () => {
  return api.get('/user/')
}

export const getSalesList = () => {
  return api.get('/user/sales_list/')
}

export const getDashboardStats = () => {
  return api.get('/dashboard/')
}

export const getOrderTrend = (days = 7) => {
  return api.get(`/dashboard/order_trend/?days=${days}`)
}

export const getOverdueByCustomer = () => {
  return api.get('/dashboard/overdue_by_customer/')
}

export const getSalesPerformance = () => {
  return api.get('/dashboard/sales_performance/')
}

export const getCustomers = (params) => {
  return api.get('/customers/', { params })
}

export const getCustomer = (id) => {
  return api.get(`/customers/${id}/`)
}

export const createCustomer = (data) => {
  return api.post('/customers/', data)
}

export const updateCustomer = (id, data) => {
  return api.put(`/customers/${id}/`, data)
}

export const getParts = (params) => {
  return api.get('/parts/', { params })
}

export const getPart = (id) => {
  return api.get(`/parts/${id}/`)
}

export const getOrders = (params) => {
  return api.get('/orders/', { params })
}

export const getOrder = (id) => {
  return api.get(`/orders/${id}/`)
}

export const createInquiry = (data) => {
  return api.post('/orders/create_inquiry/', data)
}

export const approveInquiry = (id, remark) => {
  return api.post(`/orders/${id}/approve_inquiry/`, { remark })
}

export const lockStock = (id, remark) => {
  return api.post(`/orders/${id}/lock_stock/`, { remark })
}

export const deliverOrder = (id, remark) => {
  return api.post(`/orders/${id}/deliver/`, { remark })
}

export const settleOrder = (id, remark) => {
  return api.post(`/orders/${id}/settle/`, { remark })
}

export const requestReturn = (id, data) => {
  return api.post(`/orders/${id}/request_return/`, data)
}

export const approveReturn = (id, remark) => {
  return api.post(`/orders/${id}/approve_return/`, { remark })
}

export const rejectReturn = (id, remark) => {
  return api.post(`/orders/${id}/reject_return/`, { remark })
}

export const addOrderRemark = (id, data) => {
  return api.post(`/orders/${id}/add_remark/`, data)
}

export const getPayments = (params) => {
  return api.get('/payments/', { params })
}

export const createPayment = (data) => {
  return api.post('/payments/', data)
}

export const confirmPayment = (id, remark) => {
  return api.post(`/payments/${id}/confirm/`, { remark })
}

export const rejectPayment = (id, remark) => {
  return api.post(`/payments/${id}/reject/`, { remark })
}

export const getReminders = (params) => {
  return api.get('/reminders/', { params })
}

export const getReminder = (id) => {
  return api.get(`/reminders/${id}/`)
}

export const createReminder = (data) => {
  return api.post('/reminders/', data)
}

export const startReminder = (id) => {
  return api.post(`/reminders/${id}/start/`)
}

export const completeReminder = (id, result) => {
  return api.post(`/reminders/${id}/complete/`, { result })
}

export const cancelReminder = (id) => {
  return api.post(`/reminders/${id}/cancel/`)
}

export const addReminderRemark = (id, content) => {
  return api.post(`/reminders/${id}/add_remark/`, { content })
}
