import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MonthlySettlement, SettlementItem } from '@/types';
import { mockMonthlySettlements } from '@/data/mockData';
import { useOrderStore } from './order';
import { useComplaintStore } from './complaint';
import dayjs from 'dayjs';

export const useSettlementStore = defineStore('settlement', () => {
  const settlements = ref<MonthlySettlement[]>([...mockMonthlySettlements]);

  function getSettlementById(id: string) {
    return settlements.value.find(s => s.id === id);
  }

  function getSettlementsByMonth(month: string) {
    return settlements.value.filter(s => s.month === month);
  }

  function getSettlementByStoreAndMonth(storeId: string, month: string) {
    return settlements.value.find(s => s.storeId === storeId && s.month === month);
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

  function getDynamicSettlements() {
    const orderStore = useOrderStore();
    const complaintStore = useComplaintStore();
    
    const storeMonthMap: Record<string, Record<string, {
      orders: typeof orderStore.orders;
      complaints: typeof complaintStore.complaints;
    }>> = {};

    orderStore.orders.forEach(order => {
      const month = order.receivedAt.substring(0, 7);
      if (!storeMonthMap[order.storeId]) {
        storeMonthMap[order.storeId] = {};
      }
      if (!storeMonthMap[order.storeId][month]) {
        storeMonthMap[order.storeId][month] = { orders: [], complaints: [] };
      }
      storeMonthMap[order.storeId][month].orders.push(order);
    });

    complaintStore.complaints.forEach(complaint => {
      if (complaint.status === 'approved' || complaint.status === 'resolved') {
        const order = orderStore.getOrderById(complaint.orderId);
        if (order) {
          const month = order.receivedAt.substring(0, 7);
          if (!storeMonthMap[order.storeId]) {
            storeMonthMap[order.storeId] = {};
          }
          if (!storeMonthMap[order.storeId][month]) {
            storeMonthMap[order.storeId][month] = { orders: [], complaints: [] };
          }
          storeMonthMap[order.storeId][month].complaints.push(complaint);
        }
      }
    });

    const dynamicSettlements: MonthlySettlement[] = [];
    
    Object.entries(storeMonthMap).forEach(([storeId, months]) => {
      Object.entries(months).forEach(([month, data]) => {
        const existingSettlement = getSettlementByStoreAndMonth(storeId, month);
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
            status: existingSettlement?.status === 'completed' ? 'confirmed' : 'pending',
            confirmedBy: existingSettlement?.storeConfirmedBy,
            confirmedAt: existingSettlement?.storeConfirmedAt
          };
        });

        if (existingSettlement) {
          dynamicSettlements.push({
            ...existingSettlement,
            totalOrders,
            totalItems,
            totalAmount,
            totalCompensation,
            netAmount: totalAmount - totalCompensation,
            items
          });
        } else {
          dynamicSettlements.push({
            id: `settle-dynamic-${storeId}-${month}`,
            month,
            storeId,
            storeName,
            totalOrders,
            totalItems,
            totalAmount,
            totalCompensation,
            netAmount: totalAmount - totalCompensation,
            items,
            status: 'draft'
          });
        }
      });
    });

    settlements.value.filter(s => !dynamicSettlements.find(ds => ds.id === s.id)).forEach(s => {
      dynamicSettlements.push(s);
    });

    return dynamicSettlements.sort((a, b) => b.month.localeCompare(a.month));
  }

  function updateSettlementCompensation(storeId: string, month: string, compensationAmount: number) {
    const settlement = getSettlementByStoreAndMonth(storeId, month);
    if (settlement) {
      settlement.totalCompensation += compensationAmount;
      settlement.netAmount = settlement.totalAmount - settlement.totalCompensation;
    }
  }

  function confirmFactorySettlement(id: string, operator: string) {
    const settlement = settlements.value.find(s => s.id === id) || getDynamicSettlements().find(s => s.id === id);
    if (settlement && !settlement.factoryConfirmedBy) {
      settlement.factoryConfirmedBy = operator;
      settlement.factoryConfirmedAt = dayjs().format('YYYY-MM-DD HH:mm');
      if (settlement.storeConfirmedBy) {
        settlement.status = 'completed';
      } else {
        settlement.status = 'confirmed';
      }
      
      if (!settlements.value.find(s => s.id === settlement.id)) {
        settlements.value.push(settlement);
      }
    }
  }

  function confirmStoreSettlement(id: string, operator: string) {
    const settlement = settlements.value.find(s => s.id === id) || getDynamicSettlements().find(s => s.id === id);
    if (settlement && !settlement.storeConfirmedBy) {
      settlement.storeConfirmedBy = operator;
      settlement.storeConfirmedAt = dayjs().format('YYYY-MM-DD HH:mm');
      if (settlement.factoryConfirmedBy) {
        settlement.status = 'completed';
      } else {
        settlement.status = 'confirmed';
      }
      
      if (!settlements.value.find(s => s.id === settlement.id)) {
        settlements.value.push(settlement);
      }
    }
  }

  return {
    settlements,
    getSettlementById,
    getSettlementsByMonth,
    getSettlementByStoreAndMonth,
    calculateMonthStats,
    getDynamicSettlements,
    updateSettlementCompensation,
    confirmFactorySettlement,
    confirmStoreSettlement
  };
});
