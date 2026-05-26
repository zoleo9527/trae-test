import type {
  User,
  Complaint,
  Recheck,
  Compensation,
  Payment,
  PaginatedResponse,
  Statistics,
  ComplaintStatus,
} from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  
  getMe: () => request<User>('/auth/me'),
};

export const complaintApi = {
  getAll: (params?: {
    status?: string;
    page?: number;
    pageSize?: number;
    keyword?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.keyword) query.set('keyword', params.keyword);
    return request<PaginatedResponse<Complaint>>(`/complaints?${query.toString()}`);
  },

  getOne: (id: string) => request<Complaint>(`/complaints/${id}`),

  getStatistics: () => request<Statistics>('/complaints/statistics'),

  create: (data: Partial<Complaint>) =>
    request<Complaint>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: ComplaintStatus, remark?: string) =>
    request<Complaint>(`/complaints/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, remark }),
    }),

  batchUpdate: (ids: string[], action: string) =>
    request<{ success: number; failed: number }>('/complaints/batch', {
      method: 'POST',
      body: JSON.stringify({ ids, action }),
    }),
};

export const recheckApi = {
  getByComplaintId: (complaintId: string) =>
    request<Recheck[]>(`/rechecks/complaint/${complaintId}`),

  create: (data: Partial<Recheck> & { complaintId: string }) =>
    request<Recheck>('/rechecks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const compensationApi = {
  getAll: (params?: { status?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return request<PaginatedResponse<Compensation>>(`/compensations?${query.toString()}`);
  },

  getByComplaintId: (complaintId: string) =>
    request<Compensation[]>(`/compensations/complaint/${complaintId}`),

  create: (data: Partial<Compensation> & { complaintId: string }) =>
    request<Compensation>('/compensations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approve: (id: string, remark?: string) =>
    request<Compensation>(`/compensations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ remark }),
    }),

  reject: (id: string, remark?: string) =>
    request<Compensation>(`/compensations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ remark }),
    }),
};

export const paymentApi = {
  getAll: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return request<PaginatedResponse<Payment>>(`/payments?${query.toString()}`);
  },

  getByCompensationId: (compensationId: string) =>
    request<Payment[]>(`/payments/compensation/${compensationId}`),

  create: (data: Partial<Payment> & { compensationId: string }) =>
    request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
