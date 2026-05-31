import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderChange, OrderStatus } from '@/types'
import { orders as mockOrders, orderChanges as mockChanges } from '@/data/mockOrders'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([...mockOrders])
  const changes = ref<OrderChange[]>([...mockChanges])

  const pendingOrders = computed(() =>
    orders.value.filter(o => o.status === 'pending'),
  )
  const confirmedOrders = computed(() =>
    orders.value.filter(o => o.status === 'confirmed'),
  )
  const exceptionOrders = computed(() =>
    orders.value.filter(o => o.status === 'exception'),
  )
  const ordersWithChanges = computed(() =>
    orders.value.filter(o => changes.value.some(c => c.orderId === o.id)),
  )

  function confirmOrder(id: string) {
    const order = orders.value.find(o => o.id === id)
    if (order && order.status === 'pending') {
      order.status = 'confirmed' as OrderStatus
      order.updatedAt = new Date().toISOString()
    }
  }

  function updateOrderStatus(id: string, status: OrderStatus) {
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.status = status
    }
  }

  function addChange(change: OrderChange) {
    changes.value.push(change)
  }

  function pushChangeToSchedule(changeId: string) {
    const change = changes.value.find(c => c.id === changeId)
    if (change) {
      change.pushedToSchedule = true
    }
  }

  function getOrderById(id: string) {
    return orders.value.find(o => o.id === id)
  }

  function getChangesByOrderId(orderId: string) {
    return changes.value.filter(c => c.orderId === orderId)
  }

  return {
    orders,
    changes,
    pendingOrders,
    confirmedOrders,
    exceptionOrders,
    ordersWithChanges,
    confirmOrder,
    updateOrderStatus,
    addChange,
    pushChangeToSchedule,
    getOrderById,
    getChangesByOrderId,
  }
})
