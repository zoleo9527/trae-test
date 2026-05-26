import { browser } from '$app/environment';

const API_BASE = '';

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'director' | 'dispatcher' | 'operator';
}

export interface SubsidyApplication {
  id: number;
  code: string;
  farmer_name: string;
  field_name: string;
  field_area: number;
  crop_type: string;
  operation_type: string;
  status: string;
  submitted_by: number;
  submitted_at: string;
  scheduled_for?: string;
  scheduled_operator_id?: number;
  note?: string;
  operator_name?: string;
  submitter_name?: string;
}

export interface DashboardData {
  counts: {
    pending: number;
    rejected: number;
    reviewFlags: number;
    inProgress: number;
    completed: number;
  };
  flags: Array<{
    id: number;
    application_id: number;
    app_code: string;
    farmer_name: string;
    field_name: string;
    flag_type: string;
    severity: string;
    note?: string;
    created_by_name?: string;
  }>;
  rejectedList: Array<{
    id: number;
    code: string;
    farmer_name: string;
    field_name: string;
    note?: string;
  }>;
  pendingList: Array<{
    id: number;
    code: string;
    farmer_name: string;
    field_name: string;
    status: string;
    scheduled_for?: string;
    crop_type: string;
    operation_type: string;
  }>;
}

export interface ReviewBoardItem extends SubsidyApplication {
  reports: any[];
  fuels: any[];
  materials: any[];
  flags: any[];
  late_progress: boolean;
  missing_docs: boolean;
}

let token = 'dis-token';
if (browser) {
  const saved = localStorage.getItem('token');
  if (saved) token = saved;
}

export function setToken(t: string) {
  token = t;
  if (browser) localStorage.setItem('token', t);
}

export function getToken() {
  return token;
}

async function fetchApi(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-token': token
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (username: string) => fetchApi('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username })
  }),
  getMe: () => fetchApi('/api/me'),
  getUsers: (): Promise<User[]> => fetchApi('/api/users'),
  getDashboard: (): Promise<DashboardData> => fetchApi('/api/dashboard'),
  getReviewBoard: (): Promise<ReviewBoardItem[]> => fetchApi('/api/review-board'),
  getSubsidies: () => fetchApi('/api/subsidies'),
  getSubsidy: (id: number) => fetchApi(`/api/subsidies/${id}`),
  createSubsidy: (data: any) => fetchApi('/api/subsidies', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  scheduleSubsidy: (id: number, data: any) => fetchApi(`/api/subsidies/${id}/schedule`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  rejectSubsidy: (id: number, note: string) => fetchApi(`/api/subsidies/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ note })
  }),
  resubmitSubsidy: (id: number) => fetchApi(`/api/subsidies/${id}/resubmit`, {
    method: 'POST'
  }),
  completeSubsidy: (id: number) => fetchApi(`/api/subsidies/${id}/complete`, {
    method: 'POST'
  }),
  reportProgress: (id: number, data: any) => fetchApi(`/api/subsidies/${id}/report`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  collectMaterial: (id: number) => fetchApi(`/api/materials/${id}/collect`, {
    method: 'POST'
  }),
  createFlag: (data: any) => fetchApi('/api/flags', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  resolveFlag: (id: number) => fetchApi(`/api/flags/${id}/resolve`, {
    method: 'POST'
  }),
  getFuels: (): Promise<any[]> => fetchApi('/api/fuels'),
  postFuel: (data: any) => fetchApi('/api/fuels', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
