import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, Exception, OperationLog, SampleVersion } from '@/types'
import { getInitialData, saveOrders } from '@/mock/data'
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
    return orders.value.filter(o => o.assigneeRole === userStore.currentUser.role)
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

  const initiateRefund = (orderId: string, amount: number, responsibleParty: string, remark: string) => {
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
          approvalStatus: 'pending',
          remark
        }
      }
      exception.refundChain!.exceptionId = exception.id
      order.exceptions.push(exception)
      addOperationLog(orderId, '发起退款', `申请退款¥${amount.toLocaleString()}，责任方：${responsibleParty}`)
      saveOrders(orders.value)
    }
  }

  const approveRefund = (exceptionId: string, approved: boolean) => {
    for (const order of orders.value) {
      const exception = order.exceptions.find(e => e.id === exceptionId)
      if (exception && exception.refundChain) {
        exception.refundChain.approvalStatus = approved ? 'approved' : 'rejected'
        exception.refundChain.approvedAt = new Date().toISOString()
        exception.status = approved ? 'resolved' : 'pending'
        if (approved) {
          exception.resolvedAt = new Date().toISOString()
        }
        addOperationLog(order.id, approved ? '审批通过' : '审批拒绝', 
          `退款${approved ? '通过' : '拒绝'}，金额¥${exception.refundChain.amount.toLocaleString()}`)
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
    confirmSampleVersion,
    createNewSampleVersion,
    resolveException,
    initiateRefund,
    approveRefund,
    recordShipment,
    selectException,
    addOperationLog
  }
})
