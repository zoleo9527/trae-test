import axios from 'axios';
import type { RefundStatus, UserRole, BatchReviewItem } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const workflowApi = {
  submitRefund: (data: {
    packageId: string;
    verificationId?: string;
    customerReason: string;
    refundCount: number;
  }) => api.post('/workflow/refund/submit', data),

  csReview: (data: {
    refundId: string;
    csReviewerId: string;
    csOpinion: string;
    needInspection: boolean;
  }) => api.post('/workflow/refund/cs-review', data),

  submitInspection: (data: {
    refundId: string;
    inspectorId: string;
    inspectionResult: string;
    inspectionPhoto?: string;
  }) => api.post('/workflow/refund/inspection', data),

  finalReview: (data: {
    refundId: string;
    reviewerId: string;
    finalDecision: 'APPROVED' | 'REJECTED';
  }) => api.post('/workflow/refund/final', data),

  batchReview: (data: {
    reviewerId: string;
    items: BatchReviewItem[];
  }) => api.post('/workflow/refund/batch', data),

  getRefunds: (status?: RefundStatus, page = 1, limit = 20) =>
    api.get('/workflow/refunds', { params: { status, page, limit } }),

  getRefundTimeline: (id: string) =>
    api.get(`/workflow/refund/${id}/timeline`),
};

export const stationApi = {
  getOverview: () => api.get('/stations'),
  getDashboard: () => api.get('/stations/dashboard'),
  getAnomalies: (id: string) => api.get(`/stations/${id}/anomalies`),
  escalateIssue: (id: string, reason: string) =>
    api.post(`/stations/${id}/escalate`, { reason }),
};

export const taskApi = {
  getBoard: () => api.get('/tasks/board'),
  getMyTasks: (role: UserRole, assigneeId?: string) =>
    api.get('/tasks/my', { params: { role, assigneeId } }),
  assign: (id: string, assigneeId: string) =>
    api.post(`/tasks/${id}/assign`, { assigneeId }),
  start: (id: string, assigneeId: string) =>
    api.post(`/tasks/${id}/start`, { assigneeId }),
  complete: (id: string, resultNote: string) =>
    api.post(`/tasks/${id}/complete`, { resultNote }),
  createReplenishment: (stationId: string, supplyType: string) =>
    api.post('/tasks/replenishment', { stationId, supplyType }),
};

export default api;
