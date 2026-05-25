import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
}

export const userAPI = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
}

export const bookAPI = {
  getBooks: () => api.get('/books'),
  createBook: (data) => api.post('/books', data),
}

export const channelAPI = {
  getChannels: () => api.get('/channels'),
  createChannel: (data) => api.post('/channels', data),
}

export const distributionAPI = {
  getDistributions: (status) => api.get('/distributions', { params: { status } }),
  getDistribution: (id) => api.get(`/distributions/${id}`),
  createDistribution: (data) => api.post('/distributions', data),
  updateDistribution: (id, data) => api.put(`/distributions/${id}`, data),
}

export const returnAPI = {
  getReturns: (status) => api.get('/returns', { params: { status } }),
  getReturn: (id) => api.get(`/returns/${id}`),
  createReturn: (data) => api.post('/returns', data),
  updateReturn: (id, data) => api.put(`/returns/${id}`, data),
}

export const paymentAPI = {
  getPayments: (status) => api.get('/payments', { params: { status } }),
  getPayment: (id) => api.get(`/payments/${id}`),
  createPayment: (data) => api.post('/payments', data),
  updatePayment: (id, data) => api.put(`/payments/${id}`, data),
}

export const exceptionAPI = {
  getExceptions: (status) => api.get('/exceptions', { params: { status } }),
  createException: (data) => api.post('/exceptions', data),
  updateException: (id, data) => api.put(`/exceptions/${id}`, data),
}

export const feedbackAPI = {
  createFeedback: (data) => api.post('/feedbacks', data),
}

export default api
