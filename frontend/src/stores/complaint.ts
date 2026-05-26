import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Complaint, Statistics } from '../types';
import { complaintApi } from '../api';

export const useComplaintStore = defineStore('complaint', () => {
  const complaints = ref<Complaint[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const selectedIds = ref<string[]>([]);
  const statistics = ref<Statistics | null>(null);

  async function fetchComplaints(params?: {
    status?: string;
    page?: number;
    pageSize?: number;
    keyword?: string;
  }) {
    loading.value = true;
    try {
      const result = await complaintApi.getAll(params);
      complaints.value = result.list;
      total.value = result.total;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatistics() {
    try {
      statistics.value = await complaintApi.getStatistics();
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  }

  function toggleSelect(id: string) {
    const index = selectedIds.value.indexOf(id);
    if (index > -1) {
      selectedIds.value.splice(index, 1);
    } else {
      selectedIds.value.push(id);
    }
  }

  function selectAll(ids: string[]) {
    selectedIds.value = [...ids];
  }

  function clearSelection() {
    selectedIds.value = [];
  }

  async function batchAction(action: string) {
    if (selectedIds.value.length === 0) return;
    const result = await complaintApi.batchUpdate(selectedIds.value, action);
    clearSelection();
    return result;
  }

  return {
    complaints,
    total,
    loading,
    selectedIds,
    statistics,
    fetchComplaints,
    fetchStatistics,
    toggleSelect,
    selectAll,
    clearSelection,
    batchAction,
  };
});
