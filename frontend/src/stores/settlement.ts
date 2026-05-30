import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MonthlySettlement, SettlementItem } from '@/types';
import { useOrderStore } from './order';
import { useComplaintStore } from './complaint';
import dayjs from 'dayjs';

export const useSettlementStore = defineStore('settlement', () => {
  const settlementConfirmations = ref<Map<string, {
    factoryConfirmedBy?: string;
    factoryConfirmedAt?: string;
    storeConfirmedBy?: string;
    storeConfirmedAt?: string;
    status: 'draft' | 'pending' | 'confirmed' | 'completed';
  }>>(new Map());

  function getConfirmationKey(storeId: string, month: string) {
    return `settle:${storeId}:${month}`;
  }

  function getSettlementByStoreAndMonth(storeId: string, month: string) {
    const key = getConfirmationKey(storeId, month);
    return settlementConfirmations.value.get(key);
  }

  function ensureConfirmation(storeId: string, month: string) {
    const key = getConfirmationKey(storeId, month);
    if (!settlementConfirmations.value.has(key)) {
      settlementConfirmations.value.set(key, { status: 'draft' });
    }
    return settlementConfirmations.value.get(key)!;
  }

  function parseSettlementId(id: string) {
    const parts = id.split(':');
    if (parts.length >= 3 && parts[0] === 'settle') {
      const month = parts[parts.length - 1];
      const storeId = parts.slice(1, -1).join(':');
      return { storeId, month };
    }
    const legacyParts = id.replace('settle-', '').split('-');
    if (legacyParts.length >= 3) {
      const month = `${legacyParts[legacyParts.length - 2]}-${legacyParts[legacyParts.length - 1]}`;
      const storeId = legacyParts.slice(0, -2).join('-');
      return { storeId, month };
    }
    return { storeId: '', month: '' };
  }

  function calculateMonthStats(month: string) {
    const orderStore = useOrderStore();
    const complaintStore = useComplaintStore();

    const monthPrefix = month;

    const monthOrders = orderStore.orders.filter(o => o.receivedAt.startsWith(monthPrefix));
    const totalOrders = monthOrders.length;
    const totalItems = monthOrders.reduce((sum, o) => sum + o.items.length, 0);
    const totalAmount = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const monthComplaints = complaintStore.complaints.filter(c => {
      const order = orderStore.getOrderById(c.orderId);
      return order && order.receivedAt.startsWith(monthPrefix) &&
             (c.status === 'approved' || c.status === 'resolved');
    });
    const totalCompensation = monthComplaints.reduce((sum, c) => sum + (c.approvedCompensation || 0), 0);

    return {
      totalOrders,
      totalItems,
      totalAmount,
      totalCompensation,
      netAmount: totalAmount - totalCompensation
    };
  }

  function getDynamicSettlements(month?: string) {
    const orderStore = useOrderStore();
    const complaintStore = useComplaintStore();

    const storeMonthMap: Record<string, Record<string, {
      orders: typeof orderStore.orders;
      complaints: typeof complaintStore.complaints;
    }>> = {};

    orderStore.orders.forEach(order => {
      const orderMonth = order.receivedAt.substring(0, 7);
      if (month && orderMonth !== month) return;

      if (!storeMonthMap[order.storeId]) {
        storeMonthMap[order.storeId] = {};
      }
      if (!storeMonthMap[order.storeId][orderMonth]) {
        storeMonthMap[order.storeId][orderMonth] = { orders: [], complaints: [] };
      }
      storeMonthMap[order.storeId][orderMonth].orders.push(order);
    });

    complaintStore.complaints.forEach(complaint => {
      if (complaint.status === 'approved' || complaint.status === 'resolved') {
        const order = orderStore.getOrderById(complaint.orderId);
        if (order) {
          const orderMonth = order.receivedAt.substring(0, 7);
          if (month && orderMonth !== month) return;

          if (!storeMonthMap[order.storeId]) {
            storeMonthMap[order.storeId] = {};
          }
          if (!storeMonthMap[order.storeId][orderMonth]) {
            storeMonthMap[order.storeId][orderMonth] = { orders: [], complaints: [] };
          }
          storeMonthMap[order.storeId][orderMonth].complaints.push(complaint);
        }
      }
    });

    const dynamicSettlements: MonthlySettlement[] = [];

    Object.entries(storeMonthMap).forEach(([storeId, months]) => {
      Object.entries(months).forEach(([m, data]) => {
        const confirmation = getSettlementByStoreAndMonth(storeId, m);
        const storeName = data.orders[0]?.storeName || '';
        const totalOrders = data.orders.length;
        const totalItems = data.orders.reduce((sum, o) => sum + o.items.length, 0);
        const totalAmount = data.orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalCompensation = data.complaints.reduce((sum, c) => sum + (c.approvedCompensation || 0), 0);

        const items: SettlementItem[] = data.orders.map(order => {
          const orderComplaints = data.complaints.filter(c => c.orderId === order.id);
          const compensation = orderComplaints.reduce((sum, c) => sum + (c.approvedCompensation || 0), 0);
          return {
            orderNo: order.orderNo,
            storeName: order.storeName,
            customerName: order.customerName,
            itemCount: order.items.length,
            orderAmount: order.totalAmount,
            compensationAmount: compensation,
            netAmount: order.totalAmount - compensation,
            status: (confirmation?.status === 'completed' || confirmation?.status === 'confirmed')
              ? 'confirmed' as const
              : 'pending' as const,
            confirmedBy: confirmation?.storeConfirmedBy,
            confirmedAt: confirmation?.storeConfirmedAt
          };
        });

        const settlementStatus = confirmation?.status || 'draft';

        dynamicSettlements.push({
          id: `settle:${storeId}:${m}`,
          month: m,
          storeId,
          storeName,
          totalOrders,
          totalItems,
          totalAmount,
          totalCompensation,
          netAmount: totalAmount - totalCompensation,
          items,
          status: settlementStatus,
          factoryConfirmedBy: confirmation?.factoryConfirmedBy,
          factoryConfirmedAt: confirmation?.factoryConfirmedAt,
          storeConfirmedBy: confirmation?.storeConfirmedBy,
          storeConfirmedAt: confirmation?.storeConfirmedAt
        });
      });
    });

    return dynamicSettlements.sort((a, b) => b.month.localeCompare(a.month));
  }

  function confirmFactorySettlement(id: string, operator: string) {
    const { storeId, month } = parseSettlementId(id);
    if (!storeId || !month) return;

    const confirmation = ensureConfirmation(storeId, month);
    if (!confirmation.factoryConfirmedBy) {
      confirmation.factoryConfirmedBy = operator;
      confirmation.factoryConfirmedAt = dayjs().format('YYYY-MM-DD HH:mm');
      if (confirmation.storeConfirmedBy) {
        confirmation.status = 'completed';
      } else {
        confirmation.status = 'confirmed';
      }
    }
  }

  function confirmStoreSettlement(id: string, operator: string) {
    const { storeId, month } = parseSettlementId(id);
    if (!storeId || !month) return;

    const confirmation = ensureConfirmation(storeId, month);
    if (!confirmation.storeConfirmedBy) {
      confirmation.storeConfirmedBy = operator;
      confirmation.storeConfirmedAt = dayjs().format('YYYY-MM-DD HH:mm');
      if (confirmation.factoryConfirmedBy) {
        confirmation.status = 'completed';
      } else {
        confirmation.status = 'confirmed';
      }
    }
  }

  return {
    settlementConfirmations,
    calculateMonthStats,
    getDynamicSettlements,
    confirmFactorySettlement,
    confirmStoreSettlement
  };
});
