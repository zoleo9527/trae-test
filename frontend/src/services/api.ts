import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const workOrderApi = {
  getList: (params?: any) => api.get('/work-orders', { params }),
  getDetail: (id: string) => api.get(`/work-orders/${id}`),
  create: (data: any) => api.post('/work-orders', data),
  update: (id: string, data: any) => api.put(`/work-orders/${id}`, data),
  transition: (id: string, data: any) => api.post(`/work-orders/${id}/transition`, data),
  assignHandler: (id: string, data: any) => api.put(`/work-orders/${id}/assign-handler`, data),
  getStatistics: () => api.get('/work-orders/statistics'),
  export: (params?: any) => api.get('/work-orders/export', { params }),
  delete: (id: string) => api.delete(`/work-orders/${id}`),
};

export const downtimeApi = {
  getList: (params?: any) => api.get('/downtime', { params }),
  getDetail: (id: string) => api.get(`/downtime/${id}`),
  create: (data: any) => api.post('/downtime', data),
  update: (id: string, data: any) => api.put(`/downtime/${id}`, data),
  confirm: (id: string, data: any) => api.post(`/downtime/${id}/confirm`, data),
  delete: (id: string) => api.delete(`/downtime/${id}`),
};

export const sparePartApi = {
  getList: (params?: any) => api.get('/spare-parts', { params }),
  getDetail: (id: string) => api.get(`/spare-parts/${id}`),
  create: (data: any) => api.post('/spare-parts', data),
  update: (id: string, data: any) => api.put(`/spare-parts/${id}`, data),
  delete: (id: string) => api.delete(`/spare-parts/${id}`),
};

export const partUsageApi = {
  getList: (params?: any) => api.get('/part-usages', { params }),
  getDetail: (id: string) => api.get(`/part-usages/${id}`),
  create: (data: any) => api.post('/part-usages', data),
  approve: (id: string, data: any) => api.post(`/part-usages/${id}/approve`, data),
  receive: (id: string, data: any) => api.post(`/part-usages/${id}/receive`, data),
};

export const reviewApi = {
  getList: (params?: any) => api.get('/reviews', { params }),
  getDetail: (id: string) => api.get(`/reviews/${id}`),
  create: (data: any) => api.post('/reviews', data),
  update: (id: string, data: any) => api.put(`/reviews/${id}`, data),
  verify: (id: string, data: any) => api.post(`/reviews/${id}/verify`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

export const userApi = {
  getList: (params?: any) => api.get('/users', { params }),
  getDetail: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getByRole: (role: string) => api.get(`/users/role/${role}`),
};

export default api;
