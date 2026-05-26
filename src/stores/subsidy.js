import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'
import { addHistoryLog } from './history'
import { useAlertStore } from './alert'

const REQUIRED_MATERIALS = ['作业单', '验收单', '身份证复印件']

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

  function calculateMissingDocs(materials = []) {
    return REQUIRED_MATERIALS.filter(m => !materials.includes(m))
  }

  async function addRecord(record, operator) {
    const materials = record.materials || []
    const missingDocs = record.missingDocs || calculateMissingDocs(materials)
    
    const newRecord = {
      id: 's' + Date.now(),
      ...record,
      materials,
      missingDocs,
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
      content: `提交补贴申请，金额：${record.amount}元，已交材料：${materials.length > 0 ? materials.join('、') : '无'}`,
      operatorId: operator.id,
      operatorName: operator.name
    })

    const alertStore = useAlertStore()
    await alertStore.loadAlerts()
    
    if (missingDocs.length > 0) {
      const existingAlert = alertStore.alerts.find(
        a => a.type === 'material' && a.relatedId === newRecord.id
      )
      if (!existingAlert) {
        await alertStore.addAlert({
          type: 'material',
          title: '补贴材料缺失',
          content: `${record.plotName}的补贴申请缺少以下材料：${missingDocs.join('、')}`,
          relatedId: newRecord.id,
          relatedType: 'subsidy',
          assignee: operator.id
        })
        
        await addHistoryLog({
          type: 'alert',
          action: 'create',
          targetId: `material-${newRecord.id}`,
          targetName: '补贴材料缺失提醒',
          content: `系统自动生成材料缺失提醒：${record.plotName}，缺少${missingDocs.length}项材料`,
          operatorId: 'system',
          operatorName: '系统'
        })
      }
    }

    return newRecord
  }

  async function updateRecord(id, updates, operator = null) {
    const index = records.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const oldRecord = records.value[index]
      
      const finalUpdates = { ...updates }
      if (finalUpdates.materials !== undefined) {
        finalUpdates.missingDocs = calculateMissingDocs(finalUpdates.materials)
      }
      
      records.value[index] = { ...oldRecord, ...finalUpdates }
      await storage.set('subsidyRecords', records.value)

      const alertStore = useAlertStore()
      await alertStore.loadAlerts()

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

        if (updates.status === 'approved') {
          await addHistoryLog({
            type: 'subsidy',
            action: 'approve',
            targetId: id,
            targetName: `${oldRecord.plotName}补贴申请`,
            content: `理事${operator.name}审批通过，补贴金额：${oldRecord.amount}元`,
            operatorId: operator.id,
            operatorName: operator.name
          })
          
          const relatedAlerts = alertStore.alerts.filter(
            a => a.type === 'material' && a.relatedId === id && a.status !== 'handled'
          )
          for (const alert of relatedAlerts) {
            await alertStore.markAsRead(alert.id, operator)
          }
        }
      }

      if (operator && finalUpdates.materials !== undefined) {
        const missingDocs = finalUpdates.missingDocs || []
        
        const existingAlert = alertStore.alerts.find(
          a => a.type === 'material' && a.relatedId === id
        )
        
        if (missingDocs.length === 0) {
          if (existingAlert && existingAlert.status !== 'handled') {
            await alertStore.markAsHandled(existingAlert.id, operator, '材料已补齐')
          }
        } else {
          if (!existingAlert) {
            await alertStore.addAlert({
              type: 'material',
              title: '补贴材料缺失',
              content: `${oldRecord.plotName}的补贴申请缺少以下材料：${missingDocs.join('、')}`,
              relatedId: id,
              relatedType: 'subsidy',
              assignee: operator.id
            })
            
            await addHistoryLog({
              type: 'alert',
              action: 'create',
              targetId: `material-${id}`,
              targetName: '补贴材料缺失提醒',
              content: `系统自动生成材料缺失提醒：${oldRecord.plotName}`,
              operatorId: 'system',
              operatorName: '系统'
            })
          } else if (existingAlert.status !== 'handled') {
            existingAlert.content = `${oldRecord.plotName}的补贴申请缺少以下材料：${missingDocs.join('、')}`
            existingAlert.createTime = new Date().toLocaleString('zh-CN')
            existingAlert.status = 'unread'
            await alertStore.addAlert(existingAlert)
          }
        }
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
