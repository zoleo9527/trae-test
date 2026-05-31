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
  const refundedOrders = computed(() =>
    orders.value.filter(o => o.status === 'refunded'),
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
    const order = getOrderById(change.orderId)
    if (!order) return

    let existingItems = scheduleStore.getScheduleByOrderId(change.orderId)

    if (existingItems.length === 0) {
      createScheduleFromOrder(order)
      existingItems = scheduleStore.getScheduleByOrderId(change.orderId)
    }

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

  function createScheduleFromOrder(order: Order) {
    const scheduleStore = useScheduleStore()
    const stations = inferStationsFromItems(order.items)
    const timeSlot = inferTimeSlotFromPickup(order.pickupTime)

    for (const station of stations) {
      scheduleStore.addScheduleItem({
        id: `SCH-NEW-${order.id}-${station}-${Date.now()}`,
        orderId: order.id,
        date: order.pickupDate,
        timeSlot,
        station,
        status: 'pending',
        isChanged: true,
        isRemake: false,
      })
    }

    if (order.status === 'pending' || order.status === 'confirmed') {
      order.status = 'scheduled'
    }
  }

  function inferStationsFromItems(items: Order['items']): string[] {
    const stations: string[] = []
    for (const item of items) {
      const name = item.name
      if (name.includes('蛋糕') && !stations.includes('蛋糕线')) {
        stations.push('蛋糕线')
      } else if (name.includes('千层') && !stations.includes('千层线')) {
        stations.push('千层线')
      } else if (name.includes('卷') && !name.includes('可颂') && !stations.includes('蛋糕卷线')) {
        stations.push('蛋糕卷线')
      } else if (name.includes('吐司') && !stations.includes('吐司线')) {
        stations.push('吐司线')
      } else if (name.includes('可颂') && !stations.includes('酥皮线')) {
        stations.push('酥皮线')
      } else if ((name.includes('塔') || name.includes('挞')) && !stations.includes('塔线')) {
        stations.push('塔线')
      } else if (name.includes('熔岩') && !stations.includes('蛋糕线')) {
        stations.push('蛋糕线')
      } else if (name.includes('肉桂') && !stations.includes('面包线')) {
        stations.push('面包线')
      }
    }
    return stations.length > 0 ? stations : ['面包线']
  }

  function inferTimeSlotFromPickup(pickupTime: string): string {
    const [h] = pickupTime.split(':').map(Number)
    if (h <= 10) return '06:00-10:00'
    if (h <= 12) return '08:00-12:00'
    if (h <= 15) return '09:00-13:00'
    if (h <= 17) return '10:00-14:00'
    return '11:00-15:00'
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
    refundedOrders,
    ordersWithChanges,
    confirmOrder,
    updateOrderStatus,
    addChange,
    pushChangeToSchedule,
    getOrderById,
    getChangesByOrderId,
  }
})
