import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { HandoverRecord } from '@/types';
import { mockHandoverRecords } from '@/data/mockData';
import dayjs from 'dayjs';

export const useHandoverStore = defineStore('handover', () => {
  const records = ref<HandoverRecord[]>([...mockHandoverRecords]);

  function getRecordsByOrderId(orderId: string) {
    return records.value.filter(r => r.orderId === orderId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  function getRecordsByStoreId(storeId: string) {
    return records.value.filter(r => r.storeId === storeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  function addRecord(record: Omit<HandoverRecord, 'id' | 'createdAt'>) {
    const newRecord: HandoverRecord = {
      ...record,
      id: `handover-${Date.now()}`,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm')
    };
    records.value.push(newRecord);
    return newRecord;
  }

  return {
    records,
    getRecordsByOrderId,
    getRecordsByStoreId,
    addRecord
  };
});
