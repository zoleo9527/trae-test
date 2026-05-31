import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Refund, RefundTrace, RefundStatus } from '@/types'
import { refunds as mockRefunds, refundTraces as mockTraces } from '@/data/mockRefunds'
import { useOrderStore } from '@/stores/order'
import { useRemakeStore } from '@/stores/remake'

export const useRefundStore = defineStore('refund', () => {
  const refunds = ref<Refund[]>([...mockRefunds])
  const traces = ref<RefundTrace[]>([...mockTraces])

  const pendingRefunds = computed(() =>
    refunds.value.filter(r => r.status === 'requested' || r.status === 'tracing'),
  )

  function getTracesByRefundId(refundId: string) {
    return traces.value.filter(t => t.refundId === refundId)
  }

  function createRefund(refund: Refund) {
    refunds.value.push(refund)
  }

  function approveRefund(id: string, approvedBy: string) {
    const refund = refunds.value.find(r => r.id === id)
    if (refund) {
      refund.status = 'approved' as RefundStatus
      refund.approvedBy = approvedBy
      refund.completedAt = new Date().toISOString()
    }
  }

  function rejectRefund(id: string) {
    const refund = refunds.value.find(r => r.id === id)
    if (refund) {
      refund.status = 'rejected' as RefundStatus
    }
  }

  function buildTraceChain(orderId: string, refundId?: string): RefundTrace[] {
    const orderStore = useOrderStore()
    const remakeStore = useRemakeStore()

    const order = orderStore.getOrderById(orderId)
    if (!order) return []

    const chain: RefundTrace[] = []
    const seenTraceTargets = new Set<string>()

    const manualTraces = refundId ? getTracesByRefundId(refundId) : []

    for (const trace of manualTraces) {
      chain.push({ ...trace })
      seenTraceTargets.add(`${trace.traceType}-${trace.traceTargetId}`)
    }

    const orderKey = `order-${orderId}`
    if (!seenTraceTargets.has(orderKey)) {
      chain.push({
        id: `trc-auto-${orderId}-order`,
        refundId: refundId || '',
        traceType: 'order',
        traceTargetId: orderId,
        summary: `订单创建：${order.items.map(i => `${i.name}×${i.quantity}`).join('、')}，¥${order.totalPrice}，当前状态：${order.status === 'refunded' ? '已退款' : order.status}`,
      })
      seenTraceTargets.add(orderKey)
    }

    const changes = orderStore.getChangesByOrderId(orderId)
    for (const change of changes) {
      const key = `change-${change.id}`
      if (!seenTraceTargets.has(key)) {
        chain.push({
          id: `trc-auto-${orderId}-chg-${change.id}`,
          refundId: refundId || '',
          traceType: 'change',
          traceTargetId: change.id,
          summary: `订单变更：${change.oldValue} → ${change.newValue}（${change.reason}）${change.pushedToSchedule ? '，已推送排产' : '，未推送排产'}`,
        })
        seenTraceTargets.add(key)
      }
    }

    const remakeTickets = remakeStore.ticketsByOrderId.get(orderId) ?? []
    for (const ticket of remakeTickets) {
      const key = `remake-${ticket.id}`
      if (!seenTraceTargets.has(key)) {
        chain.push({
          id: `trc-auto-${orderId}-rmk-${ticket.id}`,
          refundId: refundId || '',
          traceType: 'remake',
          traceTargetId: ticket.id,
          summary: `补做工单：${ticket.reason}（${ticket.category}）${ticket.status === 'completed' ? '，已完成' : ticket.status === 'producing' ? '，重做中' : '，待处理'}`,
        })
        seenTraceTargets.add(key)
      }

      const losses = remakeStore.getLossesByTicketId(ticket.id)
      for (const loss of losses) {
        const lossKey = `loss-${loss.id}`
        if (!seenTraceTargets.has(lossKey)) {
          chain.push({
            id: `trc-auto-${orderId}-loss-${loss.id}`,
            refundId: refundId || '',
            traceType: 'loss',
            traceTargetId: loss.id,
            summary: `材料损耗：${loss.materialName} ${loss.quantity}${loss.unit}，¥${loss.cost}`,
          })
          seenTraceTargets.add(lossKey)
        }
      }
    }

    const relatedRefunds = refunds.value.filter(r => r.orderId === orderId)
    for (const refund of relatedRefunds) {
      const refundKey = `refund-${refund.id}`
      if (!seenTraceTargets.has(refundKey)) {
        chain.push({
          id: `trc-auto-${orderId}-ref-${refund.id}`,
          refundId: refund.id,
          traceType: 'order',
          traceTargetId: refund.id,
          summary: `退款单：${refund.reason}，¥${refund.amount}，状态：${refund.status === 'approved' || refund.status === 'completed' ? '已批准' : refund.status === 'rejected' ? '已拒绝' : '处理中'}`,
        })
        seenTraceTargets.add(refundKey)
      }
    }

    return chain
  }

  return {
    refunds,
    traces,
    pendingRefunds,
    getTracesByRefundId,
    createRefund,
    approveRefund,
    rejectRefund,
    buildTraceChain,
  }
})
