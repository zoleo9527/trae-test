import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const dashboardApi = {
  getOverview: () => api.get('/dashboard/overview'),
}

export const camperApi = {
  getList: () => api.get('/campers'),
  getDetail: (id: string) => api.get(`/campers/${id}`),
  create: (data: any) => api.post('/campers', data),
  update: (id: string, data: any) => api.put(`/campers/${id}`, data),
  delete: (id: string) => api.delete(`/campers/${id}`),
  assignRoom: (id: string, data: any) => api.put(`/campers/${id}/assign-room`, data),
  unassignRoom: (id: string) => api.put(`/campers/${id}/unassign-room`),
}

export const roomApi = {
  getList: () => api.get('/rooms'),
  getAssignments: () => api.get('/rooms/assignments'),
  create: (data: any) => api.post('/rooms', data),
  assignBed: (roomId: string, data: any) => api.post(`/rooms/${roomId}/assign-bed`, data),
  unassignBed: (data: any) => api.post('/rooms/unassign-bed', data),
}

export const materialApi = {
  getList: () => api.get('/materials'),
  getDistributions: (camperId?: string) => 
    api.get('/materials/distributions', { params: camperId ? { camperId } : {} }),
  distribute: (data: any) => api.post('/materials/distribute', data),
}

export const resupplyApi = {
  getList: (status?: string) => 
    api.get('/resupply', { params: status ? { status } : {} }),
  getDetail: (id: string) => api.get(`/resupply/${id}`),
  getMyTasks: (role: string) => api.get('/resupply/my-tasks', { params: { role } }),
  create: (data: any) => api.post('/resupply', data),
  review: (id: string, data: any) => api.post(`/resupply/${id}/review`, data),
  fulfill: (id: string, data: any) => api.post(`/resupply/${id}/fulfill`, data),
  close: (id: string, data: any) => api.post(`/resupply/${id}/close`, data),
  addEvidence: (id: string, data: any) => api.post(`/resupply/${id}/evidence`, data),
}

export const checkInApi = {
  getList: (activityDate?: string) => 
    api.get('/check-in', { params: activityDate ? { activityDate } : {} }),
  checkIn: (id: string, data: any) => api.post(`/check-in/${id}/check`, data),
  batchCreate: (data: any) => api.post('/check-in/batch', data),
}

export const medicalApi = {
  getList: (status?: string) => 
    api.get('/medical', { params: status ? { status } : {} }),
  getDetail: (id: string) => api.get(`/medical/${id}`),
  create: (data: any) => api.post('/medical', data),
  handle: (id: string, data: any) => api.post(`/medical/${id}/handle`, data),
}

export default api
