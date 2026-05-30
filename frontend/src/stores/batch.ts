import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Batch } from '@/types';
import { mockBatches } from '@/data/mockData';

export const useBatchStore = defineStore('batch', () => {
  const batches = ref<Batch[]>([...mockBatches]);

  const activeBatches = computed(() => batches.value.filter(b => b.status === 'washing'));
  const completedBatches = computed(() => batches.value.filter(b => b.status === 'completed'));

  function getBatchById(id: string) {
    return batches.value.find(b => b.id === id);
  }

  function getBatchesByOrderId(orderId: string) {
    return batches.value.filter(b => b.orderIds.includes(orderId));
  }

  return {
    batches,
    activeBatches,
    completedBatches,
    getBatchById,
    getBatchesByOrderId
  };
});
