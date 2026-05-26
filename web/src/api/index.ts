import request from './request'

export const orderApi = {
  getList: (params?: any) => request.get('/orders', { params }),
  getDetail: (id: number) => request.get(`/orders/${id}`),
  getByOrderNo: (orderNo: string) => request.get(`/orders/order-no/${orderNo}`),
  getStats: () => request.get('/orders/dashboard/stats'),
  getActivityLogs: (id: number) => request.get(`/orders/${id}/activity-logs`),
  create: (data: any) => request.post('/orders', data),
  update: (id: number, data: any) => request.put(`/orders/${id}`, data),
  updateStatus: (id: number, data: any) => request.put(`/orders/${id}/status`, data),
  delete: (id: number) => request.delete(`/orders/${id}`)
}

export const installationApi = {
  getList: (params?: any) => request.get('/installations', { params }),
  getCalendar: (params: any) => request.get('/installations/calendar/view', { params }),
  getDetail: (id: number) => request.get(`/installations/${id}`),
  getByOrderId: (orderId: number) => request.get(`/installations/order/${orderId}`),
  create: (data: any) => request.post('/installations', data),
  update: (id: number, data: any) => request.put(`/installations/${id}`, data),
  reschedule: (id: number, data: any) => request.put(`/installations/${id}/reschedule`, data),
  start: (id: number) => request.put(`/installations/${id}/start`),
  complete: (id: number) => request.put(`/installations/${id}/complete`),
  delete: (id: number) => request.delete(`/installations/${id}`)
}

export const acceptanceApi = {
  getList: (params?: any) => request.get('/acceptances', { params }),
  getDetail: (id: number) => request.get(`/acceptances/${id}`),
  getByOrderId: (orderId: number) => request.get(`/acceptances/order/${orderId}`),
  create: (data: any) => request.post('/acceptances', data),
  update: (id: number, data: any) => request.put(`/acceptances/${id}`, data),
  submit: (id: number, data: any) => request.put(`/acceptances/${id}/submit`, data),
  rectify: (id: number, data: any) => request.put(`/acceptances/${id}/rectify`, data),
  delete: (id: number) => request.delete(`/acceptances/${id}`)
}

export const exceptionApi = {
  getList: (params?: any) => request.get('/exceptions', { params }),
  getDetail: (id: number) => request.get(`/exceptions/${id}`),
  getByOrderId: (orderId: number) => request.get(`/exceptions/order/${orderId}`),
  create: (data: any) => request.post('/exceptions', data),
  update: (id: number, data: any) => request.put(`/exceptions/${id}`, data),
  updateRepairPartStatus: (repairPartId: number, status: string) => 
    request.put(`/exceptions/repair-parts/${repairPartId}/status`, { status }),
  delete: (id: number) => request.delete(`/exceptions/${id}`)
}

export const sampleApi = {
  getList: (params?: any) => request.get('/samples', { params }),
  getOverdue: () => request.get('/samples/overdue/list'),
  getDetail: (id: number) => request.get(`/samples/${id}`),
  create: (data: any) => request.post('/samples', data),
  update: (id: number, data: any) => request.put(`/samples/${id}`, data),
  remind: (id: number, message?: string) => request.put(`/samples/${id}/remind`, { message }),
  delete: (id: number) => request.delete(`/samples/${id}`)
}

export const customerApi = {
  getList: (params?: any) => request.get('/customers', { params }),
  getDetail: (id: number) => request.get(`/customers/${id}`),
  create: (data: any) => request.post('/customers', data),
  update: (id: number, data: any) => request.put(`/customers/${id}`, data),
  delete: (id: number) => request.delete(`/customers/${id}`)
}

export const notificationApi = {
  getList: (params?: any) => request.get('/notifications', { params }),
  getUnreadCount: (params?: any) => request.get('/notifications/unread/count', { params }),
  getWorkbenchTasks: (role: string) => request.get(`/notifications/workbench/tasks?role=${role}`),
  markAsRead: (id: number) => request.put(`/notifications/${id}/read`),
  markAllAsRead: (params?: any) => request.put('/notifications/read/all', params),
  create: (data: any) => request.post('/notifications', data)
}

export const productApi = {
  getList: (params?: any) => request.get('/products', { params }),
  getDetail: (id: number) => request.get(`/products/${id}`),
  create: (data: any) => request.post('/products', data),
  update: (id: number, data: any) => request.put(`/products/${id}`, data),
  delete: (id: number) => request.delete(`/products/${id}`)
}
