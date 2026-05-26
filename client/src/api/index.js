import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const dashboardApi = {
  getStats: () => request.get('/dashboard/stats'),
}

export const repairApi = {
  list: (params) => request.get('/repairs', { params }),
  get: (id) => request.get(`/repairs/${id}`),
  create: (data) => request.post('/repairs', data),
  update: (id, data) => request.put(`/repairs/${id}`, data),
  delete: (id) => request.delete(`/repairs/${id}`),
  batchUpdate: (data) => request.post('/repairs/batch-update', data),
  updateStatus: (id, status, changedBy, reason) =>
    request.post(`/repairs/${id}/status`, null, { params: { new_status: status, changed_by: changedBy, reason } }),
  getHistory: (id) => request.get(`/repairs/${id}/history`),
  getSimpleList: () => request.get('/repairs/simple/list'),
}

export const visitApi = {
  list: (params) => request.get('/visits', { params }),
  get: (id) => request.get(`/visits/${id}`),
  create: (data) => request.post('/visits', data),
  update: (id, data) => request.put(`/visits/${id}`, data),
  batchUpdate: (data) => request.post('/visits/batch-update', data),
}

export const lensTransferApi = {
  list: (params) => request.get('/lens-transfers', { params }),
  get: (id) => request.get(`/lens-transfers/${id}`),
  create: (data) => request.post('/lens-transfers', data),
  update: (id, data) => request.put(`/lens-transfers/${id}`, data),
}

export const refundApi = {
  list: (params) => request.get('/refunds', { params }),
  get: (id) => request.get(`/refunds/${id}`),
  create: (data) => request.post('/refunds', data),
  update: (id, data) => request.put(`/refunds/${id}`, data),
}

export const optometryApi = {
  list: (params) => request.get('/optometry', { params }),
  get: (id) => request.get(`/optometry/${id}`),
  create: (data) => request.post('/optometry', data),
  update: (id, data) => request.put(`/optometry/${id}`, data),
}
