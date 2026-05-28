const API_BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
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
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me'),
  },
  berth: {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/berth-plans${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/berth-plans/${id}`),
    create: (data) => request('/berth-plans', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/berth-plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    addService: (id, data) => request(`/berth-plans/${id}/services`, { method: 'POST', body: JSON.stringify(data) }),
    addCommunication: (id, data) => request(`/berth-plans/${id}/communications`, { method: 'POST', body: JSON.stringify(data) }),
  },
  payments: {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/payments${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/payments/${id}`),
    create: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    addCollection: (id, data) => request(`/payments/${id}/collections`, { method: 'POST', body: JSON.stringify(data) }),
    addCommunication: (id, data) => request(`/payments/${id}/communications`, { method: 'POST', body: JSON.stringify(data) }),
  },
  crew: {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/crew-changes${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/crew-changes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/crew-changes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  supplies: {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/supplies${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/supplies', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/supplies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  alerts: {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return request(`/alerts${query ? `?${query}` : ''}`);
    },
    summary: () => request('/alerts/summary'),
    update: (id, data) => request(`/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
};
