import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OperationLog } from '@/types'
import { mockOperationLogs } from '@/mock/operationLog'

export const useTraceStore = defineStore('trace', () => {
  const operationLogs = ref<OperationLog[]>([...mockOperationLogs])

  const getLogsByTarget = (targetId: string, targetType: string) => {
    return operationLogs.value.filter(
      log => log.targetId === targetId && log.targetType === targetType
    )
  }

  const searchLogs = (keyword: string) => {
    if (!keyword) return operationLogs.value
    const kw = keyword.toLowerCase()
    return operationLogs.value.filter(
      log => log.action.toLowerCase().includes(kw) ||
             log.module.toLowerCase().includes(kw) ||
             log.operator.toLowerCase().includes(kw) ||
             log.targetId.includes(kw)
    )
  }

  const addLog = (log: Omit<OperationLog, 'id'>) => {
    operationLogs.value.unshift({
      ...log,
      id: `log-${Date.now()}`
    })
  }

  const sortedLogs = computed(() => 
    [...operationLogs.value].sort(
      (a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime()
    )
  )

  return {
    operationLogs,
    sortedLogs,
    getLogsByTarget,
    searchLogs,
    addLog
  }
})
