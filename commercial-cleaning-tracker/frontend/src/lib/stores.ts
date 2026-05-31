import { writable, type Writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { User, Project, Schedule, Shift, CheckIn, Inspection, Rectification, MaterialRequisition, FollowUp, TraceChain, DashboardStats } from './types';

const API_BASE = 'http://localhost:3000/api';

function createTokenStore(): Writable<string | null> {
	const initialValue = browser ? localStorage.getItem('token') : null;
	const store = writable<string | null>(initialValue);
	store.subscribe((value) => {
		if (browser) {
			if (value) localStorage.setItem('token', value);
			else localStorage.removeItem('token');
		}
	});
	return store;
}

function createUserStore(): Writable<User | null> {
	const initialValue = browser ? localStorage.getItem('currentUser') : null;
	const store = writable<User | null>(initialValue ? JSON.parse(initialValue) : null);
	store.subscribe((value) => {
		if (browser) {
			if (value) localStorage.setItem('currentUser', JSON.stringify(value));
			else localStorage.removeItem('currentUser');
		}
	});
	return store;
}

export const token = createTokenStore();
export const currentUser = createUserStore();

async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string> || {})
	};
	const t = browser ? get(token) : null;
	if (t) headers['Authorization'] = `Bearer ${t}`;
	const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
	if (!res.ok) throw new Error(`API Error: ${res.status}`);
	return res.json();
}

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
	const result = await api<{ token: string; user: User }>('/login', {
		method: 'POST',
		body: JSON.stringify({ username, password })
	});
	token.set(result.token);
	currentUser.set(result.user);
	return result;
}

export function logout() {
	token.set(null);
	currentUser.set(null);
}

export async function getProjects(): Promise<Project[]> {
	return api<Project[]>('/projects');
}

export async function getWorkers(): Promise<User[]> {
	return api<User[]>('/workers');
}

export async function getDashboardStats(): Promise<DashboardStats> {
	return api<DashboardStats>('/dashboard/stats');
}

export async function getSchedules(projectId?: number): Promise<Schedule[]> {
	const query = projectId ? `?projectId=${projectId}` : '';
	return api<Schedule[]>(`/schedules${query}`);
}

export async function getSchedule(id: number): Promise<Schedule> {
	return api<Schedule>(`/schedules/${id}`);
}

export async function createSchedule(data: Record<string, unknown>): Promise<Schedule> {
	return api<Schedule>('/schedules', { method: 'POST', body: JSON.stringify(data) });
}

export async function publishSchedule(id: number): Promise<Schedule> {
	return api<Schedule>(`/schedules/${id}/publish`, { method: 'POST' });
}

export async function getShifts(params?: { workerId?: number; date?: string; projectId?: number }): Promise<Shift[]> {
	const query = params ? Object.entries(params)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => `${k}=${v}`)
		.join('&') : '';
	return api<Shift[]>(`/shifts${query ? '?' + query : ''}`);
}

export async function getShift(id: number): Promise<Shift> {
	return api<Shift>(`/shifts/${id}`);
}

export async function getCheckIns(params?: { shiftId?: number; workerId?: number; status?: string }): Promise<CheckIn[]> {
	const query = params ? Object.entries(params)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => `${k}=${v}`)
		.join('&') : '';
	return api<CheckIn[]>(`/checkins${query ? '?' + query : ''}`);
}

export async function createCheckIn(data: { shiftId: number; photoUrl?: string; location?: string; remark?: string }): Promise<CheckIn> {
	return api<CheckIn>('/checkins', { method: 'POST', body: JSON.stringify(data) });
}

export async function checkOut(id: number): Promise<CheckIn> {
	return api<CheckIn>(`/checkins/${id}/checkout`, { method: 'POST' });
}

export async function correctCheckIn(id: number, data: Record<string, unknown>): Promise<CheckIn> {
	return api<CheckIn>(`/checkins/${id}/correct`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function getInspections(params?: { shiftId?: number; result?: string }): Promise<Inspection[]> {
	const query = params ? Object.entries(params)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => `${k}=${v}`)
		.join('&') : '';
	return api<Inspection[]>(`/inspections${query ? '?' + query : ''}`);
}

export async function createInspection(data: Record<string, unknown>): Promise<Inspection> {
	return api<Inspection>('/inspections', { method: 'POST', body: JSON.stringify(data) });
}

export async function getRectifications(params?: { status?: string; assigneeId?: number }): Promise<Rectification[]> {
	const query = params ? Object.entries(params)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => `${k}=${v}`)
		.join('&') : '';
	return api<Rectification[]>(`/rectifications${query ? '?' + query : ''}`);
}

export async function createRectification(data: Record<string, unknown>): Promise<Rectification> {
	return api<Rectification>('/rectifications', { method: 'POST', body: JSON.stringify(data) });
}

export async function completeRectification(id: number, completedNote: string): Promise<Rectification> {
	return api<Rectification>(`/rectifications/${id}/complete`, {
		method: 'POST',
		body: JSON.stringify({ completedNote })
	});
}

export async function verifyRectification(id: number, verifyNote: string): Promise<Rectification> {
	return api<Rectification>(`/rectifications/${id}/verify`, {
		method: 'POST',
		body: JSON.stringify({ verifyNote })
	});
}

export async function getMaterials(params?: { status?: string; requesterId?: number; shiftId?: number }): Promise<MaterialRequisition[]> {
	const query = params ? Object.entries(params)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => `${k}=${v}`)
		.join('&') : '';
	return api<MaterialRequisition[]>(`/materials${query ? '?' + query : ''}`);
}

export async function createMaterial(data: { shiftId: number; items: string; totalQty: number; remark?: string }): Promise<MaterialRequisition> {
	return api<MaterialRequisition>('/materials', { method: 'POST', body: JSON.stringify(data) });
}

export async function approveMaterial(id: number, status: string, remark?: string): Promise<MaterialRequisition> {
	return api<MaterialRequisition>(`/materials/${id}/approve`, {
		method: 'PATCH',
		body: JSON.stringify({ status, remark })
	});
}

export async function getFollowUps(params?: { status?: string; assigneeId?: number; projectId?: number }): Promise<FollowUp[]> {
	const query = params ? Object.entries(params)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => `${k}=${v}`)
		.join('&') : '';
	return api<FollowUp[]>(`/followups${query ? '?' + query : ''}`);
}

export async function createFollowUp(data: Record<string, unknown>): Promise<FollowUp> {
	return api<FollowUp>('/followups', { method: 'POST', body: JSON.stringify(data) });
}

export async function completeFollowUp(id: number, result: string): Promise<FollowUp> {
	return api<FollowUp>(`/followups/${id}/complete`, {
		method: 'POST',
		body: JSON.stringify({ result })
	});
}

export async function getTraceChain(params?: { projectId?: number; startDate?: string; endDate?: string; workerId?: number }): Promise<TraceChain[]> {
	const query = params ? Object.entries(params)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => `${k}=${v}`)
		.join('&') : '';
	return api<TraceChain[]>(`/trace-chain${query ? '?' + query : ''}`);
}
