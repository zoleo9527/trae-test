import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Receipt, ReceiptStatus } from '../types'
import { mockReceipts } from '../data/mockData'
import { useOrderStore } from './orderStore'
import { useSplitStore } from './splitStore'

interface ReceiptState {
  receipts: Receipt[]
  addReceipt: (splitId: string, receipt: Omit<Receipt, 'id' | 'createdAt' | 'splitId'>, operator: string) => void
  updateReceipt: (id: string, patch: Partial<Receipt>) => void
  getReceiptsByOrderId: (orderId: string) => Receipt[]
  getReceiptBySplitId: (splitId: string) => Receipt | undefined
  resetData: () => void
}

export const useReceiptStore = create<ReceiptState>()(
  persist(
    (set, get) => ({
      receipts: mockReceipts,
      addReceipt: (splitId, receipt, operator) => {
        const split = useSplitStore.getState().splits.find((s) => s.id === splitId)
        if (!split) return

        const newReceipt: Receipt = {
          ...receipt,
          splitId,
          id: nanoid(),
          createdAt: new Date(),
        }

        set((state) => ({
          receipts: [...state.receipts, newReceipt],
        }))

        const eventType = receipt.status === 'exception' ? 'receipt_exception' : 'receipt_sign'
        useOrderStore.getState().addTimelineEvent({
          type: eventType,
          orderId: split.orderId,
          splitId,
          title: `${split.splitNo.slice(-3)}单${receipt.status === 'exception' ? '签收异常' : '签收'}`,
          description: receipt.status === 'exception'
            ? `异常说明：${receipt.exceptionNote || '未填写'}`
            : `${receipt.signedBy || '客户'}正常签收，无异常`,
          operator,
          isException: receipt.status === 'exception',
          needsReview: receipt.status === 'exception',
        })

        if (receipt.status !== 'exception') {
          useSplitStore.getState().updateSplitStatus(splitId, 'completed')
          useOrderStore.getState().removeReviewSource(split.orderId, 'receipt_exception', newReceipt.id)
        } else {
          useOrderStore.getState().addReviewSource(split.orderId, {
            type: 'receipt_exception',
            reason: receipt.exceptionNote || '签收异常，需确认处理',
            sourceId: newReceipt.id,
          })
        }
      },
      updateReceipt: (id, patch) => set((state) => ({
        receipts: state.receipts.map((r) =>
          r.id === id ? { ...r, ...patch } : r
        ),
      })),
      getReceiptsByOrderId: (orderId) => {
        const splits = useSplitStore.getState().getSplitsByOrderId(orderId)
        const splitIds = splits.map((s) => s.id)
        return get().receipts.filter((r) => splitIds.includes(r.splitId))
      },
      getReceiptBySplitId: (splitId) => get().receipts.find((r) => r.splitId === splitId),
      resetData: () => set({
        receipts: mockReceipts,
      }),
    }),
    {
      name: 'receipt-storage',
    }
  )
)
