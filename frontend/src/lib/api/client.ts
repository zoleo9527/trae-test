import { browser } from '$app/environment';

const API_BASE = '/api';

function getToken(): string | null {
	if (!browser) return null;
	return localStorage.getItem('token');
}

export async function api<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string> || {})
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE}${endpoint}`, {
		...options,
		headers
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}

	return response.json();
}

export function get<T>(endpoint: string) {
	return api<T>(endpoint, { method: 'GET' });
}

export function post<T>(endpoint: string, body?: any) {
	return api<T>(endpoint, {
		method: 'POST',
		body: body ? JSON.stringify(body) : undefined
	});
}

export function put<T>(endpoint: string, body?: any) {
	return api<T>(endpoint, {
		method: 'PUT',
		body: body ? JSON.stringify(body) : undefined
	});
}

export function del<T>(endpoint: string) {
	return api<T>(endpoint, { method: 'DELETE' });
}
