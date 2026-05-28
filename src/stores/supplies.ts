import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SuppliesApplication, SuppliesStatus, Comment } from '@/types'
import { mockApplications } from '@/data/mockData'
import { useUserStore } from './user'

export const useSuppliesStore = defineStore('supplies', () => {
  const applications = ref<SuppliesApplication[]>([...mockApplications])
  const selectedApplicationId = ref<string | null>(null)
  const filterStatus = ref<SuppliesStatus | 'all'>('all')
  const searchKeyword = ref('')

  const filteredApplications = computed(() => {
    let result = applications.value
    
    if (filterStatus.value !== 'all') {
      result = result.filter(app => app.status === filterStatus.value)
    }
    
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      result = result.filter(app => 
        app.applicationNo.toLowerCase().includes(keyword) ||
        app.vesselName.toLowerCase().includes(keyword) ||
        app.port.toLowerCase().includes(keyword)
      )
    }
    
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const selectedApplication = computed(() => {
    return applications.value.find(app => app.id === selectedApplicationId.value) || null
  })

  const pendingReviewCount = computed(() => {
    return applications.value.filter(app => app.status === 'pending_review').length
  })

  const urgentCount = computed(() => {
    return applications.value.filter(app => 
      app.status !== 'paid' && app.items.some(item => item.urgency === 'critical')
    ).length
  })

  const paymentAlertCount = computed(() => {
    const today = new Date()
    return applications.value.filter(app => {
      if (app.paymentStatus === 'paid' || !app.paymentDueDate) return false
      const dueDate = new Date(app.paymentDueDate)
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 3
    }).length
  })

  const documentAlertCount = computed(() => {
    const today = new Date()
    let count = 0
    applications.value.forEach(app => {
      app.documents.forEach(doc => {
        if (doc.status === 'received') return
        const deadline = new Date(doc.deadline)
        const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays <= 3) count++
      })
    })
    return count
  })

  const selectApplication = (id: string | null) => {
    selectedApplicationId.value = id
  }

  const setFilterStatus = (status: SuppliesStatus | 'all') => {
    filterStatus.value = status
  }

  const setSearchKeyword = (keyword: string) => {
    searchKeyword.value = keyword
  }

  const getHandlerForStatus = (status: SuppliesStatus): { id: string; name: string } | null => {
    const userStore = useUserStore()
    switch (status) {
      case 'pending_review':
      case 'reviewed':
        return { id: '1', name: '张明' }
      case 'supplier_assigned':
      case 'in_progress':
      case 'rejected':
        return { id: '2', name: '李强' }
      case 'completed':
      case 'paid':
        return { id: '3', name: '王芳' }
      default:
        return { id: userStore.currentUser.id, name: userStore.currentUser.name }
    }
  }

  const updateStatus = (applicationId: string, newStatus: SuppliesStatus, remark?: string) => {
    const userStore = useUserStore()
    const app = applications.value.find(a => a.id === applicationId)
    if (!app) return

    app.status = newStatus
    app.updatedAt = new Date().toISOString()
    
    const handler = getHandlerForStatus(newStatus)
    if (handler) {
      app.currentHandlerId = handler.id
      app.currentHandlerName = handler.name
    }
    
    app.statusHistory.push({
      id: `h${Date.now()}`,
      status: newStatus,
      timestamp: new Date().toISOString(),
      userId: userStore.currentUser.id,
      userName: userStore.currentUser.name,
      remark
    })
  }

  const addComment = (applicationId: string, content: string, type: Comment['type'] = 'comment') => {
    const userStore = useUserStore()
    const app = applications.value.find(a => a.id === applicationId)
    if (!app) return

    app.comments.push({
      id: `c${Date.now()}`,
      userId: userStore.currentUser.id,
      userName: userStore.currentUser.name,
      userRole: userStore.currentUser.role,
      content,
      timestamp: new Date().toISOString(),
      type
    })
    app.updatedAt = new Date().toISOString()
  }

  const assignSupplier = (applicationId: string, supplierId: string, supplierName: string) => {
    const app = applications.value.find(a => a.id === applicationId)
    if (!app) return

    app.supplierId = supplierId
    app.supplierName = supplierName
    updateStatus(applicationId, 'supplier_assigned', `分配供应商: ${supplierName}`)
  }

  const batchReview = (applicationIds: string[], approved: boolean, rejectReason?: string) => {
    applicationIds.forEach(id => {
      if (approved) {
        updateStatus(id, 'reviewed', '批量审核通过')
        addComment(id, '批量审核通过', 'system')
      } else {
        updateStatus(id, 'rejected', rejectReason || '审核未通过')
        if (rejectReason) {
          addComment(id, rejectReason, 'reject')
        }
      }
    })
  }

  const updateDocumentStatus = (applicationId: string, documentId: string, newStatus: 'pending' | 'received' | 'expired') => {
    const userStore = useUserStore()
    const app = applications.value.find(a => a.id === applicationId)
    if (!app) return

    const doc = app.documents.find(d => d.id === documentId)
    if (!doc) return

    doc.status = newStatus
    app.updatedAt = new Date().toISOString()
    
    addComment(applicationId, `证件"${doc.name}"状态更新为: ${newStatus === 'received' ? '已收到' : newStatus === 'expired' ? '已过期' : '待收取'}`, 'system')
  }

  const updatePaymentInfo = (applicationId: string, paymentData: {
    paymentStatus?: 'unpaid' | 'partial' | 'paid'
    actualPayment?: number
    paymentDueDate?: string
  }) => {
    const userStore = useUserStore()
    const app = applications.value.find(a => a.id === applicationId)
    if (!app) return

    const isSettingPaid = paymentData.paymentStatus === 'paid'
    
    if (paymentData.paymentStatus !== undefined) {
      app.paymentStatus = paymentData.paymentStatus
    }
    
    if (isSettingPaid) {
      app.actualPayment = app.totalAmount
      app.status = 'paid'
      const handler = getHandlerForStatus('paid')
      if (handler) {
        app.currentHandlerId = handler.id
        app.currentHandlerName = handler.name
      }
      app.statusHistory.push({
        id: `h${Date.now()}`,
        status: 'paid',
        timestamp: new Date().toISOString(),
        userId: userStore.currentUser.id,
        userName: userStore.currentUser.name,
        remark: '付款编辑标记结清'
      })
    } else {
      if (paymentData.actualPayment !== undefined) {
        app.actualPayment = paymentData.actualPayment
      }
      app.currentHandlerId = userStore.currentUser.id
      app.currentHandlerName = userStore.currentUser.name
    }
    
    if (paymentData.paymentDueDate !== undefined) {
      app.paymentDueDate = paymentData.paymentDueDate
    }
    
    app.updatedAt = new Date().toISOString()
    
    const statusText = []
    if (paymentData.paymentStatus) {
      const labels = { unpaid: '未付', partial: '部分支付', paid: '已结清' }
      statusText.push(`付款状态: ${labels[paymentData.paymentStatus]}`)
    }
    if (isSettingPaid) {
      statusText.push(`实际支付: ¥${app.totalAmount.toLocaleString()}`)
    } else if (paymentData.actualPayment !== undefined) {
      statusText.push(`实际支付: ¥${paymentData.actualPayment.toLocaleString()}`)
    }
    if (statusText.length > 0) {
      addComment(applicationId, `更新付款信息 - ${statusText.join(', ')}`, 'system')
    }
  }

  const markAsPaid = (applicationId: string) => {
    const userStore = useUserStore()
    const app = applications.value.find(a => a.id === applicationId)
    if (!app) return

    app.paymentStatus = 'paid'
    app.actualPayment = app.totalAmount
    app.currentHandlerId = userStore.currentUser.id
    app.currentHandlerName = userStore.currentUser.name
    
    updateStatus(applicationId, 'paid', '款项已结清')
    addComment(applicationId, `款项已全部结清，实际支付: ¥${app.totalAmount.toLocaleString()}`, 'system')
  }

  return {
    applications,
    filteredApplications,
    selectedApplication,
    selectedApplicationId,
    filterStatus,
    searchKeyword,
    pendingReviewCount,
    urgentCount,
    paymentAlertCount,
    documentAlertCount,
    selectApplication,
    setFilterStatus,
    setSearchKeyword,
    updateStatus,
    addComment,
    assignSupplier,
    batchReview,
    updateDocumentStatus,
    updatePaymentInfo,
    markAsPaid
  }
})
