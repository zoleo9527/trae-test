import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
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
  },
);

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/auth/profile'),
};

export const workOrderAPI = {
  getDashboardStats: () => api.get('/work-orders/dashboard/stats'),
  getList: (params?: any) => api.get('/work-orders', { params }),
  getById: (id: string) => api.get(`/work-orders/${id}`),
  create: (data: any) => api.post('/work-orders', data),
  update: (id: string, data: any) => api.put(`/work-orders/${id}`, data),
  changeStatus: (id: string, status: string, reason?: string) =>
    api.put(`/work-orders/${id}/status`, { status, reason }),
  getHistories: (id: string) => api.get(`/work-orders/${id}/histories`),
  getAuditLogs: (id: string) => api.get(`/work-orders/${id}/audit-logs`),
  receiveItem: (workOrderId: string, itemId: string, data: any) =>
    api.put(`/work-orders/${workOrderId}/items/${itemId}/receive`, data),
  returnItem: (workOrderId: string, itemId: string, data: any) =>
    api.put(`/work-orders/${workOrderId}/items/${itemId}/return`, data),
};

export const repairAPI = {
  getList: (params?: any) => api.get('/repairs', { params }),
  getByWorkOrderId: (workOrderId: string) => api.get(`/repairs/work-order/${workOrderId}`),
  getById: (id: string) => api.get(`/repairs/${id}`),
  create: (data: any) => api.post('/repairs', data),
  update: (id: string, data: any) => api.put(`/repairs/${id}`, data),
  changeStatus: (id: string, status: string, reason?: string) =>
    api.put(`/repairs/${id}/status`, { status, reason }),
  getTransitions: (id: string) => api.get(`/repairs/${id}/transitions`),
  addStep: (repairId: string, data: any) => api.post(`/repairs/${repairId}/steps`, data),
  updateStep: (stepId: string, data: any) => api.put(`/repairs/steps/${stepId}`, data),
};

export const followUpAPI = {
  getList: (params?: any) => api.get('/follow-ups', { params }),
  getStats: () => api.get('/follow-ups/stats'),
  create: (data: any) => api.post('/follow-ups', data),
  complete: (id: string, data: any) => api.put(`/follow-ups/${id}/complete`, data),
};

export const memberAPI = {
  getList: (params?: any) => api.get('/members', { params }),
  getById: (id: string) => api.get(`/members/${id}`),
  getByPhone: (phone: string) => api.get(`/members/phone/${phone}`),
  create: (data: any) => api.post('/members', data),
  update: (id: string, data: any) => api.put(`/members/${id}`, data),
};

export default api;
