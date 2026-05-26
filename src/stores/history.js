import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '../utils/storage'

export const useHistoryStore = defineStore('history', () => {
  const logs = ref([])
  const loading = ref(false)

  async function loadLogs() {
    loading.value = true
    const data = await storage.get('historyLogs')
    if (data) {
      logs.value = data
    }
    loading.value = false
  }

  async function addLog(log) {
    const newLog = {
      id: 'h' + Date.now(),
      ...log,
      createTime: new Date().toLocaleString('zh-CN')
    }
    logs.value.unshift(newLog)
    await storage.set('historyLogs', logs.value)
    return newLog
  }

  function getLogsByType(type) {
    return logs.value.filter(log => log.type === type)
  }

  function getLogsByTarget(targetId) {
    return logs.value.filter(log => log.targetId === targetId)
  }

  return {
    logs,
    loading,
    loadLogs,
    addLog,
    getLogsByType,
    getLogsByTarget
  }
})

export async function addHistoryLog(log) {
  const store = useHistoryStore()
  await store.loadLogs()
  return await store.addLog(log)
}
