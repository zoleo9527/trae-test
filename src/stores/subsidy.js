import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'
import { addHistoryLog } from './history'

export const useSubsidyStore = defineStore('subsidy', () => {
  const records = ref([])
  const loading = ref(false)

  async function loadRecords() {
    loading.value = true
    const data = await storage.get('subsidyRecords')
    if (data) {
      records.value = data
    }
    loading.value = false
  }

  async function addRecord(record, operator) {
    const newRecord = {
      id: 's' + Date.now(),
      ...record,
      status: 'pending',
      approveDate: null,
      createBy: operator.id
    }
    records.value.push(newRecord)
    await storage.set('subsidyRecords', records.value)

    await addHistoryLog({
      type: 'subsidy',
      action: 'create',
      targetId: newRecord.id,
      targetName: `${record.plotName}补贴申请`,
      content: `提交补贴申请，金额：${record.amount}元`,
      operatorId: operator.id,
      operatorName: operator.name
    })

    return newRecord
  }

  async function updateRecord(id, updates, operator = null) {
    const index = records.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const oldRecord = records.value[index]
      records.value[index] = { ...oldRecord, ...updates }
      await storage.set('subsidyRecords', records.value)

      if (operator && updates.status) {
        const statusMap = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
        await addHistoryLog({
          type: 'subsidy',
          action: updates.status === 'approved' ? 'approve' : 'reject',
          targetId: id,
          targetName: `${oldRecord.plotName}补贴申请`,
          content: `补贴申请${statusMap[updates.status]}`,
          operatorId: operator.id,
          operatorName: operator.name
        })
      }
    }
  }

  function getRecordsByPlotId(plotId) {
    return computed(() => records.value.filter(r => r.plotId === plotId))
  }

  const stats = computed(() => {
    const total = records.value.length
    const pending = records.value.filter(r => r.status === 'pending').length
    const approved = records.value.filter(r => r.status === 'approved').length
    const rejected = records.value.filter(r => r.status === 'rejected').length
    const totalAmount = records.value.reduce((sum, r) => sum + r.amount, 0)
    const approvedAmount = records.value.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0)

    return { total, pending, approved, rejected, totalAmount, approvedAmount }
  })

  return {
    records,
    loading,
    loadRecords,
    addRecord,
    updateRecord,
    getRecordsByPlotId,
    stats
  }
})
