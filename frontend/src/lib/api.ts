import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
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

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
};

export const showsAPI = {
  getAll: (params?: any) => api.get('/shows', { params }),
  getById: (id: string) => api.get(`/shows/${id}`),
  create: (data: any) => api.post('/shows', data),
  update: (id: string, data: any) => api.put(`/shows/${id}`, data),
  addRehearsal: (id: string, data: any) => api.post(`/shows/${id}/rehearsal`, data),
  confirmRehearsal: (showId: string, slotId: string) =>
    api.put(`/shows/${showId}/rehearsal/${slotId}/confirm`),
};

export const ordersAPI = {
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  confirm: (id: string) => api.put(`/orders/${id}/confirm`),
  addPayment: (id: string, data: any) => api.post(`/orders/${id}/payment`, data),
  batchConfirm: (orderIds: string[]) => api.post('/orders/batch-confirm', { orderIds }),
};

export const refundsAPI = {
  getAll: (params?: any) => api.get('/refunds', { params }),
  getById: (id: string) => api.get(`/refunds/${id}`),
  create: (data: any) => api.post('/refunds', data),
  ticketApprove: (id: string, approvalNote?: string) =>
    api.put(`/refunds/${id}/ticket-approve`, { approvalNote }),
  managerApprove: (id: string, approvalNote?: string) =>
    api.put(`/refunds/${id}/manager-approve`, { approvalNote }),
  reject: (id: string, rejectionReason: string) =>
    api.put(`/refunds/${id}/reject`, { rejectionReason }),
  batchTicketApprove: (requestIds: string[], approvalNote?: string) =>
    api.post('/refunds/batch-approve/ticket', { requestIds, approvalNote }),
  batchManagerApprove: (requestIds: string[], approvalNote?: string) =>
    api.post('/refunds/batch-approve/manager', { requestIds, approvalNote }),
};

export const logsAPI = {
  getAll: (params?: any) => api.get('/logs', { params }),
  getDashboard: () => api.get('/logs/dashboard'),
};

export default api;
