import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Complaint, RecordStatus, FilterOptions, ComplaintCategory, ComplaintPriority } from '~/types'
import { mockComplaints } from '~/data/complaints'
import { demoCustomerComplaints } from '~/data/demo-complaints'
import { useCommonStore } from './common'
import { useUserStore } from './user'
import { useNotificationStore } from './notification'
import { usePrepaidStore } from './prepaid'
import { useBookingStore } from './booking'

export const useComplaintStore = defineStore('complaint', () => {
  const complaints = ref<Complaint[]>([...demoCustomerComplaints, ...mockComplaints])
  const currentComplaint = ref<Complaint | null>(null)
  const filter = ref<FilterOptions>({})
  const pagination = ref({ page: 1, pageSize: 10, total: 0 })

  const commonStore = useCommonStore()
  const userStore = useUserStore()
  const notificationStore = useNotificationStore()
  const prepaidStore = usePrepaidStore()
  const bookingStore = useBookingStore()

  const categoryLabelMap: Record<ComplaintCategory, string> = {
    equipment: '器材问题',
    service: '服务态度',
    course_condition: '场地状况',
    booking: '预约问题',
    other: '其他'
  }

  const priorityLabelMap: Record<ComplaintPriority, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }

  const filteredComplaints = computed(() => {
    let result = [...complaints.value]

    if (filter.value.status && filter.value.status.length > 0) {
      result = result.filter(c => filter.value.status!.includes(c.status))
    }

    if (filter.value.priority && filter.value.priority.length > 0) {
      result = result.filter(c => filter.value.priority!.includes(c.priority))
    }

    if (filter.value.category && filter.value.category.length > 0) {
      result = result.filter(c => filter.value.category!.includes(c.category as string))
    }

    if (filter.value.keyword) {
      const keyword = filter.value.keyword.toLowerCase()
      result = result.filter(c =>
        c.complaintNo.toLowerCase().includes(keyword) ||
        c.customerName.toLowerCase().includes(keyword) ||
        c.title.toLowerCase().includes(keyword) ||
        c.description.toLowerCase().includes(keyword)
      )
    }

    if (filter.value.dateRange && filter.value.dateRange.length === 2) {
      const [start, end] = filter.value.dateRange
      result = result.filter(c => {
        const date = c.createdAt.split('T')[0]
        return date >= start && date <= end
      })
    }

    pagination.value.total = result.length

    const start = (pagination.value.page - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize

    return result
      .sort((a, b) => {
        const priorityOrder: Record<ComplaintPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      .slice(start, end)
  })

  const pendingCount = computed(() => {
    return complaints.value.filter(c => c.status === 'pending').length
  })

  const processingCount = computed(() => {
    return complaints.value.filter(c => c.status === 'processing').length
  })

  const overdueCount = computed(() => {
    const now = new Date()
    return complaints.value.filter(c => {
      if (!c.expectedResolveDate) return false
      if (c.status === 'completed') return false
      return new Date(c.expectedResolveDate) < now
    }).length
  })

  function getById(id: string): Complaint | undefined {
    return complaints.value.find(c => c.id === id)
  }

  function setCurrentComplaint(id: string) {
    currentComplaint.value = getById(id) || null
  }

  function clearCurrentComplaint() {
    currentComplaint.value = null
  }

  function getCategoryLabel(category: ComplaintCategory): string {
    return categoryLabelMap[category] || category
  }

  function getPriorityLabel(priority: ComplaintPriority): string {
    return priorityLabelMap[priority] || priority
  }

  function getRelatedComplaints(patrolId?: string, bookingId?: string): Complaint[] {
    return complaints.value.filter(c =>
      (patrolId && c.relatedPatrolId === patrolId) ||
      (bookingId && c.relatedBookingId === bookingId)
    )
  }

  function updateStatus(id: string, newStatus: RecordStatus, remark?: string) {
    const complaint = getById(id)
    if (!complaint) return

    const oldStatus = complaint.status
    complaint.status = newStatus
    complaint.updatedAt = new Date().toISOString()

    if (newStatus === 'completed') {
      complaint.actualResolveDate = new Date().toISOString().split('T')[0]
    }

    commonStore.addStatusHistory({
      recordId: id,
      fromStatus: oldStatus,
      toStatus: newStatus,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark
    })
  }

  function assignHandler(id: string, handlerId: string, handlerName: string, remark?: string) {
    const complaint = getById(id)
    if (!complaint) return

    complaint.handlerId = handlerId
    complaint.handlerName = handlerName
    complaint.supervisorId = userStore.currentUser!.id
    complaint.supervisorName = userStore.currentUser!.name
    complaint.status = 'processing'
    complaint.updatedAt = new Date().toISOString()

    const timelineAction = {
      id: `tl-${Date.now()}`,
      action: 'assigned' as const,
      description: remark || `已分配给 ${handlerName} 处理`,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      operatorRole: userStore.currentUser!.role,
      createdAt: new Date().toISOString()
    }
    complaint.timeline.push(timelineAction)

    commonStore.addStatusHistory({
      recordId: id,
      fromStatus: complaint.status,
      toStatus: 'processing',
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark: `分配处理人：${handlerName}`
    })

    notificationStore.addNotification({
      type: 'warning',
      title: '新投诉待处理',
      message: `投诉 ${complaint.complaintNo} 已分配给您处理。`,
      relatedId: id,
      relatedType: 'complaint',
      recipientRole: ['coach_supervisor', 'reception']
    })
  }

  function addTimeline(id: string, action: any, description: string) {
    const complaint = getById(id)
    if (!complaint) return

    const timelineItem = {
      id: `tl-${Date.now()}`,
      action,
      description,
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      operatorRole: userStore.currentUser!.role,
      createdAt: new Date().toISOString()
    }
    complaint.timeline.push(timelineItem)
    complaint.updatedAt = new Date().toISOString()
  }

  function createComplaint(complaint: Partial<Complaint>): Complaint {
    const now = new Date()
    const expectedDate = new Date()
    expectedDate.setDate(expectedDate.getDate() + (complaint.priority === 'urgent' ? 1 : complaint.priority === 'high' ? 2 : 3))

    let customerId = complaint.customerId
    let relatedBookingId = complaint.relatedBookingId
    let relatedPatrolId = complaint.relatedPatrolId
    let relatedEquipmentId = complaint.relatedEquipmentId

    if (!customerId && complaint.customerPhone) {
      const existingAccount = prepaidStore.getByCustomerPhone(complaint.customerPhone)
      if (existingAccount) {
        customerId = existingAccount.customerId
      }

      const recentBooking = bookingStore.bookings.find(
        b => b.customerPhone === complaint.customerPhone && b.status !== 'pending'
      )
      if (recentBooking && !relatedBookingId) {
        relatedBookingId = recentBooking.id
      }

      if (!customerId && recentBooking) {
        customerId = recentBooking.customerId
      }
    }

    if (!customerId) {
      customerId = `cust-${Date.now()}`
    }

    const newComplaint: Complaint = {
      id: `complaint-${Date.now()}`,
      complaintNo: commonStore.generateNo('CMP'),
      customerId,
      customerName: complaint.customerName || '',
      customerPhone: complaint.customerPhone || '',
      category: complaint.category || 'other',
      priority: complaint.priority || 'medium',
      title: complaint.title || '',
      description: complaint.description || '',
      source: complaint.source || 'on_site',
      status: 'pending',
      handlerId: complaint.handlerId,
      handlerName: complaint.handlerName,
      supervisorId: userStore.currentUser!.id,
      supervisorName: userStore.currentUser!.name,
      relatedBookingId,
      relatedPatrolId,
      relatedEquipmentId,
      timeline: [{
        id: `tl-${Date.now()}`,
        action: 'created',
        description: '投诉已登记，等待分配处理人',
        operatorId: userStore.currentUser!.id,
        operatorName: userStore.currentUser!.name,
        operatorRole: userStore.currentUser!.role,
        createdAt: now.toISOString()
      }],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expectedResolveDate: expectedDate.toISOString().split('T')[0]
    }

    complaints.value.unshift(newComplaint)

    commonStore.addStatusHistory({
      recordId: newComplaint.id,
      fromStatus: null,
      toStatus: 'pending',
      operatorId: userStore.currentUser!.id,
      operatorName: userStore.currentUser!.name,
      remark: '投诉登记'
    })

    notificationStore.addNotification({
      type: complaint.priority === 'urgent' ? 'error' : 'warning',
      title: '新投诉待分配',
      message: `客户${newComplaint.customerName}投诉：${newComplaint.title}，请分配处理人。`,
      relatedId: newComplaint.id,
      relatedType: 'complaint',
      recipientRole: ['manager']
    })

    return newComplaint
  }

  function resolveComplaint(id: string, resolution: string) {
    const complaint = getById(id)
    if (!complaint) return

    addTimeline(id, 'resolved', resolution)
    updateStatus(id, 'completed', '投诉已解决')

    notificationStore.addNotification({
      type: 'success',
      title: '投诉已解决',
      message: `投诉 ${complaint.complaintNo} 已圆满解决。`,
      relatedId: id,
      relatedType: 'complaint',
      recipientRole: ['manager', 'coach_supervisor', 'reception']
    })
  }

  function rejectComplaint(id: string, reason: string) {
    const complaint = getById(id)
    if (!complaint) return

    addTimeline(id, 'rejected', reason)
    updateStatus(id, 'rejected', reason)
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
    complaints,
    currentComplaint,
    filter,
    pagination,
    filteredComplaints,
    pendingCount,
    processingCount,
    overdueCount,
    getById,
    setCurrentComplaint,
    clearCurrentComplaint,
    getCategoryLabel,
    getPriorityLabel,
    getRelatedComplaints,
    updateStatus,
    assignHandler,
    addTimeline,
    createComplaint,
    resolveComplaint,
    rejectComplaint,
    setFilter,
    clearFilter,
    setPage
  }
})
