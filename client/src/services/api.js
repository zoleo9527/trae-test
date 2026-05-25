import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me')
};

export const performanceApi = {
  getAll: (params) => api.get('/performances', { params }),
  getById: (id) => api.get(`/performances/${id}`),
  getChain: (chainId) => api.get(`/performances/chain/${chainId}`),
  create: (data) => api.post('/performances', data),
  update: (id, data) => api.put(`/performances/${id}`, data),
  updateStatus: (id, status) => api.patch(`/performances/${id}/status`, { status })
};

export const orderApi = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  requestRefund: (id, data) => api.post(`/orders/${id}/refund-request`, data),
  processRefund: (taskId, approved, remark) => api.post(`/orders/refund/${taskId}/process`, { approved, remark }),
  processSettlement: (id) => api.post(`/orders/${id}/settlement`)
};

export const rehearsalApi = {
  getAll: (params) => api.get('/rehearsals', { params }),
  getById: (id) => api.get(`/rehearsals/${id}`),
  create: (data) => api.post('/rehearsals', data),
  update: (id, data) => api.put(`/rehearsals/${id}`, data),
  updateStatus: (id, status) => api.patch(`/rehearsals/${id}/status`, { status }),
  reportIssue: (id, content) => api.post(`/rehearsals/${id}/issues`, { content }),
  resolveIssue: (rehearsalId, issueId) => api.patch(`/rehearsals/${rehearsalId}/issues/${issueId}/resolve`),
  requestArrangement: (performanceId, description) => api.post('/rehearsals/arrangement-request', { performanceId, description })
};

export const taskApi = {
  getMy: (params) => api.get('/tasks/my', { params }),
  getMyOverdue: () => api.get('/tasks/my/overdue'),
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  updateStatus: (id, status, remark) => api.patch(`/tasks/${id}/status`, { status, remark }),
  assign: (id, assigneeId) => api.post(`/tasks/${id}/assign`, { assigneeId }),
  approve: (id, remark) => api.post(`/tasks/${id}/approve`, { remark }),
  reject: (id, remark) => api.post(`/tasks/${id}/reject`, { remark }),
  complete: (id, remark) => api.post(`/tasks/${id}/complete`, { remark })
};

export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/all/read')
};

export default api;
