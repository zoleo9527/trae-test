import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Batch, WashType } from '@/types';
import { mockBatches } from '@/data/mockData';
import { useOrderStore } from './order';
import dayjs from 'dayjs';

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

  function getBatchItems(batchId: string) {
    const orderStore = useOrderStore();
    const batch = getBatchById(batchId);
    if (!batch) return [];

    const items: { orderId: string; orderNo: string; item: any }[] = [];
    batch.orderIds.forEach(orderId => {
      const order = orderStore.getOrderById(orderId);
      if (order) {
        order.items.forEach(item => {
          if (item.batchId === batchId) {
            items.push({ orderId, orderNo: order.orderNo, item });
          }
        });
      }
    });
    return items;
  }

  function getBatchItemCount(batchId: string) {
    return getBatchItems(batchId).length;
  }

  function createBatch(washType: WashType, operator: string, remark?: string) {
    const newBatchNo = `BATCH-${dayjs().format('YYYYMMDD')}-${String(batches.value.length + 1).padStart(3, '0')}`;

    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      batchNo: newBatchNo,
      washType,
      itemCount: 0,
      orderIds: [],
      status: 'washing',
      startedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      operator,
      remark
    };

    batches.value.push(newBatch);
    return newBatch;
  }

  function syncBatchData(batchId: string) {
    const orderStore = useOrderStore();
    const batch = getBatchById(batchId);
    if (!batch) return;

    const allItems: { orderId: string; item: any }[] = [];
    orderStore.orders.forEach(order => {
      order.items.forEach(item => {
        if (item.batchId === batchId) {
          allItems.push({ orderId: order.id, item });
        }
      });
    });

    batch.itemCount = allItems.length;
    batch.orderIds = [...new Set(allItems.map(i => i.orderId))];
  }

  function completeBatch(batchId: string, operator: string) {
    const batch = getBatchById(batchId);
    if (batch) {
      batch.status = 'completed';
      batch.completedAt = dayjs().format('YYYY-MM-DD HH:mm');
    }
  }

  function addOrderToBatch(batchId: string, orderId: string) {
    const batch = getBatchById(batchId);
    if (batch && !batch.orderIds.includes(orderId)) {
      batch.orderIds.push(orderId);
    }
  }

  return {
    batches,
    activeBatches,
    completedBatches,
    getBatchById,
    getBatchesByOrderId,
    getBatchItems,
    getBatchItemCount,
    createBatch,
    syncBatchData,
    completeBatch,
    addOrderToBatch
  };
});
