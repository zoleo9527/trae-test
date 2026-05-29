import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api';
import type { WorkOrder } from '@/env';

export const useWorkOrdersStore = defineStore('workOrders', () => {
  const workOrders = ref<WorkOrder[]>([]);
  const currentWorkOrder = ref<WorkOrder | null>(null);
  const stats = ref<any>(null);
  const loading = ref(false);

  async function fetchWorkOrders(query?: any) {
    loading.value = true;
    try {
      const response = await api.get('/work-orders', { params: query });
      workOrders.value = response.data;
      return response.data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats() {
    const response = await api.get('/work-orders/stats');
    stats.value = response.data;
    return response.data;
  }

  async function fetchWorkOrder(id: string) {
    const response = await api.get(`/work-orders/${id}`);
    currentWorkOrder.value = response.data;
    return response.data;
  }

  async function updateWorkOrder(id: string, data: any) {
    const response = await api.patch(`/work-orders/${id}`, data);
    currentWorkOrder.value = response.data;
    return response.data;
  }

  async function batchUpdate(data: any) {
    const response = await api.post('/work-orders/batch', data);
    return response.data;
  }

  async function addNote(id: string, data: any) {
    const response = await api.post(`/work-orders/${id}/notes`, data);
    return response.data;
  }

  async function createCompensation(workOrderId: string, data: any) {
    const response = await api.post(`/compensation/work-order/${workOrderId}`, data);
    return response.data;
  }

  async function updateCompensation(workOrderId: string, data: any) {
    const response = await api.patch(`/compensation/work-order/${workOrderId}`, data);
    return response.data;
  }

  return {
    workOrders,
    currentWorkOrder,
    stats,
    loading,
    fetchWorkOrders,
    fetchStats,
    fetchWorkOrder,
    updateWorkOrder,
    batchUpdate,
    addNote,
    createCompensation,
    updateCompensation,
  };
});
