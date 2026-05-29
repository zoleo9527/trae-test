import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
)

export const workOrderAPI = {
  list: (params) => api.get('/workorder', { params }),
  get: (id) => api.get(`/workorder/${id}`),
  create: (data) => api.post('/workorder', data),
  update: (id, data) => api.put(`/workorder/${id}`, data),
  approve: (id) => api.post(`/workorder/${id}/approve`),
  reject: (id, reason) => api.post(`/workorder/${id}/reject`, { reason }),
  review: (id, note) => api.post(`/workorder/${id}/review`, { note })
}

export const outboundAPI = {
  list: (params) => api.get('/outbound', { params }),
  get: (id) => api.get(`/outbound/${id}`),
  create: (data) => api.post('/outbound', data),
  update: (id, data) => api.put(`/outbound/${id}`, data),
  reconcile: (id, data) => api.post(`/outbound/${id}/reconcile`, data),
  return: (id, data) => api.post(`/outbound/${id}/return`, data)
}

export const statsAPI = {
  dashboard: () => api.get('/stats/dashboard')
}

export default api
