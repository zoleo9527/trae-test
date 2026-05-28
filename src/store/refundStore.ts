import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Refund, RefundStatus, ResponsibilityChain, ResponsibilityType } from '../types'
import { mockRefunds, mockResponsibilityChains } from '../data/mockData'
import { useOrderStore } from './orderStore'

interface RefundState {
  refunds: Refund[]
  responsibilityChains: ResponsibilityChain[]
  createRefund: (refund: Omit<Refund, 'id' | 'createdAt' | 'status'>) => void
  createResponsibilityChain: (chain: Omit<ResponsibilityChain, 'id'>) => ResponsibilityChain
  approveRefund: (id: string, level: 'finance' | 'manager', opinion: string, approver: string) => void
  rejectRefund: (id: string, level: 'finance' | 'manager', opinion: string, approver: string) => void
  getRefundById: (id: string) => Refund | undefined
  getRefundsByOrderId: (orderId: string) => Refund[]
  getResponsibilityChainById: (id: string) => ResponsibilityChain | undefined
  resetData: () => void
}

export const useRefundStore = create<RefundState>()(
  persist(
    (set, get) => ({
      refunds: mockRefunds,
      responsibilityChains: mockResponsibilityChains,
      createRefund: (refundData) => {
        const newRefund: Refund = {
          ...refundData,
          id: nanoid(),
          status: 'pending',
          createdAt: new Date(),
        }

        set((state) => ({
          refunds: [...state.refunds, newRefund],
        }))

        useOrderStore.getState().addTimelineEvent({
          type: 'refund_create',
          orderId: refundData.orderId,
          splitId: refundData.splitId,
          refundId: newRefund.id,
          title: '退款申请',
          description: `申请退款¥${refundData.amount}，责任方已绑定`,
          operator: refundData.createdBy,
        })
      },
      createResponsibilityChain: (chain) => {
        const newChain: ResponsibilityChain = {
          ...chain,
          id: nanoid(),
        }
        set((state) => ({
          responsibilityChains: [...state.responsibilityChains, newChain],
        }))
        return newChain
      },
      approveRefund: (id, level, opinion, approver) => set((state) => {
        const refund = state.refunds.find((r) => r.id === id)
        if (!refund) return state

        let newStatus: RefundStatus = refund.status
        const update: Partial<Refund> = {}

        if (level === 'finance') {
          newStatus = 'finance_approved'
          update.financeOpinion = opinion
          update.financeApprovedBy = approver
          update.financeApprovedAt = new Date()
        } else if (level === 'manager') {
          newStatus = 'completed'
          update.managerOpinion = opinion
          update.managerApprovedBy = approver
          update.managerApprovedAt = new Date()
        }

        useOrderStore.getState().addTimelineEvent({
          type: 'refund_approve',
          orderId: refund.orderId,
          splitId: refund.splitId,
          refundId: id,
          title: level === 'finance' ? '财务审核通过' : '管理层已确认',
          description: opinion,
          operator: approver,
        })

        return {
          refunds: state.refunds.map((r) =>
            r.id === id ? { ...r, ...update, status: newStatus } : r
          ),
        }
      }),
      rejectRefund: (id, level, opinion, approver) => set((state) => {
        const refund = state.refunds.find((r) => r.id === id)
        if (!refund) return state

        const update: Partial<Refund> = {}
        if (level === 'finance') {
          update.financeOpinion = opinion
          update.financeApprovedBy = approver
          update.financeApprovedAt = new Date()
        } else {
          update.managerOpinion = opinion
          update.managerApprovedBy = approver
          update.managerApprovedAt = new Date()
        }

        useOrderStore.getState().addTimelineEvent({
          type: 'refund_reject',
          orderId: refund.orderId,
          splitId: refund.splitId,
          refundId: id,
          title: `${level === 'finance' ? '财务' : '管理层'}驳回`,
          description: opinion,
          operator: approver,
          isException: true,
          needsReview: true,
        })

        useOrderStore.getState().addReviewSource(refund.orderId, {
          type: 'refund_rejected',
          reason: `${level === 'finance' ? '财务' : '管理层'}驳回：${opinion}`,
          sourceId: id,
        })

        return {
          refunds: state.refunds.map((r) =>
            r.id === id ? { ...r, ...update, status: 'rejected' } : r
          ),
        }
      }),
      getRefundById: (id) => get().refunds.find((r) => r.id === id),
      getRefundsByOrderId: (orderId) => get().refunds.filter((r) => r.orderId === orderId),
      getResponsibilityChainById: (id) => get().responsibilityChains.find((c) => c.id === id),
      resetData: () => set({
        refunds: mockRefunds,
        responsibilityChains: mockResponsibilityChains,
      }),
    }),
    {
      name: 'refund-storage',
    }
  )
)
