import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PatrolRecord, RecordStatus, FilterOptions } from '~/types'
import { mockPatrols } from '~/data/patrols'
import { useCommonStore } from './common'
import { useUserStore } from './user'
import { useNotificationStore } from './notification'

export const usePatrolStore = defineStore('patrol', () => {
  const patrols = ref<PatrolRecord[]>([...mockPatrols])
  const currentPatrol = ref<PatrolRecord | null>(null)
  const filter = ref<FilterOptions>({})
  const pagination = ref({ page: 1, pageSize: 10, total: 0 })

  const commonStore = useCommonStore()
  const userStore = useUserStore()
  const notificationStore = useNotificationStore()

  const filteredPatrols = computed(() => {
    let result = [...patrols.value]

    if (filter.value.status && filter.value.status.length > 0) {
      result = result.filter(p => filter.value.status!.includes(p.status))
    }

    if (filter.value.keyword) {
      const keyword = filter.value.keyword.toLowerCase()
      result = result.filter(p =>
        p.patrolNo.toLowerCase().includes(keyword) ||
        p.location.toLowerCase().includes(keyword) ||
        p.operatorName.toLowerCase().includes(keyword) ||
        p.summary?.toLowerCase().includes(keyword)
      )
    }

    if (filter.value.dateRange && filter.value.dateRange.length === 2) {
      const [start, end] = filter.value.dateRange
      result = result.filter(p => p.date >= start && p.date <= end)
    }

    pagination.value.total = result.length

    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize

    return result
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(start, end)
  })

  const pendingCount = computed(() => {
    return patrols.value.filter(p => p.status === 'pending').length
  })

  function getById(id: string): PatrolRecord | undefined {
    return patrols.value.find(p => p.id === id)
  }

  function setCurrentPatrol(id: string) {
    currentPatrol.value = getById(id) || null
  }

  function clearCurrentPatrol() {
    currentPatrol.value = null
  }

  function updateStatus(id: string, newStatus: RecordStatus, remark?: string) {
    const patrol = getById(id)
    if (!patrol) return

    const oldStatus = patrol.status
    patrol.status = newStatus
    patrol.updatedAt = new Date().toISOString()

    commonStore.addStatusHistory({
      recordId: id,
      fromStatus: oldStatus,
      toStatus: newStatus,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark
    })

    if (newStatus === 'pending') {
      notificationStore.addNotification({
        type: 'warning',
        title: '巡场记录待审核',
        message: `巡场记录 ${patrol.patrolNo} 已提交，等待您的审核。`,
        relatedId: id,
        relatedType: 'patrol',
        recipientRole: ['manager']
      })
    } else if (newStatus === 'approved') {
      notificationStore.addNotification({
        type: 'success',
        title: '巡场记录已通过',
        message: `您提交的巡场记录 ${patrol.patrolNo} 已通过审核。`,
        relatedId: id,
        relatedType: 'patrol',
        recipientRole: ['coach_supervisor']
      })
    } else if (newStatus === 'rejected') {
      notificationStore.addNotification({
        type: 'warning',
        title: '巡场记录被驳回',
        message: `您提交的巡场记录 ${patrol.patrolNo} 已被驳回：${remark}`,
        relatedId: id,
        relatedType: 'patrol',
        recipientRole: ['coach_supervisor']
      })
    }
  }

  function submitForApproval(id: string) {
    updateStatus(id, 'pending', '提交巡场记录，等待经理审核')
  }

  function approve(id: string, remark?: string) {
    updateStatus(id, 'approved', remark || '审核通过')
  }

  function reject(id: string, remark: string) {
    updateStatus(id, 'rejected', remark)
  }

  function createPatrol(patrol: Partial<PatrolRecord>): PatrolRecord {
    const now = new Date()
    const newPatrol: PatrolRecord = {
      id: `patrol-${Date.now()}`,
      patrolNo: commonStore.generateNo('PAT'),
      date: patrol.date || now.toISOString().split('T')[0],
      startTime: patrol.startTime || now.toTimeString().slice(0, 5),
      endTime: patrol.endTime,
      location: patrol.location || '',
      weather: patrol.weather || '晴',
      temperature: patrol.temperature || 25,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      supervisorId: patrol.supervisorId,
      supervisorName: patrol.supervisorName,
      status: 'draft',
      items: patrol.items || [],
      issues: patrol.issues || [],
      summary: patrol.summary || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }

    patrols.value.unshift(newPatrol)

    commonStore.addStatusHistory({
      recordId: newPatrol.id,
      fromStatus: null,
      toStatus: 'draft',
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark: '创建巡场记录'
    })

    return newPatrol
  }

  function updatePatrol(id: string, updates: Partial<PatrolRecord>) {
    const patrol = getById(id)
    if (!patrol) return

    Object.assign(patrol, updates)
    patrol.updatedAt = new Date().toISOString()
  }

  function addIssue(patrolId: string, issue: any) {
    const patrol = getById(patrolId)
    if (!patrol) return

    const newIssue = {
      ...issue,
      id: `issue-${Date.now()}`,
      status: 'open'
    }

    patrol.issues.push(newIssue)
    patrol.updatedAt = new Date().toISOString()
  }

  function updateIssue(patrolId: string, issueId: string, updates: any) {
    const patrol = getById(patrolId)
    if (!patrol) return

    const issue = patrol.issues.find(i => i.id === issueId)
    if (issue) {
      Object.assign(issue, updates)
      patrol.updatedAt = new Date().toISOString()
    }
  }

  function setFilter(newFilter: Partial<FilterOptions>) {
    filter.value = { ...filter.value, ...newFilter }
    pagination.value.page = 1
  }

  function clearFilter() {
    filter.value = {}
    pagination.value.page = 1
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  return {
    patrols,
    currentPatrol,
    filter,
    pagination,
    filteredPatrols,
    pendingCount,
    getById,
    setCurrentPatrol,
    clearCurrentPatrol,
    updateStatus,
    submitForApproval,
    approve,
    reject,
    createPatrol,
    updatePatrol,
    addIssue,
    updateIssue,
    setFilter,
    clearFilter,
    setPage
  }
})
