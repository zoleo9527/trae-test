import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Alert } from '@/types'
import { alerts as mockAlerts } from '@/data/mock'

export const useNotificationStore = defineStore('notification', () => {
  const alerts = ref<Alert[]>(JSON.parse(JSON.stringify(mockAlerts)))
  const toasts = ref<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([])

  const activeAlerts = computed(() => alerts.value.filter(a => !a.dismissed))
  const highSeverityAlerts = computed(() => activeAlerts.value.filter(a => a.severity === 'high'))

  function dismissAlert(id: string) {
    const alert = alerts.value.find(a => a.id === id)
    if (alert) alert.dismissed = true
  }

  function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const id = `toast-${Date.now()}`
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3000)
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { alerts, toasts, activeAlerts, highSeverityAlerts, dismissAlert, showToast, removeToast }
})
