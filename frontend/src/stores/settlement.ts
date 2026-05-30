import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MonthlySettlement } from '@/types';
import { mockMonthlySettlements } from '@/data/mockData';
import dayjs from 'dayjs';

export const useSettlementStore = defineStore('settlement', () => {
  const settlements = ref<MonthlySettlement[]>([...mockMonthlySettlements]);

  function getSettlementById(id: string) {
    return settlements.value.find(s => s.id === id);
  }

  function getSettlementsByMonth(month: string) {
    return settlements.value.filter(s => s.month === month);
  }

  function confirmFactorySettlement(id: string, operator: string) {
    const settlement = settlements.value.find(s => s.id === id);
    if (settlement) {
      settlement.factoryConfirmedBy = operator;
      settlement.factoryConfirmedAt = dayjs().format('YYYY-MM-DD HH:mm');
      if (settlement.storeConfirmedBy) {
        settlement.status = 'completed';
      } else {
        settlement.status = 'confirmed';
      }
    }
  }

  function confirmStoreSettlement(id: string, operator: string) {
    const settlement = settlements.value.find(s => s.id === id);
    if (settlement) {
      settlement.storeConfirmedBy = operator;
      settlement.storeConfirmedAt = dayjs().format('YYYY-MM-DD HH:mm');
      if (settlement.factoryConfirmedBy) {
        settlement.status = 'completed';
      } else {
        settlement.status = 'confirmed';
      }
    }
  }

  return {
    settlements,
    getSettlementById,
    getSettlementsByMonth,
    confirmFactorySettlement,
    confirmStoreSettlement
  };
});
