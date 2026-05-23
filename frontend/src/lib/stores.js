import { writable } from 'svelte/store';

export const currentUser = writable(null);
export const userRole = writable('inspector');

export const apiUrl = 'http://localhost:8080/api';

export function getHeaders() {
	return {
		'Content-Type': 'application/json',
		'X-User-Role': localStorage.getItem('userRole') || 'inspector'
	};
}
