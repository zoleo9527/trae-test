import { writable } from 'svelte/store';
import type { User } from '../types';
import { authApi } from '../api/client';

function createAuthStore() {
	const { subscribe, set, update } = writable<{
		user: User | null;
		token: string | null;
		loading: boolean;
	}>({
		user: null,
		token: null,
		loading: true
	});

	return {
		subscribe,
		login: async (username: string, password: string) => {
			const response = await authApi.login(username, password);
			localStorage.setItem('token', response.token);
			set({ user: response.user, token: response.token, loading: false });
			return response;
		},
		logout: () => {
			localStorage.removeItem('token');
			set({ user: null, token: null, loading: false });
		},
		checkAuth: async () => {
			const token = localStorage.getItem('token');
			if (!token) {
				set({ user: null, token: null, loading: false });
				return false;
			}

			try {
				const user = await authApi.getMe();
				set({ user, token, loading: false });
				return true;
			} catch (e) {
				localStorage.removeItem('token');
				set({ user: null, token: null, loading: false });
				return false;
			}
		},
		setLoading: (loading: boolean) => {
			update(state => ({ ...state, loading }));
		}
	};
}

export const auth = createAuthStore();
