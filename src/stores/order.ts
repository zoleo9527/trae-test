import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, Exception, OperationLog, SampleVersion, ProductionSchedule, ResponsibleParty } from '@/types'
import { getInitialData, saveOrders, mockUsers } from '@/mock/data'
import { useUserStore } from './user'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>(getInitialData())
  const selectedException = ref<Exception | null>(null)

  const pendingExceptions = computed(() => {
    return orders.value.flatMap(o => 
      o.exceptions.filter(e => e.status === 'pending' || e.status === 'processing')
    )
  })

  const criticalExceptions = computed(() => {
    return pendingExceptions.value.filter(e => e.severity === 'critical')
  })

  const ordersForCurrentUser = computed(() => {
    const userStore = useUserStore()
    if (userStore.currentUser.role === 'business') {
      return orders.value
    }
    return orders.value.filter(o => {
      if (o.status === 'version_locked' || ['scheduled', 'producing', 'qc_passed', 'shipping', 'completed'].includes(o.status)) {
        return userStore.currentUser.role === 'warehouse'
      }
      return o.assigneeRole === userStore.currentUser.role
    })
  })

  const getOrderById = (id: string): Order | undefined => {
    return orders.value.find(o => o.id === id)
  }

  const addOperationLog = (orderId: string, action: string, detail: string) => {
    const userStore = useUserStore()
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      const log: OperationLog = {
        id: `log_${Date.now()}`,
        orderId,
        operator: userStore.currentUser.name,
        operatorRole: userStore.currentUser.role,
        action,
        detail,
        timestamp: new Date().toISOString()
      }
      order.operationLogs.unshift(log)
      order.updatedAt = new Date().toISOString()
      saveOrders(orders.value)
    }
  }

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = status
      order.updatedAt = new Date().toISOString()
      saveOrders(orders.value)
    }
  }

  const scheduleProduction = (orderId: string, scheduledDate?: string) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      const schedule: ProductionSchedule = {
        id: `ps_${Date.now()}`,
        orderId,
        scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
        productionStatus: 'scheduled',
        quantity: order.quantity,
        createdAt: new Date().toISOString()
      }
      order.productionSchedules.push(schedule)
      updateOrderStatus(orderId, 'scheduled')
      addOperationLog(orderId, '安排排期', `量产排期至${schedule.scheduledDate}，计划数量${order.quantity}件`)
      saveOrders(orders.value)
    }
  }

  const startProduction = (orderId: string) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order && order.productionSchedules.length > 0) {
      const latestSchedule = order.productionSchedules[order.productionSchedules.length - 1]
      latestSchedule.productionStatus = 'producing'
      updateOrderStatus(orderId, 'producing')
      addOperationLog(orderId, '开始生产', '量产生产中')
      saveOrders(orders.value)
    }
  }

  const passQC = (orderId: string, qcResult: string = '合格') => {
    const order = orders.value.find(o => o.id === orderId)
    if (order && order.productionSchedules.length > 0) {
      const latestSchedule = order.productionSchedules[order.productionSchedules.length - 1]
      latestSchedule.productionStatus = 'qc_passed'
      latestSchedule.qcResult = qcResult
      updateOrderStatus(orderId, 'qc_passed')
      addOperationLog(orderId, '质检通过', `产品质检${qcResult}`)
      saveOrders(orders.value)
    }
  }

  const confirmSampleVersion = (orderId: string, versionId: string, lock: boolean = false) => {
    const userStore = useUserStore()
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      const version = order.sampleVersions.find(v => v.id === versionId)
      if (version) {
        version.status = lock ? 'locked' : 'confirmed'
        version.confirmedBy = userStore.currentUser.name
        version.confirmedAt = new Date().toISOString()
        
        if (lock) {
          updateOrderStatus(orderId, 'version_locked')
          const warehouseUser = mockUsers.find(u => u.role === 'warehouse')
          if (warehouseUser) {
            order.assignee = warehouseUser.name
            order.assigneeRole = 'warehouse'
            addOperationLog(orderId, '转单交接', `版本已锁定，订单转至${warehouseUser.name}（仓配协调）安排排期`)
          }
          addOperationLog(orderId, '锁定版本', `样品v${version.version}已确认并锁定`)
        } else {
          updateOrderStatus(orderId, 'sample_confirmed')
          addOperationLog(orderId, '确认样品', `确认样品v${version.version}`)
        }
        saveOrders(orders.value)
      }
    }
  }

  const createNewSampleVersion = (orderId: string, oldVersionId: string, changeReason: string, newSpecs: Record<string, string>) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      const oldVersion = order.sampleVersions.find(v => v.id === oldVersionId)
      if (oldVersion) {
        const newVersion: SampleVersion = {
          id: `sv_${Date.now()}`,
          orderId,
          version: oldVersion.version + 1,
          status: 'pending',
          photoUrl: `https://picsum.photos/seed/sample${Date.now()}/400/300`,
          changeReason,
          specs: newSpecs,
          createdAt: new Date().toISOString()
        }
        order.sampleVersions.push(newVersion)
        updateOrderStatus(orderId, 'sampling')

        const samplingUser = mockUsers.find(u => u.role === 'sampling')
        if (samplingUser) {
          const oldAssignee = order.assignee
          const oldRole = order.assigneeRole
          order.assignee = samplingUser.name
          order.assigneeRole = 'sampling'
          addOperationLog(orderId, '转单交接', `版本改版，订单从${oldAssignee}（${oldRole === 'warehouse' ? '仓配协调' : oldRole}）转回${samplingUser.name}（打样跟单）`)
        }

        order.productionSchedules = []
        
        const exception: Exception = {
          id: `ex_${Date.now()}`,
          orderId,
          type: 'version_overwrite',
          severity: 'warning',
          status: 'pending',
          description: `版本覆盖告警：从v${oldVersion.version}创建新版本v${newVersion.version}，原因：${changeReason}`,
          createdAt: new Date().toISOString(),
          oldVersionId,
          newVersionId: newVersion.id
        }
        order.exceptions.push(exception)
        
        addOperationLog(orderId, '创建新版本', `原因：${changeReason}，从v${oldVersion.version}到v${newVersion.version}`)
        saveOrders(orders.value)
        return newVersion
      }
    }
    return null
  }

  const resolveException = (exceptionId: string, resolution?: string) => {
    for (const order of orders.value) {
      const exception = order.exceptions.find(e => e.id === exceptionId)
      if (exception) {
        exception.status = 'resolved'
        exception.resolvedAt = new Date().toISOString()
        addOperationLog(order.id, '处理异常', `${exception.description} ${resolution || '已解决'}`)
        saveOrders(orders.value)
        return
      }
    }
  }

  const initiateRefund = (orderId: string, amount: number, responsibleParty: string, applyReason: string) => {
    const userStore = useUserStore()
    if (userStore.currentUser.role !== 'business') {
      return
    }
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      const exception: Exception = {
        id: `ex_${Date.now()}`,
        orderId,
        type: 'refund_required',
        severity: 'warning',
        status: 'processing',
        description: `退款申请：金额¥${amount.toLocaleString()}，责任方：${responsibleParty}`,
        createdAt: new Date().toISOString(),
        refundChain: {
          id: `rc_${Date.now()}`,
          exceptionId: '',
          responsibleParty: responsibleParty as any,
          amount,
          applyReason,
          approvalStatus: 'pending',
          responsiblePartyHistory: []
        }
      }
      exception.refundChain!.exceptionId = exception.id
      order.exceptions.push(exception)
      addOperationLog(orderId, '发起退款', `申请退款¥${amount.toLocaleString()}，责任方：${responsibleParty}，原因：${applyReason}`)
      saveOrders(orders.value)
    }
  }

  const canEditResponsibleParty = (exceptionId: string): boolean => {
    const userStore = useUserStore()
    if (userStore.currentUser.role === 'business') {
      return true
    }
    for (const order of orders.value) {
      const exception = order.exceptions.find(e => e.id === exceptionId)
      if (exception && exception.refundChain) {
        if (exception.refundChain.approvalStatus === 'pending' && 
            userStore.currentUser.role === order.assigneeRole) {
          return true
        }
      }
    }
    return false
  }

  const canViewRefundException = (order: Order): boolean => {
    const userStore = useUserStore()
    if (userStore.currentUser.role === 'business') {
      return true
    }
    return order.assigneeRole === userStore.currentUser.role || 
           userStore.currentUser.role === order.assigneeRole
  }

  const updateRefundResponsibleParty = (exceptionId: string, responsibleParty: ResponsibleParty, remark?: string) => {
    const userStore = useUserStore()
    if (!canEditResponsibleParty(exceptionId)) {
      return
    }
    for (const order of orders.value) {
      const exception = order.exceptions.find(e => e.id === exceptionId)
      if (exception && exception.refundChain) {
        const oldParty = exception.refundChain.responsibleParty
        if (oldParty === responsibleParty) return

        if (!exception.refundChain.responsiblePartyHistory) {
          exception.refundChain.responsiblePartyHistory = []
        }
        exception.refundChain.responsiblePartyHistory.push({
          from: oldParty,
          to: responsibleParty,
          operator: userStore.currentUser.name,
          operatorRole: userStore.currentUser.role,
          timestamp: new Date().toISOString(),
          remark
        })

        exception.refundChain.responsibleParty = responsibleParty
        exception.description = `退款申请：金额¥${exception.refundChain.amount.toLocaleString()}，责任方：${responsibleParty}`
        addOperationLog(order.id, '变更责任方', 
          `退款责任方从"${oldParty}"变更为"${responsibleParty}"${remark ? `，备注：${remark}` : ''}`)
        saveOrders(orders.value)
        return
      }
    }
  }

  const approveRefund = (exceptionId: string, approved: boolean, approvalRemark?: string) => {
    const userStore = useUserStore()
    if (userStore.currentUser.role !== 'business') {
      return
    }
    for (const order of orders.value) {
      const exception = order.exceptions.find(e => e.id === exceptionId)
      if (exception && exception.refundChain) {
        exception.refundChain.approvalStatus = approved ? 'approved' : 'rejected'
        exception.refundChain.approver = userStore.currentUser.name
        exception.refundChain.approvedAt = new Date().toISOString()
        if (approvalRemark) {
          exception.refundChain.approvalRemark = approvalRemark
        }
        exception.status = approved ? 'resolved' : 'pending'
        if (approved) {
          exception.resolvedAt = new Date().toISOString()
        }
        const logDetail = `退款${approved ? '通过' : '拒绝'}，金额¥${exception.refundChain.amount.toLocaleString()}，责任方：${exception.refundChain.responsibleParty}${approvalRemark ? `，审批备注：${approvalRemark}` : ''}`
        addOperationLog(order.id, approved ? '审批通过' : '审批拒绝', logDetail)
        saveOrders(orders.value)
        return
      }
    }
  }

  const recordShipment = (orderId: string, carrier: string, trackingNo: string, items: Array<{skuName: string, expectedQty: number, actualQty: number}>) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      const hasMissing = items.some(item => item.actualQty < item.expectedQty)
      
      const shipment = {
        id: `sh_${Date.now()}`,
        orderId,
        trackingNo,
        carrier,
        status: hasMissing ? 'partial' : 'shipped',
        shippedAt: new Date().toISOString(),
        items: items.map((item, idx) => ({
          id: `shi_${Date.now()}_${idx}`,
          shipmentId: '',
          skuName: item.skuName,
          expectedQty: item.expectedQty,
          actualQty: item.actualQty,
          isMissing: item.actualQty < item.expectedQty
        }))
      }
      shipment.items.forEach(item => item.shipmentId = shipment.id)
      order.shipments.push(shipment)
      
      if (hasMissing) {
        const missingQty = items.reduce((sum, item) => sum + (item.expectedQty - item.actualQty), 0)
        const exception: Exception = {
          id: `ex_${Date.now()}`,
          orderId,
          type: 'shipment_missing',
          severity: 'critical',
          status: 'pending',
          description: `拆单发货检测到漏件：缺少${missingQty}件`,
          createdAt: new Date().toISOString()
        }
        order.exceptions.push(exception)
      }
      
      updateOrderStatus(orderId, 'shipping')
      addOperationLog(orderId, '发货操作', `${carrier} ${trackingNo}，${hasMissing ? '检测到漏件' : '全部发出'}`)
      saveOrders(orders.value)
    }
  }

  const selectException = (exception: Exception | null) => {
    selectedException.value = exception
  }

  return {
    orders,
    ordersForCurrentUser,
    pendingExceptions,
    criticalExceptions,
    selectedException,
    getOrderById,
    updateOrderStatus,
    scheduleProduction,
    startProduction,
    passQC,
    confirmSampleVersion,
    createNewSampleVersion,
    resolveException,
    initiateRefund,
    canEditResponsibleParty,
    canViewRefundException,
    updateRefundResponsibleParty,
    approveRefund,
    recordShipment,
    selectException,
    addOperationLog
  }
})
