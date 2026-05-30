import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RewashRecord } from '@/types';
import { mockRewashRecords } from '@/data/mockData';
import dayjs from 'dayjs';

export const useRewashStore = defineStore('rewash', () => {
  const records = ref<RewashRecord[]>([...mockRewashRecords]);

  function getRecordsByOrderId(orderId: string) {
    return records.value.filter(r => r.orderId === orderId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  function getRecordsByItemId(itemId: string) {
    return records.value.filter(r => r.itemId === itemId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  function addRecord(record: Omit<RewashRecord, 'id' | 'createdAt'>) {
    const newRecord: RewashRecord = {
      ...record,
      id: `rewash-${Date.now()}`,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm')
    };
    records.value.push(newRecord);
    return newRecord;
  }

  return {
    records,
    getRecordsByOrderId,
    getRecordsByItemId,
    addRecord
  };
});
