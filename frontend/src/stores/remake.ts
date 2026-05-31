import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RemakeTicket, MaterialLoss, RemakeStatus } from '@/types'
import { remakeTickets as mockRemakes, materialLosses as mockMaterialLosses } from '@/data/mockRemakes'

export const useRemakeStore = defineStore('remake', () => {
  const tickets = ref<RemakeTicket[]>([...mockRemakes])
  const materialLosses = ref<MaterialLoss[]>([...mockMaterialLosses])

  const openTickets = computed(() =>
    tickets.value.filter(t => t.status === 'open' || t.status === 'scheduled'),
  )

  const ticketsByOrderId = computed(() => {
    const map = new Map<string, RemakeTicket[]>()
    for (const ticket of tickets.value) {
      const list = map.get(ticket.orderId) ?? []
      list.push(ticket)
      map.set(ticket.orderId, list)
    }
    return map
  })

  function createTicket(ticket: RemakeTicket) {
    tickets.value.push(ticket)
  }

  function updateTicketStatus(id: string, status: RemakeStatus) {
    const ticket = tickets.value.find(t => t.id === id)
    if (ticket) {
      ticket.status = status
      if (status === 'completed' || status === 'closed') {
        ticket.completedAt = new Date().toISOString()
      }
    }
  }

  function addMaterialLoss(loss: MaterialLoss) {
    materialLosses.value.push(loss)
  }

  function getLossesByTicketId(ticketId: string) {
    return materialLosses.value.filter(l => l.remakeTicketId === ticketId)
  }

  return {
    tickets,
    materialLosses,
    openTickets,
    ticketsByOrderId,
    createTicket,
    updateTicketStatus,
    addMaterialLoss,
    getLossesByTicketId,
  }
})
