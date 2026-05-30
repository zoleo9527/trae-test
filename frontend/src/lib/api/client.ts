import type {
	User,
	AuthResponse,
	Booking,
	Member,
	CoachSchedule,
	Equipment,
	EquipmentRental,
	Exception,
	Wallet,
	WalletRecord,
	CreateBookingRequest,
	ExceptionRequest,
	ResolveExceptionRequest,
	FollowUpRequest
} from '../types';

const BASE_URL = '/api';

function getToken(): string | null {
	if (typeof localStorage !== 'undefined') {
		return localStorage.getItem('token');
	}
	return null;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string> || {})
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${BASE_URL}${url}`, {
		...options,
		headers
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: '请求失败' }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}

	return response.json();
}

export const authApi = {
	login: (username: string, password: string): Promise<AuthResponse> =>
		request('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ username, password })
		}),
	getMe: (): Promise<User> => request('/auth/me')
};

export const bookingApi = {
	list: (params?: { status?: string; date?: string }): Promise<Booking[]> => {
		const searchParams = new URLSearchParams();
		if (params?.status) searchParams.set('status', params.status);
		if (params?.date) searchParams.set('date', params.date);
		const query = searchParams.toString();
		return request(`/bookings${query ? `?${query}` : ''}`);
	},
	get: (id: string): Promise<Booking> => request(`/bookings/${id}`),
	create: (data: CreateBookingRequest): Promise<Booking> =>
		request('/bookings', {
			method: 'POST',
			body: JSON.stringify(data)
		}),
	checkIn: (id: string): Promise<Booking> =>
		request(`/bookings/${id}/checkin`, { method: 'PUT' }),
	checkOut: (id: string): Promise<{ booking: Booking; overstayMinutes: number; warning?: string }> =>
		request(`/bookings/${id}/checkout`, { method: 'PUT' }),
	createException: (id: string, data: ExceptionRequest): Promise<Exception> =>
		request(`/bookings/${id}/exception`, {
			method: 'POST',
			body: JSON.stringify(data)
		}),
	listExceptions: (id: string): Promise<Exception[]> =>
		request(`/bookings/${id}/exceptions`),
	resolveException: (exceptionId: string, data: ResolveExceptionRequest): Promise<Exception> =>
		request(`/bookings/exceptions/${exceptionId}/resolve`, {
			method: 'PUT',
			body: JSON.stringify(data)
		}),
	addFollowUp: (exceptionId: string, data: FollowUpRequest) =>
		request(`/bookings/exceptions/${exceptionId}/followup`, {
			method: 'POST',
			body: JSON.stringify(data)
		})
};

export const coachApi = {
	list: (): Promise<User[]> => request('/coaches'),
	listSchedules: (params?: { date?: string; coachId?: string }): Promise<CoachSchedule[]> => {
		const searchParams = new URLSearchParams();
		if (params?.date) searchParams.set('date', params.date);
		if (params?.coachId) searchParams.set('coachId', params.coachId);
		const query = searchParams.toString();
		return request(`/coaches/schedules${query ? `?${query}` : ''}`);
	},
	createSchedule: (data: Partial<CoachSchedule>): Promise<CoachSchedule> =>
		request('/coaches/schedules', {
			method: 'POST',
			body: JSON.stringify(data)
		}),
	updateSchedule: (id: string, data: Partial<CoachSchedule>): Promise<CoachSchedule> =>
		request(`/coaches/schedules/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data)
		})
};

export const equipmentApi = {
	list: (params?: { status?: string; category?: string }): Promise<Equipment[]> => {
		const searchParams = new URLSearchParams();
		if (params?.status) searchParams.set('status', params.status);
		if (params?.category) searchParams.set('category', params.category);
		const query = searchParams.toString();
		return request(`/equipment${query ? `?${query}` : ''}`);
	},
	borrow: (id: string, data: { bookingId: string; memberId: string }): Promise<EquipmentRental> =>
		request(`/equipment/${id}/borrow`, {
			method: 'POST',
			body: JSON.stringify(data)
		}),
	return: (id: string, data: { conditionIn: string; damageReported: boolean; damageNote?: string }): Promise<{
		rental: EquipmentRental;
		warning?: string;
		damageNote?: string;
	}> =>
		request(`/equipment/${id}/return`, {
			method: 'POST',
			body: JSON.stringify(data)
		}),
	listRentals: (params?: { active?: boolean }): Promise<EquipmentRental[]> => {
		const searchParams = new URLSearchParams();
		if (params?.active) searchParams.set('active', 'true');
		const query = searchParams.toString();
		return request(`/equipment/rentals${query ? `?${query}` : ''}`);
	}
};

export const walletApi = {
	get: (memberId: string): Promise<Wallet> => request(`/wallets/${memberId}`),
	recharge: (memberId: string, data: { amount: number; remark: string }): Promise<{ wallet: Wallet; record: WalletRecord }> =>
		request(`/wallets/${memberId}/recharge`, {
			method: 'POST',
			body: JSON.stringify(data)
		}),
	listRecords: (memberId: string): Promise<{ wallet: Wallet; records: WalletRecord[] }> =>
		request(`/wallets/${memberId}/records`)
};

export const memberApi = {
	list: (): Promise<Member[]> => request('/members')
};

export const userApi = {
	list: (): Promise<User[]> => request('/users')
};
