import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StatusHistory, Remark, RecordStatus } from '~/types'
import { mockStatusHistory } from '~/data/status-history'
import { mockRemarks } from '~/data/remarks'
import { useUserStore } from './user'

export const useCommonStore = defineStore('common', () => {
  const statusHistory = ref<StatusHistory[]>([...mockStatusHistory])
  const remarks = ref<Remark[]>([...mockRemarks])

  const statusLabelMap: Record<RecordStatus, string> = {
    draft: '草稿',
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    processing: '处理中',
    completed: '已完成',
    overdue: '已逾期'
  }

  const userStore = useUserStore()

  function getStatusLabel(status: RecordStatus): string {
    return statusLabelMap[status] || status
  }

  function getStatusHistory(recordId: string): StatusHistory[] {
    return statusHistory.value
      .filter(h => h.recordId === recordId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  function getRemarks(recordId: string, includeInternal: boolean = true): Remark[] {
    return remarks.value
      .filter(r => r.recordId === recordId && (includeInternal || !r.isInternal))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  function addStatusHistory(record: Omit<StatusHistory, 'id' | 'createdAt'>) {
    const history: StatusHistory = {
      ...record,
      id: `sh-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    statusHistory.value.push(history)
  }

  function addRemark(recordId: string, content: string, isInternal: boolean = true) {
    if (!userStore.currentUser) return

    const remark: Remark = {
      id: `remark-${Date.now()}`,
      recordId,
      content,
      authorId: userStore.currentUser.id,
      authorName: userStore.currentUser.name,
      authorRole: userStore.currentUser.role,
      isInternal,
      createdAt: new Date().toISOString()
    }
    remarks.value.push(remark)
  }

  function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  function formatMoney(amount: number): string {
    return `¥${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  function generateNo(prefix: string, date: Date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${year}${month}${day}-${random}`
  }

  return {
    statusHistory,
    remarks,
    getStatusLabel,
    getStatusHistory,
    getRemarks,
    addStatusHistory,
    addRemark,
    formatDateTime,
    formatDate,
    formatMoney,
    generateNo
  }
})
