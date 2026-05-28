import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { SplitOrder, SplitItem, SplitStatus, OrderItem } from '../types'
import { mockSplits } from '../data/mockData'
import { useOrderStore } from './orderStore'

interface SplitState {
  splits: SplitOrder[]
  createSplit: (orderId: string, items: SplitItem[], operator: string) => SplitOrder | undefined
  updateSplitStatus: (id: string, status: SplitStatus) => void
  confirmShip: (id: string, trackingNo: string, shippedBy: string) => void
  detectMissingItems: (orderId: string, currentSplits?: SplitOrder[]) => { missing: OrderItem[]; splitItems: SplitItem[] }
  getSplitsByOrderId: (orderId: string) => SplitOrder[]
  clearMissingWarning: (orderId: string) => void
  resetData: () => void
}

export const useSplitStore = create<SplitState>()(
  persist(
    (set, get) => ({
      splits: mockSplits,
      createSplit: (orderId, items, operator) => {
        const order = useOrderStore.getState().getOrderById(orderId)
        if (!order) return undefined

        const existingSplits = get().getSplitsByOrderId(orderId)
        const splitNo = `${order.orderNo}-S${String(existingSplits.length + 1).padStart(2, '0')}`

        const tempSplit: SplitOrder = {
          id: 'temp',
          orderId,
          splitNo,
          items,
          status: 'pending',
          createdAt: new Date(),
        }
        const { missing } = get().detectMissingItems(orderId, [...existingSplits, tempSplit])
        const hasMissing = missing.length > 0

        const newSplit: SplitOrder = {
          id: nanoid(),
          orderId,
          splitNo,
          items,
          status: 'pending',
          createdAt: new Date(),
          missingWarning: hasMissing,
        }

        set((state) => ({
          splits: [...state.splits, newSplit],
        }))

        useOrderStore.getState().addTimelineEvent({
          type: 'split_create',
          orderId,
          splitId: newSplit.id,
          title: `拆单发货${splitNo.slice(-3)}`,
          description: `拆分为${items.length}类商品，共${items.reduce((sum, i) => sum + i.quantity, 0)}件`,
          operator,
          isException: hasMissing,
          needsReview: hasMissing,
        })

        if (hasMissing) {
          const missingItems = missing.map((m) => `${m.name}还差${m.quantity}件`).join('，')
          useOrderStore.getState().addReviewSource(orderId, {
            type: 'split_missing',
            reason: missingItems,
            sourceId: newSplit.id,
          })
        }

        useOrderStore.getState().updateOrderStatus(orderId, 'split')

        return newSplit
      },
      updateSplitStatus: (id, status) => set((state) => ({
        splits: state.splits.map((s) =>
          s.id === id ? { ...s, status } : s
        ),
      })),
      confirmShip: (id, trackingNo, shippedBy) => set((state) => {
        const split = state.splits.find((s) => s.id === id)
        if (!split) return state

        useOrderStore.getState().addTimelineEvent({
          type: 'split_ship',
          orderId: split.orderId,
          splitId: id,
          title: `${split.splitNo.slice(-3)}单发货`,
          description: `物流单号：${trackingNo}，已发出`,
          operator: shippedBy,
        })

        const orderSplits = state.splits.filter((s) => s.orderId === split.orderId && s.id !== id)
        const allShipped = orderSplits.every((s) => s.status === 'shipped' || s.status === 'completed')
        if (allShipped) {
          useOrderStore.getState().updateOrderStatus(split.orderId, 'shipped')
        }

        return {
          splits: state.splits.map((s) =>
            s.id === id
              ? { ...s, status: 'shipped', trackingNo, shippedBy, shippedAt: new Date() }
              : s
          ),
        }
      }),
      detectMissingItems: (orderId, currentSplits) => {
        const order = useOrderStore.getState().getOrderById(orderId)
        if (!order) return { missing: [], splitItems: [] }

        const splits = currentSplits || get().getSplitsByOrderId(orderId)
        const splitItems = splits.flatMap((s) => s.items)

        const orderItemTotals = order.items.reduce((acc, item) => {
          acc[item.id] = (acc[item.id] || 0) + item.quantity
          return acc
        }, {} as Record<string, number>)

        const splitItemTotals = splitItems.reduce((acc, item) => {
          acc[item.orderItemId] = (acc[item.orderItemId] || 0) + item.quantity
          return acc
        }, {} as Record<string, number>)

        const missing: OrderItem[] = []
        for (const orderItem of order.items) {
          const ordered = orderItemTotals[orderItem.id] || 0
          const split = splitItemTotals[orderItem.id] || 0
          if (split < ordered) {
            missing.push({
              ...orderItem,
              quantity: ordered - split,
            })
          }
        }

        return { missing, splitItems }
      },
      getSplitsByOrderId: (orderId) => get().splits.filter((s) => s.orderId === orderId),
      clearMissingWarning: (orderId) => set((state) => ({
        splits: state.splits.map((s) =>
          s.orderId === orderId ? { ...s, missingWarning: false } : s
        ),
      })),
      resetData: () => set({
        splits: mockSplits,
      }),
    }),
    {
      name: 'split-storage',
    }
  )
)
