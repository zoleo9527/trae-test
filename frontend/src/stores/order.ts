import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Order, OrderStatus, StatusHistory } from '@/types';
import { mockOrders, mockStatusHistory } from '@/data/mockData';
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

  function batchUpdateStatus(orderIds: string[], status: OrderStatus, operator: string, remark?: string) {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    orderIds.forEach(orderId => {
      const order = orders.value.find(o => o.id === orderId);
      if (order) {
        const oldStatus = order.status;
        order.status = status;
        order.updatedAt = now;
        order.updatedBy = operator;
        
        statusHistory.value.push({
          id: `history-${Date.now()}-${Math.random()}`,
          orderId,
          fromStatus: oldStatus,
          toStatus: status,
          operator,
          remark,
          createdAt: now
        });
      }
    });
    clearSelection();
  }

  function updateOrderItemStatus(orderId: string, itemId: string, status: OrderStatus, operator: string, remark?: string) {
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    const order = orders.value.find(o => o.id === orderId);
    if (order) {
      const item = order.items.find(i => i.id === itemId);
      if (item) {
        const oldStatus = item.status;
        item.status = status;
        order.updatedAt = now;
        order.updatedBy = operator;
        
        const allItemsSameStatus = order.items.every(i => i.status === status);
        if (allItemsSameStatus) {
          order.status = status;
        }
        
        statusHistory.value.push({
          id: `history-${Date.now()}-${Math.random()}`,
          orderId,
          itemId,
          fromStatus: oldStatus,
          toStatus: status,
          operator,
          remark,
          createdAt: now
        });
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
    toggleSelectOrder,
    selectAllOrders,
    clearSelection,
    batchUpdateStatus,
    updateOrderItemStatus,
    setFilters
  };
});
