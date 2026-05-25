import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TicketOrder } from '@/types'
import { mockTicketOrders } from '@/mock/ticket'

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
        ticket.status = 'verified'
        ticket.verifyTime = new Date().toLocaleString('zh-CN')
        ticket.operator = operator
        order.verifiedCount++
      }
    }
  }

  const batchVerify = (orderId: string, ticketIds: string[], operator: string) => {
    ticketIds.forEach(id => verifyTicket(orderId, id, operator))
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
