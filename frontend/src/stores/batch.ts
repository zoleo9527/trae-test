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

  function createBatch(washType: WashType, orderIds: string[], operator: string, remark?: string) {
    const orderStore = useOrderStore();
    const newBatchNo = `BATCH-${dayjs().format('YYYYMMDD')}-${String(batches.value.length + 1).padStart(3, '0')}`;
    
    let itemCount = 0;
    orderIds.forEach(orderId => {
      const order = orderStore.getOrderById(orderId);
      if (order) {
        itemCount += order.items.filter(i => i.batchId === undefined || i.status !== 'completed').length;
      }
    });

    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      batchNo: newBatchNo,
      washType,
      itemCount,
      orderIds: [...new Set(orderIds)],
      status: 'washing',
      startedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      operator,
      remark
    };
    
    batches.value.push(newBatch);
    return newBatch;
  }

  function completeBatch(batchId: string, operator: string) {
    const batch = getBatchById(batchId);
    if (batch) {
      batch.status = 'completed';
      batch.completedAt = dayjs().format('YYYY-MM-DD HH:mm');
    }
  }

  function addOrderToBatch(batchId: string, orderId: string) {
    const orderStore = useOrderStore();
    const batch = getBatchById(batchId);
    if (batch && !batch.orderIds.includes(orderId)) {
      batch.orderIds.push(orderId);
      const order = orderStore.getOrderById(orderId);
      if (order) {
        batch.itemCount += order.items.filter(i => !i.batchId).length;
      }
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
    completeBatch,
    addOrderToBatch
  };
});
