import { API_BASE, type Order, type User } from './types';

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token') || '';
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('X-Auth-Token', token);
  const resp = await fetch(API_BASE + path, { ...init, headers, credentials: 'include' });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `HTTP ${resp.status}`);
  }
  return (await resp.json()) as T;
}

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const resp = await fetch(API_BASE + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!resp.ok) {
    const e = await resp.text();
    throw new Error(e || '登录失败');
  }
  return resp.json();
}

export function me() {
  return api<User>('/me');
}

export function listOrders() {
  return api<Order[]>('/orders');
}

export function getOrder(id: string) {
  return api<Order>(`/orders/${id}`);
}

export function addSlot(id: string, body: { at: string; place: string; photographer: string }) {
  return api<Order>(`/orders/${id}/slots`, { method: 'POST', body: JSON.stringify(body) });
}

export function rescheduleSlot(id: string, slotId: string, body: { at: string; place: string; photographer: string }) {
  return api<Order>(`/orders/${id}/slots/${slotId}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function addSelection(id: string, body: { photos: string[]; note: string }) {
  return api<Order>(`/orders/${id}/selections`, { method: 'POST', body: JSON.stringify(body) });
}

export function confirmSelection(id: string, selId: string, confirm: boolean, version: number) {
  return api<Order>(`/orders/${id}/selections/${selId}/confirm`, {
    method: 'PUT',
    body: JSON.stringify({ confirm, version })
  });
}

export function payPayment(id: string, payId: string, note: string) {
  return api<Order>(`/orders/${id}/payments/${payId}/pay`, { method: 'POST', body: JSON.stringify({ note }) });
}

export function createException(id: string, body: { kind: string; severity: string; summary: string; detail: string }) {
  return api<Order>(`/orders/${id}/exceptions`, { method: 'POST', body: JSON.stringify(body) });
}

export function closeException(id: string, excId: string, note: string) {
  return api<Order>(`/orders/${id}/exceptions/${excId}/close`, { method: 'POST', body: JSON.stringify({ note }) });
}

export function fmtTime(s: string) {
  if (!s) return '-';
  const d = new Date(s);
  return d.toLocaleString('zh-CN', { hour12: false });
}
