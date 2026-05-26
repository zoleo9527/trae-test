import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'

export const useFuelStore = defineStore('fuel', () => {
  const records = ref([])
  const loading = ref(false)

  async function loadRecords() {
    loading.value = true
    const data = await storage.get('fuelRecords')
    if (data) {
      records.value = data
    }
    loading.value = false
  }

  async function addRecord(record, operator) {
    const newRecord = {
      id: 'f' + Date.now(),
      ...record,
      totalPrice: record.amount * record.unitPrice,
      createBy: operator.id,
      createTime: new Date().toLocaleString('zh-CN')
    }
    records.value.push(newRecord)
    await storage.set('fuelRecords', records.value)
    return newRecord
  }

  function getRecordsByTaskId(taskId) {
    return computed(() => records.value.filter(r => r.taskId === taskId))
  }

  function getRecordsByOperatorId(operatorId) {
    return computed(() => records.value.filter(r => r.operatorId === operatorId))
  }

  const stats = computed(() => {
    const totalAmount = records.value.reduce((sum, r) => sum + r.amount, 0)
    const totalPrice = records.value.reduce((sum, r) => sum + r.totalPrice, 0)
    const count = records.value.length
    return { totalAmount, totalPrice, count }
  })

  return {
    records,
    loading,
    loadRecords,
    addRecord,
    getRecordsByTaskId,
    getRecordsByOperatorId,
    stats
  }
})
