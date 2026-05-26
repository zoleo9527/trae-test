import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
);

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getProducts: () => api.get('/dashboard/products'),
  getExceptions: (status) => api.get('/dashboard/exceptions', { params: { status } }),
};

export const staffAPI = {
  getAll: () => api.get('/staff'),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
};

export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  addRemark: (id, data) => api.post(`/customers/${id}/remarks`, data),
};

export const trialAPI = {
  getAll: (params) => api.get('/trials', { params }),
  getById: (id) => api.get(`/trials/${id}`),
  create: (data) => api.post('/trials', data),
  update: (id, data) => api.put(`/trials/${id}`, data),
  addRemark: (id, data) => api.post(`/trials/${id}/remarks`, data),
};

export const followupAPI = {
  getAll: (params) => api.get('/followups', { params }),
  getCalendar: (params) => api.get('/followups/calendar', { params }),
  getById: (id) => api.get(`/followups/${id}`),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
  delete: (id) => api.delete(`/followups/${id}`),
};

export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  addRemark: (id, data) => api.post(`/orders/${id}/remarks`, data),
  addException: (id, data) => api.post(`/orders/${id}/exceptions`, data),
};

export const approvalAPI = {
  getAll: (params) => api.get('/approvals', { params }),
  approve: (orderId, data) => api.post(`/approvals/${orderId}/approve`, data),
  reject: (orderId, data) => api.post(`/approvals/${orderId}/reject`, data),
  ship: (orderId, data) => api.post(`/approvals/${orderId}/ship`, data),
  receive: (orderId) => api.post(`/approvals/${orderId}/receive`),
  updateException: (exceptionId, data) => api.put(`/approvals/exceptions/${exceptionId}`, data),
};

export default api;
