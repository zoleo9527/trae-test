import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Order, OrderStatus, StatusHistory, ClothingItem } from '@/types';
import { mockOrders, mockStatusHistory } from '@/data/mockData';
import { useRewashStore } from './rewash';
import dayjs from 'dayjs';

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([...mockOrders]);
  const statusHistory = ref<StatusHistory[]>([...mockStatusHistory]);
  const selectedOrderIds = ref<string[]>([]);
  const filters = ref({
    status: '' as OrderStatus | '',
    storeId: '',
    keyword: ''
  });

  const filteredOrders = computed(() => {
    return orders.value.filter(order => {
      if (filters.value.status && order.status !== filters.value.status) return false;
      if (filters.value.storeId && order.storeId !== filters.value.storeId) return false;
      if (filters.value.keyword) {
        const kw = filters.value.keyword.toLowerCase();
        return order.orderNo.toLowerCase().includes(kw) ||
          order.customerName.toLowerCase().includes(kw) ||
          order.storeName.toLowerCase().includes(kw);
      }
      return true;
    });
  });

  const pendingCount = computed(() => orders.value.filter(o => o.status === 'pending').length);
  const qualityCheckCount = computed(() => orders.value.filter(o => o.status === 'quality_check').length);
  const rewashCount = computed(() => orders.value.filter(o => o.status === 'rewash').length);
  const complaintCount = computed(() => orders.value.filter(o => o.status === 'complaint').length);

  function getOrderById(id: string) {
    return orders.value.find(o => o.id === id);
  }

  function getOrderHistory(orderId: string) {
    return statusHistory.value.filter(h => h.orderId === orderId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  function getItemById(orderId: string, itemId: string) {
    const order = getOrderById(orderId);
    return order?.items.find(i => i.id === itemId);
  }

  function toggleSelectOrder(orderId: string) {
    const idx = selectedOrderIds.value.indexOf(orderId);
    if (idx > -1) {
      selectedOrderIds.value.splice(idx, 1);
    } else {
      selectedOrderIds.value.push(orderId);
    }
  }

  function selectAllOrders() {
    selectedOrderIds.value = filteredOrders.value.map(o => o.id);
  }

  function clearSelection() {
    selectedOrderIds.value = [];
  }

  function addStatusHistory(orderId: string, itemId: string | undefined, fromStatus: string, toStatus: string, operator: string, remark?: string) {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    statusHistory.value.push({
      id: `history-${Date.now()}-${Math.random()}`,
      orderId,
      itemId,
      fromStatus,
      toStatus,
      operator,
      remark,
      createdAt: now
    });
  }

  function updateOrderStatusFromItems(orderId: string) {
    const order = getOrderById(orderId);
    if (!order) return;
    
    const itemStatuses = [...new Set(order.items.map(i => i.status))];
    if (itemStatuses.length === 1) {
      order.status = itemStatuses[0];
    } else if (itemStatuses.includes('complaint')) {
      order.status = 'complaint';
    } else if (itemStatuses.includes('rewash')) {
      order.status = 'rewash';
    } else if (itemStatuses.includes('quality_check')) {
      order.status = 'quality_check';
    } else {
      order.status = 'quality_check';
    }
  }

  function batchUpdateStatus(orderIds: string[], status: OrderStatus, operator: string, remark?: string, newBatchId?: string) {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    const rewashStore = useRewashStore();

    orderIds.forEach(orderId => {
      const order = orders.value.find(o => o.id === orderId);
      if (order) {
        const oldStatus = order.status;
        
        order.items.forEach(item => {
          const oldItemStatus = item.status;
          item.status = status;
          
          if (status === 'rewash') {
            item.rewashCount += 1;
            rewashStore.addRecord({
              orderId,
              itemId: item.id,
              reason: remark || '质检不合格返洗',
              operator,
              remark: `第${item.rewashCount}次返洗`
            });
          }
          
          if (newBatchId) {
            item.batchId = newBatchId;
          }
          
          addStatusHistory(orderId, item.id, oldItemStatus, status, operator, remark);
        });
        
        order.status = status;
        order.updatedAt = now;
        order.updatedBy = operator;
        if (newBatchId) {
          order.currentBatchId = newBatchId;
        }
      }
    });
    clearSelection();
  }

  function updateOrderItemStatus(orderId: string, itemId: string, status: OrderStatus, operator: string, remark?: string, newBatchId?: string) {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    const rewashStore = useRewashStore();
    const order = orders.value.find(o => o.id === orderId);
    if (order) {
      const item = order.items.find(i => i.id === itemId);
      if (item) {
        const oldStatus = item.status;
        item.status = status;
        order.updatedAt = now;
        order.updatedBy = operator;
        
        if (status === 'rewash') {
          item.rewashCount += 1;
          rewashStore.addRecord({
            orderId,
            itemId,
            reason: remark || '质检不合格返洗',
            operator,
            remark: `第${item.rewashCount}次返洗`
          });
        }
        
        if (newBatchId) {
          item.batchId = newBatchId;
        }
        
        addStatusHistory(orderId, itemId, oldStatus, status, operator, remark);
        updateOrderStatusFromItems(orderId);
      }
    }
  }

  function setFilters(newFilters: typeof filters.value) {
    filters.value = newFilters;
  }

  return {
    orders,
    statusHistory,
    selectedOrderIds,
    filters,
    filteredOrders,
    pendingCount,
    qualityCheckCount,
    rewashCount,
    complaintCount,
    getOrderById,
    getOrderHistory,
    getItemById,
    toggleSelectOrder,
    selectAllOrders,
    clearSelection,
    batchUpdateStatus,
    updateOrderItemStatus,
    setFilters
  };
});
