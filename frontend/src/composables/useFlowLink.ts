import { computed } from 'vue'
import { useOrderStore } from '@/stores/order'
import { useScheduleStore } from '@/stores/schedule'
import { useRemakeStore } from '@/stores/remake'
import { useRefundStore } from '@/stores/refund'
import type { FlowNode, RoleType } from '@/types'

type NodeStatus = FlowNode['status']

export function useFlowLink(orderId: string) {
  const flowNodes = computed<FlowNode[]>(() => {
    const orderStore = useOrderStore()
    const scheduleStore = useScheduleStore()
    const remakeStore = useRemakeStore()
    const refundStore = useRefundStore()

    const order = orderStore.getOrderById(orderId)
    if (!order) return []

    const changes = orderStore.getChangesByOrderId(orderId)
    const schedules = scheduleStore.getScheduleByOrderId(orderId)
    const remakeTickets = remakeStore.ticketsByOrderId.get(orderId) ?? []
    const refunds = refundStore.refunds.filter(r => r.orderId === orderId)

    const nodes: FlowNode[] = []

    const statusOrder: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      scheduled: 2,
      producing: 3,
      completed: 4,
      exception: 5,
      refunded: 5,
    }
    const orderStep = statusOrder[order.status] ?? 0

    nodes.push({
      step: '1',
      label: '接单',
      role: 'service' as RoleType,
      status: orderStep >= 0 ? 'done' as NodeStatus : 'pending' as NodeStatus,
      timestamp: order.createdAt,
      actor: '客服',
      detail: `${order.customerName} 下单，¥${order.totalPrice}`,
    })

    nodes.push({
      step: '2',
      label: '确认',
      role: 'manager' as RoleType,
      status: orderStep >= 1 ? 'done' as NodeStatus : orderStep === 0 ? 'current' as NodeStatus : 'pending' as NodeStatus,
      timestamp: orderStep >= 1 ? order.createdAt : undefined,
      actor: orderStep >= 1 ? '门店主理人' : undefined,
      detail: '订单已确认',
    })

    const hasChanges = changes.length > 0
    if (hasChanges) {
      nodes.push({
        step: '2.1',
        label: '变更处理',
        role: 'manager' as RoleType,
        status: changes.some(c => c.pushedToSchedule) ? 'done' as NodeStatus : 'current' as NodeStatus,
        timestamp: changes[0].createdAt,
        detail: changes.map(c => `${c.oldValue}→${c.newValue}`).join('；'),
      })
    }

    nodes.push({
      step: '3',
      label: '排产',
      role: 'kitchen' as RoleType,
      status: schedules.length > 0
        ? (schedules.some(s => s.status === 'completed') ? 'done' as NodeStatus : schedules.some(s => s.status === 'producing') ? 'current' as NodeStatus : 'pending' as NodeStatus)
        : (orderStep >= 2 ? 'current' as NodeStatus : 'pending' as NodeStatus),
      timestamp: schedules[0]?.date,
      actor: '后厨负责人',
      detail: schedules.map(s => `${s.station} ${s.timeSlot}`).join('；') || undefined,
    })

    nodes.push({
      step: '4',
      label: '制作',
      role: 'kitchen' as RoleType,
      status: orderStep >= 3
        ? (orderStep >= 4 ? 'done' as NodeStatus : 'current' as NodeStatus)
        : 'pending' as NodeStatus,
      timestamp: schedules.find(s => s.status === 'producing')?.date,
      actor: '后厨',
      detail: schedules.filter(s => s.status === 'producing' || s.status === 'completed').map(s => s.station).join('；') || undefined,
    })

    if (order.status === 'exception') {
      nodes.push({
        step: '5',
        label: '异常',
        role: 'manager' as RoleType,
        status: 'current' as NodeStatus,
        detail: order.remark || '订单异常',
      })
    }

    if (remakeTickets.length > 0) {
      nodes.push({
        step: '5.1',
        label: '补做',
        role: 'kitchen' as RoleType,
        status: remakeTickets.some(t => t.status === 'completed' || t.status === 'closed') ? 'done' as NodeStatus : 'current' as NodeStatus,
        timestamp: remakeTickets[0].createdAt,
        detail: remakeTickets.map(t => `${t.reason}（${t.category}）`).join('；'),
      })
    }

    if (refunds.length > 0 || order.status === 'refunded') {
      nodes.push({
        step: '5.2',
        label: '退款',
        role: 'manager' as RoleType,
        status: order.status === 'refunded' || refunds.some(r => r.status === 'approved' || r.status === 'completed') ? 'done' as NodeStatus : 'current' as NodeStatus,
        timestamp: refunds[0]?.createdAt,
        detail: refunds.length > 0 ? refunds.map(r => `¥${r.amount}（${r.reason}）`).join('；') : '订单已退款',
      })
    }

    nodes.push({
      step: '6',
      label: order.status === 'refunded' ? '已退款' : '完成',
      role: 'service' as RoleType,
      status: order.status === 'completed' || order.status === 'refunded' ? 'done' as NodeStatus : 'pending' as NodeStatus,
      timestamp: order.status === 'completed' ? order.pickupDate : order.status === 'refunded' ? refunds[0]?.completedAt : undefined,
      actor: order.status === 'refunded' ? '门店主理人' : '客服',
      detail: order.status === 'refunded' ? '订单已退款关闭' : '订单已完成',
    })

    return nodes
  })

  return { flowNodes }
}
