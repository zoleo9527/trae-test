const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) => 
      request<{ user: { id: string; name: string; email: string; role: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user: { id: string; name: string; email: string; role: string } }>('/auth/me'),
  },
  students: {
    list: (params?: { status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ students: any[] }>(`/students${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<{ student: any; documents: any[]; deadlines: any[]; visa: any; messages: any[]; activityLogs: any[] }>(`/students/${id}`),
    update: (id: string, data: any) => request<{ student: any }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },
  documents: {
    listByStudent: (studentId: string) => request<{ documents: any[] }>(`/documents/student/${studentId}`),
    get: (id: string) => request<{ document: any }>(`/documents/${id}`),
    updateStatus: (id: string, status: string, feedback?: string) => request<{ document: any }>(`/documents/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, feedback }),
    }),
    addVersion: (id: string, data: any) => request<{ version: any }>(`/documents/${id}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  visa: {
    getByStudent: (studentId: string) => request<{ visa: any }>(`/visa/student/${studentId}`),
    updateStatus: (studentId: string, status: string, updates?: any) => request<{ visa: any }>(`/visa/student/${studentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...updates }),
    }),
    addNote: (studentId: string, content: string, type: string = 'update') => request<{ note: any }>(`/visa/student/${studentId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    }),
  },
  deadlines: {
    list: (params?: { start?: string; end?: string; type?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ deadlines: any[] }>(`/deadlines${query ? `?${query}` : ''}`);
    },
    listByStudent: (studentId: string) => request<{ deadlines: any[] }>(`/deadlines/student/${studentId}`),
    update: (id: string, data: any) => request<{ deadline: any }>(`/deadlines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },
  issues: {
    list: (params?: { status?: string; category?: string; priority?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ issues: any[] }>(`/issues${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<{ issue: any }>(`/issues/${id}`),
    update: (id: string, data: any) => request<{ issue: any }>(`/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },
  messages: {
    listByStudent: (studentId: string) => request<{ messages: any[] }>(`/messages/student/${studentId}`),
    add: (studentId: string, content: string, relatedEntity?: any) => request<{ message: any }>(`/messages/student/${studentId}`, {
      method: 'POST',
      body: JSON.stringify({ content, relatedEntity }),
    }),
  },
};
