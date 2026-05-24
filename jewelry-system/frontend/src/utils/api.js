const API_BASE = '/api';

async function request(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
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
  getCases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/cases${query ? `?${query}` : ''}`);
  },
  getCaseById: (id) => request(`/cases/${id}`),
  getSupplements: () => request('/supplements'),
  getRefunds: () => request('/refunds'),
  getNotifications: () => request('/notifications'),
  addCaseNote: (caseId, content) => request(`/cases/${caseId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  uploadSupplement: (caseId, supplementId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/cases/${caseId}/supplements/${supplementId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {}
    });
  },
  getHealth: () => request('/health')
};
