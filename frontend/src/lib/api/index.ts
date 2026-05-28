import { get, post, put, del } from './client';
import type {
	User,
	CollabProduct,
	Store,
	Inventory,
	Order,
	Inspection,
	ExceptionRecord,
	ReviewRecord,
	DashboardData,
	OperationLog
} from '$lib/types';

export const authApi = {
	login: (username: string) => post<{ token: string; user: User }>('/login', { username }),
	getCurrentUser: () => get<User>('/user'),
	listUsers: () => get<User[]>('/users')
};

export const dashboardApi = {
	getData: () => get<DashboardData>('/dashboard')
};

export const productApi = {
	list: (params?: { status?: string; category?: string }) => {
		const query = new URLSearchParams();
		if (params?.status) query.set('status', params.status);
		if (params?.category) query.set('category', params.category);
		const qs = query.toString();
		return get<CollabProduct[]>(`/products${qs ? `?${qs}` : ''}`);
	},
	get: (id: string) => get<{ product: CollabProduct; logs: OperationLog[] }>(`/products/${id}`),
	create: (data: any) => post<CollabProduct>('/products', data),
	update: (id: string, data: any) => put<CollabProduct>(`/products/${id}`, data),
	submit: (id: string) => post<CollabProduct>(`/products/${id}/submit`),
	approve: (id: string, remark?: string) => post<CollabProduct>(`/products/${id}/approve`, { remark }),
	reject: (id: string, reason: string) => post<CollabProduct>(`/products/${id}/reject`, { reason }),
	onShelf: (id: string) => post<CollabProduct>(`/products/${id}/on-shelf`),
	offShelf: (id: string) => post<CollabProduct>(`/products/${id}/off-shelf`),
	completeReview: (id: string, reviewNote: string) =>
		post<CollabProduct>(`/products/${id}/complete-review`, { reviewNote }),
	getReviewSummary: (id: string) => get<any>(`/products/${id}/review-summary`)
};

export const storeApi = {
	list: () => get<Store[]>('/stores')
};

export const orderApi = {
	list: (params?: { type?: string; status?: string; storeCode?: string }) => {
		const query = new URLSearchParams();
		if (params?.type) query.set('type', params.type);
		if (params?.status) query.set('status', params.status);
		if (params?.storeCode) query.set('storeCode', params.storeCode);
		const qs = query.toString();
		return get<Order[]>(`/orders${qs ? `?${qs}` : ''}`);
	},
	get: (id: string) => get<{ order: Order; logs: OperationLog[] }>(`/orders/${id}`),
	create: (data: any) => post<Order>('/orders', data),
	approve: (id: string) => post<Order>(`/orders/${id}/approve`),
	reject: (id: string, reason: string) => post<Order>(`/orders/${id}/reject`, { reason }),
	ship: (id: string) => post<Order>(`/orders/${id}/ship`),
	receive: (id: string) => post<Order>(`/orders/${id}/receive`),
	complete: (id: string) => post<Order>(`/orders/${id}/complete`)
};

export const inventoryApi = {
	list: (params?: { productId?: string; storeCode?: string }) => {
		const query = new URLSearchParams();
		if (params?.productId) query.set('productId', params.productId);
		if (params?.storeCode) query.set('storeCode', params.storeCode);
		const qs = query.toString();
		return get<Inventory[]>(`/inventory${qs ? `?${qs}` : ''}`);
	},
	get: (id: string) => get<{ inventory: Inventory; logs: OperationLog[] }>(`/inventory/${id}`),
	stockCount: (id: string, actualQty: number, remark?: string) =>
		post<Inventory>(`/inventory/${id}/stock-count`, { actualQty, remark }),
	adjust: (id: string, quantity: number, reason: string) =>
		post<Inventory>(`/inventory/${id}/adjust`, { quantity, reason })
};

export const inspectionApi = {
	list: (params?: { status?: string; productId?: string; storeId?: string }) => {
		const query = new URLSearchParams();
		if (params?.status) query.set('status', params.status);
		if (params?.productId) query.set('productId', params.productId);
		if (params?.storeId) query.set('storeId', params.storeId);
		const qs = query.toString();
		return get<Inspection[]>(`/inspections${qs ? `?${qs}` : ''}`);
	},
	get: (id: string) => get<{ inspection: Inspection; logs: OperationLog[] }>(`/inspections/${id}`),
	create: (data: any) => post<Inspection>('/inspections', data),
	followUp: (id: string, followUpNote: string, followUpBy: string) =>
		post<Inspection>(`/inspections/${id}/follow-up`, { followUpNote, followUpBy }),
	close: (id: string, closingNote?: string) =>
		post<Inspection>(`/inspections/${id}/close`, { closingNote })
};

export const exceptionApi = {
	list: (params?: {
		status?: string;
		type?: string;
		severity?: string;
		assignedTo?: string;
		needReview?: boolean;
	}) => {
		const query = new URLSearchParams();
		if (params?.status) query.set('status', params.status);
		if (params?.type) query.set('type', params.type);
		if (params?.severity) query.set('severity', params.severity);
		if (params?.assignedTo) query.set('assignedTo', params.assignedTo);
		if (params?.needReview !== undefined) query.set('needReview', String(params.needReview));
		const qs = query.toString();
		return get<ExceptionRecord[]>(`/exceptions${qs ? `?${qs}` : ''}`);
	},
	get: (id: string) => get<{ exception: ExceptionRecord; logs: OperationLog[] }>(`/exceptions/${id}`),
	create: (data: any) => post<ExceptionRecord>('/exceptions', data),
	assign: (id: string, assignedTo: string) =>
		post<ExceptionRecord>(`/exceptions/${id}/assign`, { assignedTo }),
	resolve: (id: string, resolutionNote: string, needReview: boolean) =>
		post<ExceptionRecord>(`/exceptions/${id}/resolve`, { resolutionNote, needReview }),
	review: (id: string, reviewNote: string) =>
		post<ExceptionRecord>(`/exceptions/${id}/review`, { reviewNote }),
	reopen: (id: string) => post<ExceptionRecord>(`/exceptions/${id}/reopen`),
	delete: (id: string) => del(`/exceptions/${id}`)
};

export const reviewApi = {
	list: (params?: { productId?: string; reviewType?: string }) => {
		const query = new URLSearchParams();
		if (params?.productId) query.set('productId', params.productId);
		if (params?.reviewType) query.set('reviewType', params.reviewType);
		const qs = query.toString();
		return get<ReviewRecord[]>(`/reviews${qs ? `?${qs}` : ''}`);
	},
	get: (id: string) => get<{ review: ReviewRecord; logs: OperationLog[] }>(`/reviews/${id}`),
	create: (data: any) => post<ReviewRecord>('/reviews', data)
};
