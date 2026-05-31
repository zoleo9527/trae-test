const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function request(endpoint: string, options: ApiOptions = {}) {
  const token = localStorage.getItem('auth_token') || 'owner-token';
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || '请求失败');
  }

  return data;
}

export const api = {
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, body: any) => request(endpoint, { method: 'POST', body }),
  put: (endpoint: string, body: any) => request(endpoint, { method: 'PUT', body }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};

export const authTokens = {
  owner: 'owner-token',
  kitchen: 'kitchen-token',
  cs: 'cs-token',
};

export const roleNames: Record<string, string> = {
  OWNER: '门店主理人',
  KITCHEN: '后厨负责人',
  CUSTOMER_SERVICE: '客服',
};
