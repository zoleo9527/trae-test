import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExceptionRecord, HandleRecord } from '@/types'
import { mockExceptions } from '@/mock/exception'

export const useExceptionStore = defineStore('exception', () => {
  const exceptions = ref<ExceptionRecord[]>([...mockExceptions])
  const currentExceptionId = ref<string | null>(null)
  const drawerVisible = ref(false)

  const pendingCount = computed(() => 
    exceptions.value.filter(e => e.status === 'pending').length
  )
  const processingCount = computed(() => 
    exceptions.value.filter(e => e.status === 'processing').length
  )
  const resolvedCount = computed(() => 
    exceptions.value.filter(e => e.status === 'resolved').length
  )

  const currentException = computed(() => 
    exceptions.value.find(e => e.id === currentExceptionId.value) || null
  )

  const sortedExceptions = computed(() => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    return [...exceptions.value].sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return new Date(b.reportTime).getTime() - new Date(a.reportTime).getTime()
    })
  })

  const openDrawer = (exceptionId: string) => {
    currentExceptionId.value = exceptionId
    drawerVisible.value = true
  }

  const closeDrawer = () => {
    drawerVisible.value = false
    currentExceptionId.value = null
  }

  const claimException = (exceptionId: string, handler: string) => {
    const exception = exceptions.value.find(e => e.id === exceptionId)
    if (exception && exception.status === 'pending') {
      exception.status = 'processing'
      exception.handler = handler
      exception.handleTime = new Date().toLocaleString('zh-CN')
      addHandleRecord(exceptionId, handler, '领取异常', '已领取该异常，开始处理')
    }
  }

  const addHandleRecord = (exceptionId: string, operator: string, action: string, remark: string) => {
    const exception = exceptions.value.find(e => e.id === exceptionId)
    if (exception) {
      const record: HandleRecord = {
        id: `hr-${Date.now()}`,
        operator,
        operateTime: new Date().toLocaleString('zh-CN'),
        action,
        remark
      }
      exception.handleRecords.push(record)
    }
  }

  const resolveException = (exceptionId: string, operator: string, remark: string) => {
    const exception = exceptions.value.find(e => e.id === exceptionId)
    if (exception) {
      exception.status = 'resolved'
      exception.resolveTime = new Date().toLocaleString('zh-CN')
      addHandleRecord(exceptionId, operator, '解决异常', remark)
    }
  }

  const closeException = (exceptionId: string, operator: string, remark: string) => {
    const exception = exceptions.value.find(e => e.id === exceptionId)
    if (exception) {
      exception.status = 'closed'
      addHandleRecord(exceptionId, operator, '关闭异常', remark)
    }
  }

  return {
    exceptions,
    currentExceptionId,
    currentException,
    drawerVisible,
    pendingCount,
    processingCount,
    resolvedCount,
    sortedExceptions,
    openDrawer,
    closeDrawer,
    claimException,
    addHandleRecord,
    resolveException,
    closeException
  }
})
