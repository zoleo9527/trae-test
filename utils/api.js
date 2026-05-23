export function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('未授权');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (data) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
    profile: () => apiRequest('/api/auth/profile'),
    getEngineers: () => apiRequest('/api/auth/engineers'),
  },
  dashboard: {
    getOverview: () => apiRequest('/api/dashboard'),
    getActivities: () => apiRequest('/api/dashboard/activities'),
  },
  gridDocs: {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/grid-docs${query ? `?${query}` : ''}`);
    },
    get: (id) => apiRequest(`/api/grid-docs/${id}`),
    create: (data) => apiRequest('/api/grid-docs', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id, remark) => apiRequest(`/api/grid-docs/${id}/approve`, { method: 'PUT', body: JSON.stringify({ remark }) }),
    reject: (id, reason) => apiRequest(`/api/grid-docs/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
    supplement: (id, note) => apiRequest(`/api/grid-docs/${id}/supplement`, { method: 'PUT', body: JSON.stringify({ note }) }),
    addRemark: (id, content) => apiRequest(`/api/grid-docs/${id}/remarks`, { method: 'POST', body: JSON.stringify({ content }) }),
  },
  payment: {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/payment${query ? `?${query}` : ''}`);
    },
    get: (id) => apiRequest(`/api/payment/${id}`),
    getSummary: () => apiRequest('/api/payment/summary'),
    process: (id, data) => apiRequest(`/api/payment/${id}/process`, { method: 'POST', body: JSON.stringify(data) }),
    updateProgress: (id, data) => apiRequest(`/api/payment/${id}/progress`, { method: 'PUT', body: JSON.stringify(data) }),
    complete: (id, data) => apiRequest(`/api/payment/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
    addRemark: (id, content) => apiRequest(`/api/payment/${id}/remarks`, { method: 'POST', body: JSON.stringify({ content }) }),
    addEvidence: (id, name) => apiRequest(`/api/payment/${id}/evidences`, { method: 'POST', body: JSON.stringify({ name }) }),
  },
  workOrders: {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/work-orders${query ? `?${query}` : ''}`);
    },
    get: (id) => apiRequest(`/api/work-orders/${id}`),
    create: (data) => apiRequest('/api/work-orders', { method: 'POST', body: JSON.stringify(data) }),
    assign: (id, assigneeId) => apiRequest(`/api/work-orders/${id}/assign`, { method: 'PUT', body: JSON.stringify({ assigneeId }) }),
    updateStatus: (id, status, statusName, closeNote) => 
      apiRequest(`/api/work-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, statusName, closeNote }) }),
    addRemark: (id, content) => apiRequest(`/api/work-orders/${id}/remarks`, { method: 'POST', body: JSON.stringify({ content }) }),
    addEvidence: (id, name) => apiRequest(`/api/work-orders/${id}/evidences`, { method: 'POST', body: JSON.stringify({ name }) }),
    requestSparePart: (id, data) => apiRequest(`/api/work-orders/${id}/spare-parts`, { method: 'POST', body: JSON.stringify(data) }),
    getStats: () => apiRequest('/api/work-orders/stats/summary'),
  },
  spareParts: {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/spare-parts${query ? `?${query}` : ''}`);
    },
    get: (id) => apiRequest(`/api/spare-parts/${id}`),
    request: (id, quantity, workOrderId) => 
      apiRequest(`/api/spare-parts/${id}/request`, { method: 'POST', body: JSON.stringify({ quantity, workOrderId }) }),
    restock: (id, quantity) => 
      apiRequest(`/api/spare-parts/${id}/restock`, { method: 'POST', body: JSON.stringify({ quantity }) }),
    getLowStockAlerts: () => apiRequest('/api/spare-parts/alerts/low-stock'),
  },
  powerData: {
    getToday: () => apiRequest('/api/power-data/today'),
    getHourly: () => apiRequest('/api/power-data/hourly'),
    getDaily: () => apiRequest('/api/power-data/daily'),
    getMonthly: () => apiRequest('/api/power-data/monthly'),
    getByArea: () => apiRequest('/api/power-data/by-area'),
    getAlarms: () => apiRequest('/api/power-data/alarms'),
  },
};
