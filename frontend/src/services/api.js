import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  login: (username, password) => api.post('/users/login', { username, password }),
  getUsers: () => api.get('/users'),
  getUsersByRole: (role) => api.get(`/users/by-role/${role}`)
}

export const projectsAPI = {
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProjectStatus: (id, data) => api.put(`/projects/${id}/status`, data)
}

export const checkinsAPI = {
  getCheckins: (params) => api.get('/checkins', { params }),
  getMissedCheckins: (days) => api.get('/checkins/missed', { params: { days } }),
  batchProcess: (data) => api.post('/checkins/batch-process', data),
  getComments: (id) => api.get(`/checkins/${id}/comments`),
  addComment: (id, data) => api.post(`/checkins/${id}/comments`, data)
}

export const inspectionsAPI = {
  getInspections: (params) => api.get('/inspections', { params }),
  getPendingRectifications: () => api.get('/inspections/pending-rectification'),
  batchRectification: (data) => api.post('/inspections/batch-rectification', data),
  getComments: (id) => api.get(`/inspections/${id}/comments`),
  addComment: (id, data) => api.post(`/inspections/${id}/comments`, data)
}

export const suppliesAPI = {
  getSupplies: (params) => api.get('/supplies', { params }),
  getLowStock: () => api.get('/supplies/low-stock'),
  getRequests: (params) => api.get('/supplies/requests', { params }),
  batchProcessRequests: (data) => api.post('/supplies/requests/batch-process', data),
  createRequest: (data) => api.post('/supplies/requests', data)
}

export const renewalsAPI = {
  getRenewals: (params) => api.get('/renewals', { params }),
  getPendingFollowups: () => api.get('/renewals/pending-followup'),
  createRenewal: (data) => api.post('/renewals', data),
  updateStatus: (id, data) => api.put(`/renewals/${id}/status`, data),
  getComments: (id) => api.get(`/renewals/${id}/comments`),
  addComment: (id, data) => api.post(`/renewals/${id}/comments`, data)
}

export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: (userId) => api.get('/notifications/unread-count', { params: { user_id: userId } }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  getOverview: () => api.get('/notifications/overview')
}

export const statusHistoryAPI = {
  getHistory: (params) => api.get('/status-history', { params })
}

export default api
