const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    throw new Error(data.error || data.message || '请求失败');
  }
  
  return data;
}

export const api = {
  auth: {
    login: (username, password) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
    me: () => request('/auth/me')
  },
  
  dashboard: {
    summary: () => request('/dashboard/summary'),
    inventoryByCategory: () => request('/dashboard/inventory-by-category'),
    inventoryByWarehouse: () => request('/dashboard/inventory-by-warehouse'),
    lossTrend: () => request('/dashboard/loss-trend')
  },
  
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/products${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/products/${id}`)
  },
  
  warehouses: {
    list: () => request('/warehouses')
  },
  
  inventory: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/inventory${query ? `?${query}` : ''}`);
    },
    batches: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/inventory/batches${query ? `?${query}` : ''}`);
    }
  },
  
  stockTake: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/stock-take${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/stock-take/${id}`),
    create: (data) => request('/stock-take', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    start: (id) => request(`/stock-take/${id}/start`, { method: 'PUT' }),
    complete: (id) => request(`/stock-take/${id}/complete`, { method: 'PUT' }),
    updateItem: (planId, itemId, data) => request(`/stock-take/${planId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  
  lossReports: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/loss-reports${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/loss-reports/${id}`),
    create: (data) => request('/loss-reports', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    review: (id) => request(`/loss-reports/${id}/review`, { method: 'PUT' }),
    approve: (id) => request(`/loss-reports/${id}/approve`, { method: 'PUT' })
  },
  
  priceAdjustments: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/price-adjustments${query ? `?${query}` : ''}`);
    }
  },
  
  stockOut: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/stock-out${query ? `?${query}` : ''}`);
    }
  },
  
  operationLogs: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/operation-logs${query ? `?${query}` : ''}`);
    }
  },
  
  users: {
    list: () => request('/users')
  }
};

export default api;
