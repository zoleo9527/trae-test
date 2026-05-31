import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, OrderChange, OrderStatus } from '@/types'
import { orders as mockOrders, orderChanges as mockChanges } from '@/data/mockOrders'
import { useScheduleStore } from '@/stores/schedule'

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
    if (!change || change.pushedToSchedule) return

    const scheduleStore = useScheduleStore()
    const existingItems = scheduleStore.getScheduleByOrderId(change.orderId)

    if (change.changeType === 'time_change') {
      for (const item of existingItems) {
        scheduleStore.updateScheduleItem(item.id, {
          isChanged: true,
          timeSlot: shiftTimeSlot(item.timeSlot, change.newValue),
        })
      }
    } else if (change.changeType === 'quantity_change' || change.changeType === 'item_change') {
      for (const item of existingItems) {
        scheduleStore.updateScheduleItem(item.id, {
          isChanged: true,
        })
      }
      if (existingItems.length > 0) {
        const refItem = existingItems[0]
        scheduleStore.addScheduleItem({
          id: `SCH-CHG-${changeId}-${Date.now()}`,
          orderId: change.orderId,
          date: refItem.date,
          timeSlot: extendTimeSlot(refItem.timeSlot),
          station: refItem.station,
          status: 'pending',
          isChanged: true,
          isRemake: false,
        })
      }
    } else if (change.changeType === 'cancel_item') {
      for (const item of existingItems) {
        scheduleStore.updateScheduleItem(item.id, {
          isChanged: true,
        })
      }
    }

    change.pushedToSchedule = true
  }

  function shiftTimeSlot(currentSlot: string, newPickupTime: string): string {
    const [start] = currentSlot.split('-')
    const [newH] = newPickupTime.split(':').map(Number)
    const [oldH] = start.split(':').map(Number)
    const diff = newH - oldH
    if (diff === 0) return currentSlot
    return currentSlot.split('-').map(t => {
      const [h, m] = t.split(':').map(Number)
      const newHour = h + diff
      return `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }).join('-')
  }

  function extendTimeSlot(slot: string): string {
    const parts = slot.split('-')
    if (parts.length < 2) return slot
    const [endH, endM] = parts[1].split(':').map(Number)
    return `${parts[0]}-${String(endH + 1).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
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
