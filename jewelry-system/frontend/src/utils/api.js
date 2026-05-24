const API_BASE = '/api';

async function request(url, options = {}) {
  try {
    const isFormData = options.body instanceof FormData;
    const headers = isFormData 
      ? options.headers 
      : {
          'Content-Type': 'application/json',
          ...options.headers
        };

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `请求失败: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查后端服务是否启动');
    }
    throw error;
  }
}

export const api = {
  getDashboardStats: () => request('/dashboard/stats'),
  getMyTasks: () => request('/dashboard/mytasks'),
  getSupplementAlerts: () => request('/dashboard/supplement-alerts'),
  getDashboardRefunds: () => request('/dashboard/refunds'),
  getCases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/cases${query ? `?${query}` : ''}`);
  },
  getCaseById: (id) => request(`/cases/${id}`),
  getCaseDocuments: (id) => request(`/cases/${id}/documents`),
  getCaseNotes: (id) => request(`/cases/${id}/notes`),
  addCaseNote: (caseId, content) => request(`/cases/${caseId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  uploadSupplement: (caseId, supplementId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/cases/${caseId}/supplements/${supplementId}/upload`, {
      method: 'POST',
      body: formData
    });
  },
  getSupplements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/supplements${query ? `?${query}` : ''}`);
  },
  getRefunds: () => request('/refunds'),
  getRefundById: (id) => request(`/refunds/${id}`),
  addRefundMessage: (refundId, content) => request(`/refunds/${refundId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  getNotifications: () => request('/notifications'),
  getReportStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/stats${query ? `?${query}` : ''}`);
  },
  getHealth: () => request('/health')
};
