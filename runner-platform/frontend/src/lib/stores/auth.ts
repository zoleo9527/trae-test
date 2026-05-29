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

export const rolePermissions: Record<string, {
	canViewAllOrders: boolean;
	canViewAllAppeals: boolean;
	canViewAllSubsidies: boolean;
	canCreateOrder: boolean;
	canAssignOrder: boolean;
	canReviewAppeal: boolean;
	visibleStatuses: string[];
	canAppealStatuses: string[];
}> = {
	manager: {
		canViewAllOrders: true,
		canViewAllAppeals: true,
		canViewAllSubsidies: true,
		canCreateOrder: true,
		canAssignOrder: false,
		canReviewAppeal: true,
		visibleStatuses: ['pending', 'assigned', 'picked_up', 'delivering', 'delivered', 'timeout', 'appealing', 'resolved', 'cancelled'],
		canAppealStatuses: ['delivering', 'timeout', 'appealing']
	},
	dispatcher: {
		canViewAllOrders: true,
		canViewAllAppeals: true,
		canViewAllSubsidies: true,
		canCreateOrder: true,
		canAssignOrder: true,
		canReviewAppeal: false,
		visibleStatuses: ['pending', 'assigned', 'picked_up', 'delivering', 'delivered', 'timeout', 'appealing', 'resolved', 'cancelled'],
		canAppealStatuses: ['delivering', 'timeout', 'appealing']
	},
	customer_service: {
		canViewAllOrders: false,
		canViewAllAppeals: false,
		canViewAllSubsidies: false,
		canCreateOrder: false,
		canAssignOrder: false,
		canReviewAppeal: false,
		visibleStatuses: ['timeout', 'appealing', 'resolved'],
		canAppealStatuses: ['timeout', 'appealing']
	},
	runner: {
		canViewAllOrders: false,
		canViewAllAppeals: false,
		canViewAllSubsidies: false,
		canCreateOrder: false,
		canAssignOrder: false,
		canReviewAppeal: false,
		visibleStatuses: ['assigned', 'picked_up', 'delivering', 'delivered', 'timeout', 'appealing', 'resolved'],
		canAppealStatuses: ['delivering', 'timeout']
	}
};
