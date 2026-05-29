import { get } from 'svelte/store';
import { token } from '$lib/stores/auth';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const authToken = get(token);
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string> || {})
	};

	if (authToken) {
		headers['Authorization'] = `Bearer ${authToken}`;
	}

	const response = await fetch(`${API_BASE}${endpoint}`, {
		...options,
		headers
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: '请求失败' }));
		throw new Error(error.error || '请求失败');
	}

	return response.json();
}

export const api = {
	login: (username: string, password: string) =>
		request<{ token: string; user: any }>('/login', {
			method: 'POST',
			body: JSON.stringify({ username, password })
		}),

	getCurrentUser: () => request<any>('/auth/me'),
	getOrders: (status?: string) => request<any[]>(`/orders${status ? `?status=${status}` : ''}`),
	getOrder: (id: number) => request<any>(`/orders/${id}`),
	createOrder: (data: any) =>
		request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
	assignOrder: (id: number, runnerId: number) =>
		request<any>(`/orders/${id}/assign`, {
			method: 'PUT',
			body: JSON.stringify({ runner_id: runnerId })
		}),
	updateOrderStatus: (id: number, status: string) =>
		request<any>(`/orders/${id}/status`, {
			method: 'PUT',
			body: JSON.stringify({ status })
		}),
	pickupOrder: (id: number) =>
		request<any>(`/orders/${id}/pickup`, { method: 'PUT' }),
	deliverOrder: (id: number) =>
		request<any>(`/orders/${id}/deliver`, { method: 'PUT' }),

	getAppeals: (status?: string) => request<any[]>(`/appeals${status ? `?status=${status}` : ''}`),
	getAppeal: (id: number) => request<any>(`/appeals/${id}`),
	createAppeal: (data: any) =>
		request<any>('/appeals', { method: 'POST', body: JSON.stringify(data) }),
	reviewAppeal: (id: number, data: any) =>
		request<any>(`/appeals/${id}/review`, {
			method: 'PUT',
			body: JSON.stringify(data)
		}),

	getSubsidies: (status?: string) => request<any[]>(`/subsidies${status ? `?status=${status}` : ''}`),
	getSubsidy: (id: number) => request<any>(`/subsidies/${id}`),
	calculateSubsidy: (data: any) =>
		request<any>('/subsidies/calculate', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	getRunners: () => request<any[]>('/runners'),
	getTimeline: (orderId: number) => request<any[]>(`/timeline/${orderId}`)
};

export const statusMap: Record<string, { label: string; color: string; bg: string }> = {
	pending: { label: '待分配', color: 'text-gray-600', bg: 'bg-gray-100' },
	assigned: { label: '已分配', color: 'text-blue-600', bg: 'bg-blue-100' },
	picked_up: { label: '已取餐', color: 'text-yellow-600', bg: 'bg-yellow-100' },
	delivering: { label: '配送中', color: 'text-orange-600', bg: 'bg-orange-100' },
	delivered: { label: '已送达', color: 'text-green-600', bg: 'bg-green-100' },
	timeout: { label: '已超时', color: 'text-red-600', bg: 'bg-red-100' },
	appealing: { label: '申诉中', color: 'text-purple-600', bg: 'bg-purple-100' },
	resolved: { label: '已解决', color: 'text-emerald-600', bg: 'bg-emerald-100' },
	cancelled: { label: '已取消', color: 'text-gray-600', bg: 'bg-gray-100' }
};

export const appealTypeMap: Record<string, string> = {
	timeout: '超时申诉',
	merchant_error: '商家出错',
	customer_cancel: '用户取消',
	damage: '物品损坏',
	other: '其他'
};
