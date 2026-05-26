import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'
import { addHistoryLog } from './history'

export const useAlertStore = defineStore('alert', () => {
  const alerts = ref([])
  const loading = ref(false)

  async function loadAlerts() {
    loading.value = true
    const data = await storage.get('alerts')
    if (data) {
      alerts.value = data
    }
    loading.value = false
  }

  async function addAlert(alert, operator = null) {
    const newAlert = {
      id: 'a' + Date.now(),
      ...alert,
      status: 'unread',
      createTime: new Date().toLocaleString('zh-CN')
    }
    alerts.value.unshift(newAlert)
    await storage.set('alerts', alerts.value)
    
    if (operator) {
      await addHistoryLog({
        type: 'alert',
        action: 'create',
        targetId: newAlert.id,
        targetName: newAlert.title,
        content: newAlert.content,
        operatorId: operator.id,
        operatorName: operator.name
      })
    }
    
    return newAlert
  }

  async function updateAlert(id, updates) {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      alerts.value[index] = { ...alerts.value[index], ...updates }
      await storage.set('alerts', alerts.value)
      return alerts.value[index]
    }
    return null
  }

  async function reactivateAlert(id, updates, operator) {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      const oldHandledInfo = {
        handledBy: alerts.value[index].handledBy,
        handledByName: alerts.value[index].handledByName,
        handledTime: alerts.value[index].handledTime,
        handleRemark: alerts.value[index].handleRemark
      }
      
      alerts.value[index] = {
        ...alerts.value[index],
        ...updates,
        status: 'unread',
        reactivated: true,
        lastHandledInfo: oldHandledInfo,
        reactivateTime: new Date().toLocaleString('zh-CN'),
        reactivatedBy: operator.name
      }
      
      delete alerts.value[index].handledBy
      delete alerts.value[index].handledByName
      delete alerts.value[index].handledTime
      delete alerts.value[index].handleRemark
      
      await storage.set('alerts', alerts.value)
      
      await addHistoryLog({
        type: 'alert',
        action: 'reactivate',
        targetId: id,
        targetName: alerts.value[index].title,
        content: `${operator.name}重新激活了此提醒`,
        operatorId: operator.id,
        operatorName: operator.name
      })
      
      return alerts.value[index]
    }
    return null
  }

  async function markAsRead(id, operator = null) {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index !== -1 && alerts.value[index].status === 'unread') {
      alerts.value[index].status = 'read'
      alerts.value[index].readTime = new Date().toLocaleString('zh-CN')
      await storage.set('alerts', alerts.value)
      
      if (operator) {
        await addHistoryLog({
          type: 'alert',
          action: 'read',
          targetId: id,
          targetName: alerts.value[index].title,
          content: `${operator.name}已查看此提醒`,
          operatorId: operator.id,
          operatorName: operator.name
        })
      }
    }
  }

  async function markAsHandled(id, operator, remark = '') {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      alerts.value[index].status = 'handled'
      alerts.value[index].handledBy = operator.id
      alerts.value[index].handledByName = operator.name
      alerts.value[index].handledTime = new Date().toLocaleString('zh-CN')
      alerts.value[index].handleRemark = remark
      await storage.set('alerts', alerts.value)
      
      await addHistoryLog({
        type: 'alert',
        action: 'handle',
        targetId: id,
        targetName: alerts.value[index].title,
        content: `${operator.name}处理了此提醒${remark ? '，备注：' + remark : ''}`,
        operatorId: operator.id,
        operatorName: operator.name
      })
    }
  }

  async function markAllAsRead(assigneeId, operator = null) {
    alerts.value.forEach(alert => {
      if (alert.assignee === assigneeId && alert.status === 'unread') {
        alert.status = 'read'
        alert.readTime = new Date().toLocaleString('zh-CN')
      }
    })
    await storage.set('alerts', alerts.value)
    
    if (operator) {
      await addHistoryLog({
        type: 'alert',
        action: 'read_all',
        targetId: 'all',
        targetName: '批量已读',
        content: `${operator.name}一键标记所有提醒为已读`,
        operatorId: operator.id,
        operatorName: operator.name
      })
    }
  }

  function getAlertsByAssignee(assigneeId) {
    return computed(() => alerts.value.filter(a => a.assignee === assigneeId))
  }

  const unreadCount = computed(() => {
    return alerts.value.filter(a => a.status === 'unread').length
  })

  function getUnreadCountByAssignee(assigneeId) {
    return computed(() => alerts.value.filter(a => a.assignee === assigneeId && a.status === 'unread').length)
  }

  const stats = computed(() => {
    const total = alerts.value.length
    const unread = alerts.value.filter(a => a.status === 'unread').length
    const read = alerts.value.filter(a => a.status === 'read').length
    const handled = alerts.value.filter(a => a.status === 'handled').length
    
    return { total, unread, read, handled }
  })

  return {
    alerts,
    loading,
    loadAlerts,
    addAlert,
    updateAlert,
    reactivateAlert,
    markAsRead,
    markAsHandled,
    markAllAsRead,
    getAlertsByAssignee,
    unreadCount,
    getUnreadCountByAssignee,
    stats
  }
})
