import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Order, OrderItem, OrderVersion, OrderStatus } from '../types'
import { mockOrders, mockTimeline } from '../data/mockData'
import type { TimelineEvent } from '../types'

interface OrderState {
  orders: Order[]
  timeline: TimelineEvent[]
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'versions' | 'needsReview'>) => void
  updateOrder: (id: string, patch: Partial<Order>) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  addVersion: (orderId: string, version: Omit<OrderVersion, 'id' | 'createdAt'>, overrideReason?: string) => void
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void
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
      addVersion: (orderId, version, overrideReason) => set((state) => {
        const order = state.orders.find((o) => o.id === orderId)
        if (!order) return state

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

        return {
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  versions: updatedVersions,
                  needsReview: hasExistingCurrent || o.needsReview,
                  reviewReason: hasExistingCurrent ? '版本被覆盖，需确认变更影响' : o.reviewReason,
                  updatedAt: new Date(),
                }
              : o
          ),
          timeline: [...state.timeline, { ...event, id: nanoid(), timestamp: new Date() }],
        }
      }),
      addTimelineEvent: (event) => set((state) => ({
        timeline: [...state.timeline, { ...event, id: nanoid(), timestamp: new Date() }],
      })),
      markAsReviewed: (orderId) => set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId
            ? { ...o, needsReview: false, reviewReason: undefined, updatedAt: new Date() }
            : o
        ),
        timeline: state.timeline.map((e) =>
          e.orderId === orderId && e.needsReview ? { ...e, needsReview: false } : e
        ),
      })),
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
