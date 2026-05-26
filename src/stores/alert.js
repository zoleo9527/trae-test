import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'

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

  async function addAlert(alert) {
    const newAlert = {
      id: 'a' + Date.now(),
      ...alert,
      status: 'unread',
      createTime: new Date().toLocaleString('zh-CN')
    }
    alerts.value.unshift(newAlert)
    await storage.set('alerts', alerts.value)
    return newAlert
  }

  async function markAsRead(id) {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      alerts.value[index].status = 'read'
      await storage.set('alerts', alerts.value)
    }
  }

  async function markAllAsRead(assigneeId) {
    alerts.value.forEach(alert => {
      if (alert.assignee === assigneeId && alert.status === 'unread') {
        alert.status = 'read'
      }
    })
    await storage.set('alerts', alerts.value)
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

  return {
    alerts,
    loading,
    loadAlerts,
    addAlert,
    markAsRead,
    markAllAsRead,
    getAlertsByAssignee,
    unreadCount,
    getUnreadCountByAssignee
  }
})
