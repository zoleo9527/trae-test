const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error instanceof Error ? error.message : '请求失败');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: () => request('/auth/me'),
  },
  dashboard: {
    getStats: () => request('/dashboard'),
  },
  rentals: {
    list: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/rentals?${query}`);
    },
    get: (id: string) => request(`/rentals/${id}`),
    getHistory: (id: string) => request(`/rentals/${id}/history`),
  },
  returns: {
    list: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/returns?${query}`);
    },
    getPending: () => request('/returns/pending-review'),
    review: (id: string, action: string) =>
      request(`/returns/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }),
    batchReview: (ids: string[], action: string) =>
      request('/returns/batch-review', {
        method: 'POST',
        body: JSON.stringify({ ids, action }),
      }),
  },
  repairs: {
    list: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/repairs?${query}`);
    },
    get: (id: string) => request(`/repairs/${id}`),
    assign: (id: string, technicianId: string, technicianName: string) =>
      request(`/repairs/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ technicianId, technicianName }),
      }),
    start: (id: string) =>
      request(`/repairs/${id}/start', { method: 'POST' }),
    addPart: (id: string, part: any) =>
      request(`/repairs/${id}/add-part`, {
        method: 'POST',
        body: JSON.stringify(part),
      }),
    complete: (id: string, data: { diagnosis: string; laborHours: number }) =>
      request(`/repairs/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  school: {
    getPartners: () => request('/school/partners'),
    getInvoices: (params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return request(`/school/invoices?${query}`);
    },
    getInvoice: (id: string) => request(`/school/invoices/${id}`),
    markPaid: (id: string, amount: number) =>
      request(`/school/invoices/${id}/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
    getStats: () => request('/school/statistics'),
  },
};
