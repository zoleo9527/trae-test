import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
	id: number;
	username: string;
	name: string;
	role: string;
	phone: string;
}

const storedToken = browser ? localStorage.getItem('token') : null;
const storedUser = browser ? JSON.parse(localStorage.getItem('user') || 'null') : null;

export const token = writable<string | null>(storedToken);
export const user = writable<User | null>(storedUser);

export function setAuth(newToken: string, newUser: User) {
	token.set(newToken);
	user.set(newUser);
	if (browser) {
		localStorage.setItem('token', newToken);
		localStorage.setItem('user', JSON.stringify(newUser));
	}
}

export function clearAuth() {
	token.set(null);
	user.set(null);
	if (browser) {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	}
}

export const roleNames: Record<string, string> = {
	manager: '运营经理',
	dispatcher: '调度专员',
	customer_service: '客服',
	runner: '骑手'
};
