import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'
import { addHistoryLog } from './history'
import { useTaskStore } from './task'
import { usePlotStore } from './plot'

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

    await addHistoryLog({
      type: 'fuel',
      action: 'create',
      targetId: newRecord.id,
      targetName: `${record.plotName}油料登记`,
      content: `登记加油：${record.amount}升，单价${record.unitPrice}元/升，合计${newRecord.totalPrice}元`,
      operatorId: operator.id,
      operatorName: operator.name
    })

    if (record.taskId) {
      const taskStore = useTaskStore()
      await taskStore.loadTasks()
      const task = taskStore.tasks.find(t => t.id === record.taskId)
      if (task) {
        const totalFuel = (task.fuelUsed || 0) + record.amount
        await taskStore.updateTask(record.taskId, { fuelUsed: totalFuel }, operator)
      }
    }

    return newRecord
  }

  function getRecordsByTaskId(taskId) {
    return computed(() => records.value.filter(r => r.taskId === taskId))
  }

  function getRecordsByOperatorId(operatorId) {
    return computed(() => records.value.filter(r => r.operatorId === operatorId))
  }

  function getRecordsByPlotId(plotId) {
    return computed(() => records.value.filter(r => r.plotId === plotId))
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
    getRecordsByPlotId,
    stats
  }
})
