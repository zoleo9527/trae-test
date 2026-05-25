import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout')
};

export const shipmentApi = {
  list: (params) => api.get('/shipments', { params }),
  get: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post('/shipments', data),
  ship: (id, data) => api.put(`/shipments/${id}/ship`, data),
  confirm: (id) => api.put(`/shipments/${id}/confirm`),
  markLost: (id) => api.put(`/shipments/${id}/mark-lost`),
  timeline: (id) => api.get(`/shipments/${id}/timeline`)
};

export const feedbackApi = {
  list: (params) => api.get('/feedbacks', { params }),
  get: (id) => api.get(`/feedbacks/${id}`),
  create: (data) => api.post('/feedbacks', data),
  submit: (id) => api.put(`/feedbacks/${id}/submit`),
  review: (id, data) => api.put(`/feedbacks/${id}/review`, data),
  escalate: (id) => api.put(`/feedbacks/${id}/escalate`)
};

export const returnApi = {
  list: (params) => api.get('/returns', { params }),
  get: (id) => api.get(`/returns/${id}`),
  create: (data) => api.post('/returns', data),
  approve: (id, data) => api.put(`/returns/${id}/approve`, data),
  reject: (id) => api.put(`/returns/${id}/reject`),
  receive: (id, data) => api.put(`/returns/${id}/receive`, data),
  reconcile: (id) => api.put(`/returns/${id}/reconcile`)
};

export const reconciliationApi = {
  list: (params) => api.get('/reconciliations', { params }),
  get: (id) => api.get(`/reconciliations/${id}`),
  generate: (data) => api.post('/reconciliations/generate', data),
  submit: (id) => api.put(`/reconciliations/${id}/submit`),
  approve: (id) => api.put(`/reconciliations/${id}/approve`),
  finalize: (id) => api.put(`/reconciliations/${id}/finalize`)
};

export const dashboardApi = {
  stats: (params) => api.get('/dashboard/stats', { params }),
  channelStats: (params) => api.get('/dashboard/channel-stats', { params }),
  bookStats: () => api.get('/dashboard/book-stats'),
  timeline: (params) => api.get('/dashboard/timeline', { params }),
  issues: () => api.get('/dashboard/issues'),
  drillDown: (entityType, id) => api.get(`/dashboard/drill-down/${entityType}/${id}`)
};

export const commonApi = {
  books: (params) => api.get('/common/books', { params }),
  channels: (params) => api.get('/common/channels', { params }),
  users: (params) => api.get('/common/users', { params })
};

export default api;
