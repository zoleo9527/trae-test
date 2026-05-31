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
    }
  }

  function rejectRefund(id: string) {
    const refund = refunds.value.find(r => r.id === id)
    if (refund) {
      refund.status = 'rejected' as RefundStatus
    }
  }

  function buildTraceChain(orderId: string): RefundTrace[] {
    const orderStore = useOrderStore()
    const remakeStore = useRemakeStore()

    const order = orderStore.getOrderById(orderId)
    if (!order) return []

    const chain: RefundTrace[] = []

    chain.push({
      id: `trc-auto-${orderId}-order`,
      refundId: '',
      traceType: 'order',
      traceTargetId: orderId,
      summary: `订单创建：${order.items.map(i => `${i.name}×${i.quantity}`).join('、')}，¥${order.totalPrice}`,
    })

    const changes = orderStore.getChangesByOrderId(orderId)
    for (const change of changes) {
      chain.push({
        id: `trc-auto-${orderId}-chg-${change.id}`,
        refundId: '',
        traceType: 'change',
        traceTargetId: change.id,
        summary: `订单变更：${change.oldValue} → ${change.newValue}（${change.reason}）`,
      })
    }

    const remakeTickets = remakeStore.ticketsByOrderId.get(orderId) ?? []
    for (const ticket of remakeTickets) {
      chain.push({
        id: `trc-auto-${orderId}-rmk-${ticket.id}`,
        refundId: '',
        traceType: 'remake',
        traceTargetId: ticket.id,
        summary: `补做工单：${ticket.reason}（${ticket.category}）`,
      })

      const losses = remakeStore.getLossesByTicketId(ticket.id)
      for (const loss of losses) {
        chain.push({
          id: `trc-auto-${orderId}-loss-${loss.id}`,
          refundId: '',
          traceType: 'loss',
          traceTargetId: loss.id,
          summary: `材料损耗：${loss.materialName} ${loss.quantity}${loss.unit}，¥${loss.cost}`,
        })
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
