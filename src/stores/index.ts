import { defineStore } from 'pinia'
import type {
  RoleType,
  Order,
  AfterSalesTicket,
  SampleLending,
  SupplementaryPart,
  CompensationInfo,
  TicketHistory
} from '../types'
import { roles, buildRelations } from '../data/mock'

export const useAppStore = defineStore('app', {
  state: () => {
    const { mockOrders, mockAfterSalesTickets, mockSampleLendings } = buildRelations()
    return {
      currentRole: 'manager' as RoleType,
      selectedOrderId: null as string | null,
      selectedTicketId: null as string | null,
      orders: mockOrders as Order[],
      afterSalesTickets: mockAfterSalesTickets as AfterSalesTicket[],
      sampleLendings: mockSampleLendings as SampleLending[],
      viewMode: 'overview' as 'overview' | 'detail',
      batchSelection: new Set<string>(),
      toast: null as { message: string; type: 'success' | 'error' | 'info' } | null
    }
  },

  getters: {
    roleInfo(state) {
      return roles.find(r => r.id === state.currentRole)!
    },

    selectedOrder(state): Order | null {
      if (!state.selectedOrderId) return null
      return state.orders.find(o => o.id === state.selectedOrderId) || null
    },

    selectedTicket(state): AfterSalesTicket | null {
      if (!state.selectedTicketId) return null
      return state.afterSalesTickets.find(t => t.id === state.selectedTicketId) || null
    },

    ordersWithStatus(state) {
      return state.orders
    },

    pendingTickets(state): AfterSalesTicket[] {
      return state.afterSalesTickets.filter(t =>
        t.status === 'pending' || t.status === 'processing'
      )
    },

    pendingParts(): SupplementaryPart[] {
      return this.afterSalesTickets
        .filter(t => t.type === 'supplementary')
        .flatMap(t => t.parts.filter(p => !p.confirmed))
    },

    unconfirmedPartsCount(): number {
      return this.pendingParts.length
    },

    overdueLendings(state): SampleLending[] {
      return state.sampleLendings.filter(l => !l.returned && l.overdue)
    },

    activeLendings(state): SampleLending[] {
      return state.sampleLendings.filter(l => !l.returned)
    },

    batchSelectedParts(state): SupplementaryPart[] {
      return state.afterSalesTickets
        .flatMap(t => t.parts)
        .filter(p => state.batchSelection.has(p.id))
    },

    batchSelectedLendings(state): SampleLending[] {
      return state.sampleLendings.filter(l => state.batchSelection.has(l.id))
    },

    statsByRole(state) {
      const role = state.currentRole
      if (role === 'manager') {
        return {
          totalOrders: state.orders.length,
          activeAfterSales: state.afterSalesTickets.filter(t => t.status !== 'resolved' && t.status !== 'rejected').length,
          pendingApproval: state.afterSalesTickets.filter(t =>
            t.type === 'compensation' && t.compensation?.status === 'negotiating'
          ).length,
          overdueLendings: state.sampleLendings.filter(l => !l.returned && l.overdue).length,
          unconfirmedParts: state.afterSalesTickets
            .flatMap(t => t.parts)
            .filter(p => !p.confirmed).length
        }
      }
      if (role === 'consultant') {
        const myTickets = state.afterSalesTickets.filter(t => t.assignee.includes('李明') || t.assignee.includes('周琳'))
        return {
          myTickets: myTickets.length,
          pendingResponse: myTickets.filter(t => t.status === 'pending').length,
          processing: myTickets.filter(t => t.status === 'processing').length,
          needFollowup: state.sampleLendings.filter(l => !l.returned).length
        }
      }
      return {
        installingOrders: state.orders.filter(o => o.status === 'installing').length,
        arrivingOrders: state.orders.filter(o => o.status === 'arriving').length,
        partsToTrack: state.afterSalesTickets
          .flatMap(t => t.parts)
          .filter(p => p.confirmed).length
      }
    }
  },

  actions: {
    setRole(role: RoleType) {
      this.currentRole = role
      this.clearSelection()
      this.showToast(`已切换到「${roles.find(r => r.id === role)?.name}」视角`, 'info')
    },

    selectOrder(orderId: string | null) {
      this.selectedOrderId = orderId
      this.selectedTicketId = null
      this.viewMode = orderId ? 'detail' : 'overview'
    },

    selectTicket(ticketId: string | null) {
      this.selectedTicketId = ticketId
      if (ticketId) {
        const ticket = this.afterSalesTickets.find(t => t.id === ticketId)
        if (ticket) {
          this.selectedOrderId = ticket.orderId
        }
      }
      this.viewMode = ticketId ? 'detail' : 'overview'
    },

    clearSelection() {
      this.selectedOrderId = null
      this.selectedTicketId = null
      this.viewMode = 'overview'
      this.batchSelection.clear()
    },

    toggleBatchSelect(id: string) {
      if (this.batchSelection.has(id)) {
        this.batchSelection.delete(id)
      } else {
        this.batchSelection.add(id)
      }
    },

    clearBatchSelection() {
      this.batchSelection.clear()
    },

    confirmPart(partId: string, confirmedBy: string) {
      for (const ticket of this.afterSalesTickets) {
        const part = ticket.parts.find(p => p.id === partId)
        if (part) {
          part.confirmed = true
          part.confirmedBy = confirmedBy
          part.confirmedAt = this._now()
          this._addTicketHistory(ticket, '确认补件', confirmedBy, `已确认补件：${part.name}`)
          this._updateTicketTimestamp(ticket)
          this.showToast(`补件「${part.name}」已确认`, 'success')
          return
        }
      }
    },

    batchConfirmParts(confirmedBy: string) {
      let count = 0
      for (const ticket of this.afterSalesTickets) {
        for (const part of ticket.parts) {
          if (this.batchSelection.has(part.id) && !part.confirmed) {
            part.confirmed = true
            part.confirmedBy = confirmedBy
            part.confirmedAt = this._now()
            count++
          }
        }
        if (count > 0) {
          this._addTicketHistory(ticket, '批量确认补件', confirmedBy, `批量确认 ${count} 项补件`)
          this._updateTicketTimestamp(ticket)
        }
      }
      this.showToast(`已批量确认 ${count} 项补件`, 'success')
      this.batchSelection.clear()
    },

    returnSample(lendingId: string, returnedBy: string) {
      const lending = this.sampleLendings.find(l => l.id === lendingId)
      if (lending) {
        lending.returned = true
        lending.returnedAt = this._now()
        this.showToast(`样品「${lending.itemName}」已登记归还`, 'success')
      }
    },

    batchReturnSamples(returnedBy: string) {
      let count = 0
      for (const lending of this.sampleLendings) {
        if (this.batchSelection.has(lending.id) && !lending.returned) {
          lending.returned = true
          lending.returnedAt = this._now()
          count++
        }
      }
      this.showToast(`已登记 ${count} 个样品归还`, 'success')
      this.batchSelection.clear()
    },

    updateTicketStatus(ticketId: string, status: AfterSalesTicket['status'], by: string) {
      const ticket = this.afterSalesTickets.find(t => t.id === ticketId)
      if (ticket) {
        const statusMap: Record<string, string> = {
          pending: '待处理',
          processing: '处理中',
          confirmed: '已确认',
          resolved: '已解决',
          rejected: '已拒绝'
        }
        ticket.status = status
        this._addTicketHistory(ticket, '更新状态', by, `状态更新为：${statusMap[status]}`)
        this._updateTicketTimestamp(ticket)
        this.showToast(`工单状态已更新为「${statusMap[status]}」`, 'success')
      }
    },

    submitCompensation(ticketId: string, by: string) {
      const ticket = this.afterSalesTickets.find(t => t.id === ticketId)
      if (ticket && ticket.compensation) {
        ticket.compensation.status = 'negotiating'
        this._addTicketHistory(ticket, '提交赔付方案', by, `提交赔付方案：¥${ticket.compensation.amount}`)
        this._updateTicketTimestamp(ticket)
        this.showToast('赔付方案已提交审批', 'success')
      }
    },

    approveCompensation(ticketId: string, by: string) {
      const ticket = this.afterSalesTickets.find(t => t.id === ticketId)
      if (ticket && ticket.compensation) {
        ticket.compensation.status = 'approved'
        ticket.compensation.approvedBy = by
        ticket.compensation.approvedAt = this._now()
        ticket.status = 'resolved'
        this._addTicketHistory(ticket, '审批赔付', by, `审批通过赔付 ¥${ticket.compensation.amount}`)
        this._updateTicketTimestamp(ticket)
        this.showToast('赔付方案已审批通过', 'success')
      }
    },

    rejectCompensation(ticketId: string, by: string, reason: string) {
      const ticket = this.afterSalesTickets.find(t => t.id === ticketId)
      if (ticket && ticket.compensation) {
        ticket.compensation.status = 'rejected'
        ticket.status = 'rejected'
        this._addTicketHistory(ticket, '拒绝赔付', by, `拒绝赔付，原因：${reason}`)
        this._updateTicketTimestamp(ticket)
        this.showToast('已拒绝赔付方案', 'info')
      }
    },

    addTicketNote(ticketId: string, note: string, by: string) {
      const ticket = this.afterSalesTickets.find(t => t.id === ticketId)
      if (ticket) {
        this._addTicketHistory(ticket, '添加备注', by, note)
        this._updateTicketTimestamp(ticket)
        this.showToast('备注已添加', 'success')
      }
    },

    showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
      this.toast = { message, type }
      setTimeout(() => {
        this.toast = null
      }, 3000)
    },

    _now(): string {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    },

    _addTicketHistory(ticket: AfterSalesTicket, action: string, by: string, detail: string) {
      ticket.history.unshift({
        action,
        by,
        at: this._now(),
        detail
      } as TicketHistory)
    },

    _updateTicketTimestamp(ticket: AfterSalesTicket) {
      ticket.updatedAt = this._now()
    }
  }
})