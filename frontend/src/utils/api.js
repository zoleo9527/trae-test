import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const dashboardAPI = {
  getStats: function() { return api.get('/dashboard/stats') },
  getPendingItems: function() { return api.get('/dashboard/pending-items') },
}

export const userAPI = {
  getAll: function(params) { return api.get('/users/', { params: params || {} }) },
  getVolunteers: function() { return api.get('/users/volunteers') },
  create: function(data) { return api.post('/users/', data) },
}

export const scheduleAPI = {
  getAll: function(params) { return api.get('/schedules/', { params: params || {} }) },
  get: function(id) { return api.get('/schedules/' + id) },
  create: function(data) { return api.post('/schedules/', data) },
  update: function(id, data) { return api.put('/schedules/' + id, data) },
  getFeedbacks: function(id) { return api.get('/schedules/' + id + '/feedbacks') },
}

export const feedbackAPI = {
  getAll: function(params) { return api.get('/feedbacks/', { params: params || {} }) },
  get: function(id) { return api.get('/feedbacks/' + id) },
  create: function(data) { return api.post('/feedbacks/', data) },
  update: function(id, data) { return api.put('/feedbacks/' + id, data) },
  getTraces: function(id) { return api.get('/feedbacks/' + id + '/traces') },
  addTrace: function(data) { return api.post('/review-traces/', data) },
}

export const exhibitAPI = {
  getAll: function(params) { return api.get('/exhibits/', { params: params || {} }) },
  get: function(id) { return api.get('/exhibits/' + id) },
  create: function(data) { return api.post('/exhibits/', data) },
}

export const transferAPI = {
  getAll: function(params) { return api.get('/exhibit-transfers/', { params: params || {} }) },
  create: function(data) { return api.post('/exhibit-transfers/', data) },
  confirm: function(id) { return api.put('/exhibit-transfers/' + id + '/confirm') },
}

export const activityAPI = {
  getAll: function(params) { return api.get('/activities/', { params: params || {} }) },
  get: function(id) { return api.get('/activities/' + id) },
  create: function(data) { return api.post('/activities/', data) },
  update: function(id, data) { return api.put('/activities/' + id, data) },
}

export const ticketAPI = {
  getAll: function(params) { return api.get('/tickets/', { params: params || {} }) },
  create: function(data) { return api.post('/tickets/', data) },
  verify: function(id, verifiedBy) { return api.put('/tickets/' + id + '/verify?verified_by=' + encodeURIComponent(verifiedBy)) },
  reject: function(id, verifiedBy) { return api.put('/tickets/' + id + '/reject?verified_by=' + encodeURIComponent(verifiedBy)) },
}

export default api
