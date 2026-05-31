const API_BASE = '/api';

async function request(url, options = {}) {
	const res = await fetch(`${API_BASE}${url}`, {
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		...options
	});
	return res.json();
}

export const api = {
	getDashboardStats: () => request('/dashboard/stats'),
	getRecentActivities: () => request('/dashboard/activities'),

	getMembers: (params = {}) => {
		const query = new URLSearchParams(params).toString();
		return request(`/members${query ? '?' + query : ''}`);
	},
	getMember: (id) => request(`/members/${id}`),
	createMember: (data) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
	updateMember: (id, data) => request(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
	recharge: (id, data) => request(`/members/${id}/recharge`, { method: 'POST', body: JSON.stringify(data) }),
	getRecharges: (id) => request(`/members/${id}/recharges`),

	getOrders: (params = {}) => {
		const query = new URLSearchParams(params).toString();
		return request(`/orders${query ? '?' + query : ''}`);
	},
	getOrder: (id) => request(`/orders/${id}`),
	createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
	updateOrder: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
	batchUpdateOrderStatus: (data) => request('/orders/batch/status', { method: 'POST', body: JSON.stringify(data) }),
	updateMaterialLoss: (id, data) => request(`/orders/${id}/loss`, { method: 'POST', body: JSON.stringify(data) }),

	getRefunds: (params = {}) => {
		const query = new URLSearchParams(params).toString();
		return request(`/refunds${query ? '?' + query : ''}`);
	},
	getRefund: (id) => request(`/refunds/${id}`),
	createRefund: (data) => request('/refunds', { method: 'POST', body: JSON.stringify(data) }),
	approveRefund: (id, data) => request(`/refunds/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
	rejectRefund: (id, data) => request(`/refunds/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
	batchReviewRefunds: (data) => request('/refunds/batch/review', { method: 'POST', body: JSON.stringify(data) }),

	getProducts: (params = {}) => {
		const query = new URLSearchParams(params).toString();
		return request(`/products${query ? '?' + query : ''}`);
	},
	getProduct: (id) => request(`/products/${id}`),
	createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
	updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) })
};
