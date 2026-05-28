import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Order, OrderItem, OrderVersion, OrderStatus, ReviewSource, ReviewSourceType } from '../types'
import { mockOrders, mockTimeline } from '../data/mockData'
import type { TimelineEvent } from '../types'
import { useSplitStore } from './splitStore'
import { useReceiptStore } from './receiptStore'
import { useRefundStore } from './refundStore'
import { ReviewSourceLabels } from '../types'

interface OrderState {
  orders: Order[]
  timeline: TimelineEvent[]
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'versions' | 'needsReview' | 'reviewSources'>) => void
  updateOrder: (id: string, patch: Partial<Order>) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  addVersion: (orderId: string, version: Omit<OrderVersion, 'id' | 'createdAt'>, overrideReason?: string) => void
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void
  addReviewSource: (orderId: string, source: Omit<ReviewSource, 'createdAt'>) => void
  removeReviewSource: (orderId: string, type: ReviewSourceType, sourceId?: string) => void
  recalculateReviewReason: (orderId: string) => void
  markAsReviewed: (orderId: string) => void
  getOrderById: (id: string) => Order | undefined
  detectMissingItems: (orderId: string, splitItems: OrderItem[]) => OrderItem[]
  resetData: () => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: mockOrders,
      timeline: mockTimeline,
      addOrder: (order) => set((state) => {
        const newOrder: Order = {
          ...order,
          id: nanoid(),
          createdAt: new Date(),
          updatedAt: new Date(),
          versions: [],
          needsReview: false,
          reviewSources: [],
        }
        const event: Omit<TimelineEvent, 'id' | 'timestamp'> = {
          type: 'order_create',
          orderId: newOrder.id,
          title: '订单创建',
          description: `${order.customerName}的礼品订单已创建`,
          operator: order.createdBy,
        }
        return {
          orders: [...state.orders, newOrder],
          timeline: [...state.timeline, { ...event, id: nanoid(), timestamp: new Date() }],
        }
      }),
      updateOrder: (id, patch) => set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, ...patch, updatedAt: new Date() } : o
        ),
      })),
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, status, updatedAt: new Date() } : o
        ),
      })),
      addVersion: (orderId, version, overrideReason) => {
        const state = get()
        const order = state.orders.find((o) => o.id === orderId)
        if (!order) return

        const hasExistingCurrent = order.versions.some((v) => v.isCurrent)
        const newVersion: OrderVersion = {
          ...version,
          id: nanoid(),
          createdAt: new Date(),
          needsReview: hasExistingCurrent,
          overrideReason: hasExistingCurrent ? overrideReason : undefined,
        }

        const updatedVersions = order.versions.map((v) => ({ ...v, isCurrent: false }))
        updatedVersions.push(newVersion)

        const eventType = hasExistingCurrent ? 'version_override' : 'version_confirm'
        const event: Omit<TimelineEvent, 'id' | 'timestamp'> = {
          type: eventType,
          orderId,
          title: hasExistingCurrent ? '版本覆盖' : '打样确认',
          description: hasExistingCurrent
            ? `版本已覆盖，原因：${overrideReason || '未说明'}`
            : `V${version.versionNo}版设计方案已确认`,
          operator: version.confirmedBy,
          isException: hasExistingCurrent,
          needsReview: hasExistingCurrent,
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  versions: updatedVersions,
                  updatedAt: new Date(),
                }
              : o
          ),
          timeline: [...state.timeline, { ...event, id: nanoid(), timestamp: new Date() }],
        }))

        if (hasExistingCurrent) {
          get().addReviewSource(orderId, {
            type: 'version_override',
            reason: '版本被覆盖，需确认变更影响',
            sourceId: newVersion.id,
          })
        }
      },
      addTimelineEvent: (event) => set((state) => ({
        timeline: [...state.timeline, { ...event, id: nanoid(), timestamp: new Date() }],
      })),
      addReviewSource: (orderId, source) => {
        const newSource: ReviewSource = {
          ...source,
          createdAt: new Date(),
        }
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId)
          if (!order) return state

          const existingSources = order.reviewSources.filter(
            (s) => !(s.type === source.type && s.sourceId === source.sourceId)
          )
          const updatedSources = [...existingSources, newSource]

          const typeLabels = updatedSources.map(
            (s) => `${ReviewSourceLabels[s.type]}：${s.reason}`
          )
          const combinedReason = typeLabels.join('；')

          return {
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    reviewSources: updatedSources,
                    needsReview: updatedSources.length > 0,
                    reviewReason: updatedSources.length > 0 ? combinedReason : undefined,
                    updatedAt: new Date(),
                  }
                : o
            ),
          }
        })
      },
      removeReviewSource: (orderId, type, sourceId) => {
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId)
          if (!order) return state

          let updatedSources = order.reviewSources.filter(
            (s) => {
              if (sourceId) {
                return !(s.type === type && s.sourceId === sourceId)
              }
              return s.type !== type
            }
          )

          const typeLabels = updatedSources.map(
            (s) => `${ReviewSourceLabels[s.type]}：${s.reason}`
          )
          const combinedReason = typeLabels.join('；')

          return {
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    reviewSources: updatedSources,
                    needsReview: updatedSources.length > 0,
                    reviewReason: updatedSources.length > 0 ? combinedReason : undefined,
                    updatedAt: new Date(),
                  }
                : o
            ),
          }
        })
      },
      recalculateReviewReason: (orderId) => {
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId)
          if (!order) return state

          const typeLabels = order.reviewSources.map(
            (s) => `${ReviewSourceLabels[s.type]}：${s.reason}`
          )
          const combinedReason = typeLabels.join('；')

          return {
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    needsReview: o.reviewSources.length > 0,
                    reviewReason: o.reviewSources.length > 0 ? combinedReason : undefined,
                    updatedAt: new Date(),
                  }
                : o
            ),
          }
        })
      },
      markAsReviewed: (orderId) => {
        const splitState = useSplitStore.getState()
        const state = get()
        const order = state.orders.find((o) => o.id === orderId)
        if (!order) return

        const updatedSources = order.reviewSources.filter(
          (s) => s.type !== 'split_missing'
        )

        const typeLabels = updatedSources.map(
          (s) => `${ReviewSourceLabels[s.type]}：${s.reason}`
        )
        const combinedReason = typeLabels.length > 0 ? typeLabels.join('；') : undefined

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  reviewSources: updatedSources,
                  needsReview: updatedSources.length > 0,
                  reviewReason: combinedReason,
                  updatedAt: new Date(),
                }
              : o
          ),
          timeline: state.timeline.map((e) =>
            e.orderId === orderId && e.needsReview ? { ...e, needsReview: false } : e
          ),
        }))

        splitState.clearMissingWarning(orderId)
      },
      getOrderById: (id) => get().orders.find((o) => o.id === id),
      detectMissingItems: (orderId, splitItems) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return []

        const orderItemTotals = order.items.reduce((acc, item) => {
          acc[item.id] = (acc[item.id] || 0) + item.quantity
          return acc
        }, {} as Record<string, number>)

        const splitItemTotals = splitItems.reduce((acc, item) => {
          acc[item.id] = (acc[item.id] || 0) + item.quantity
          return acc
        }, {} as Record<string, number>)

        const missingItems: OrderItem[] = []
        for (const orderItem of order.items) {
          const ordered = orderItemTotals[orderItem.id] || 0
          const split = splitItemTotals[orderItem.id] || 0
          if (split < ordered) {
            missingItems.push({
              ...orderItem,
              quantity: ordered - split,
            })
          }
        }

        return missingItems
      },
      resetData: () => set({
        orders: mockOrders,
        timeline: mockTimeline,
      }),
    }),
    {
      name: 'order-storage',
    }
  )
)
