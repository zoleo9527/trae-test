const API_BASE = '/api';

export async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('未登录');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

export const authAPI = {
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
};

export const dashboardAPI = {
  stats: () => request('/dashboard/stats'),
  activity: () => request('/dashboard/activity'),
};

export const memberAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/members?${query}`);
  },
  detail: (id) => request(`/members/${id}`),
  create: (data) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  batchRenew: (data) => request('/members/renew/batch', { method: 'POST', body: JSON.stringify(data) }),
  logs: (id) => request(`/members/${id}/logs`),
};

export const packageAPI = {
  list: () => request('/packages'),
  create: (data) => request('/packages', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/packages/${id}`, { method: 'DELETE' }),
};

export const orderAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders?${query}`);
  },
  detail: (id) => request(`/orders/${id}`),
  create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
};

export const repairAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/repairs?${query}`);
  },
  detail: (id) => request(`/repairs/${id}`),
  create: (data) => request('/repairs', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, data) => request(`/repairs/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  escalate: (id) => request(`/repairs/${id}/escalate`, { method: 'POST' }),
  logs: (id) => request(`/repairs/${id}/logs`),
};

export const refundAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/refunds?${query}`);
  },
  detail: (id) => request(`/refunds/${id}`),
  create: (data) => request('/refunds', { method: 'POST', body: JSON.stringify(data) }),
  review: (id, data) => request(`/refunds/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const activityAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/activities?${query}`);
  },
  detail: (id) => request(`/activities/${id}`),
  create: (data) => request('/activities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  push: (id, data) => request(`/activities/${id}/push`, { method: 'POST', body: JSON.stringify(data) }),
  stats: (id) => request(`/activities/${id}/stats`),
};

export const siteAPI = {
  list: () => request('/sites'),
  devices: (id) => request(`/sites/${id}/devices`),
};

export const deviceAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/devices?${query}`);
  },
};
