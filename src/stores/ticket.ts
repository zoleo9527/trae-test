import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TicketOrder } from '@/types'
import { mockTicketOrders } from '@/mock/ticket'
import { useTraceStore } from './trace'

export const useTicketStore = defineStore('ticket', () => {
  const ticketOrders = ref<TicketOrder[]>([...mockTicketOrders])

  const totalTickets = computed(() => 
    ticketOrders.value.reduce((sum, o) => sum + o.totalCount, 0)
  )
  const verifiedTickets = computed(() => 
    ticketOrders.value.reduce((sum, o) => sum + o.verifiedCount, 0)
  )
  const exceptionTickets = computed(() => 
    ticketOrders.value.reduce((sum, o) => sum + o.exceptionCount, 0)
  )
  const verifyRate = computed(() => {
    if (totalTickets.value === 0) return 0
    return Math.round((verifiedTickets.value / totalTickets.value) * 100)
  })

  const getOrderById = (id: string) => {
    return ticketOrders.value.find(o => o.id === id)
  }

  const verifyTicket = (orderId: string, ticketId: string, operator: string) => {
    const order = getOrderById(orderId)
    if (order) {
      const ticket = order.items.find(t => t.id === ticketId)
      if (ticket && ticket.status === 'unused') {
        const oldStatus = ticket.status
        ticket.status = 'verified'
        ticket.verifyTime = new Date().toLocaleString('zh-CN')
        ticket.operator = operator
        order.verifiedCount++
        
        const traceStore = useTraceStore()
        traceStore.addLog({
          operator,
          operateTime: new Date().toLocaleString('zh-CN'),
          module: '票务核销',
          action: '核销门票',
          targetId: order.orderNo,
          targetType: 'ticket',
          beforeChange: `门票 ${ticket.ticketNo}: ${oldStatus}`,
          afterChange: `门票 ${ticket.ticketNo}: verified`,
          remark: `${ticket.visitorName} 门票核销成功`
        })
      }
    }
  }

  const batchVerify = (orderId: string, ticketIds: string[], operator: string) => {
    const order = getOrderById(orderId)
    if (!order) return
    
    const oldVerified = order.verifiedCount
    ticketIds.forEach(id => verifyTicket(orderId, id, operator))
    
    const traceStore = useTraceStore()
    traceStore.addLog({
      operator,
      operateTime: new Date().toLocaleString('zh-CN'),
      module: '票务核销',
      action: '批量核销',
      targetId: order.orderNo,
      targetType: 'ticket',
      beforeChange: `已核销: ${oldVerified}`,
      afterChange: `已核销: ${order.verifiedCount}`,
      remark: `批量核销 ${ticketIds.length} 张门票`
    })
  }

  return {
    ticketOrders,
    totalTickets,
    verifiedTickets,
    exceptionTickets,
    verifyRate,
    getOrderById,
    verifyTicket,
    batchVerify
  }
})
