import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '$lib/types';

function createUserStore() {
	const { subscribe, set, update } = writable<User | null>(null);

	function login(user: User, token: string) {
		if (browser) {
			localStorage.setItem('token', token);
			localStorage.setItem('user', JSON.stringify(user));
		}
		set(user);
	}

	function logout() {
		if (browser) {
			localStorage.removeItem('token');
			localStorage.removeItem('user');
		}
		set(null);
	}

	function loadFromStorage() {
		if (browser) {
			const stored = localStorage.getItem('user');
			if (stored) {
				try {
					set(JSON.parse(stored));
				} catch (e) {
					console.error('Failed to parse stored user', e);
				}
			}
		}
	}

	return {
		subscribe,
		login,
		logout,
		loadFromStorage
	};
}

export const user = createUserStore();
