import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ScheduleItem } from '@/types'
import { schedules as mockSchedules } from '@/data/mockSchedules'

export const useScheduleStore = defineStore('schedule', () => {
  const scheduleItems = ref<ScheduleItem[]>([...mockSchedules])

  const todaySchedule = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return scheduleItems.value.filter(s => s.date === today)
  })

  const pendingSchedule = computed(() =>
    scheduleItems.value.filter(s => s.status === 'pending'),
  )

  const changedSchedule = computed(() =>
    scheduleItems.value.filter(s => s.isChanged),
  )

  const remakeSchedule = computed(() =>
    scheduleItems.value.filter(s => s.isRemake),
  )

  function addScheduleItem(item: ScheduleItem) {
    scheduleItems.value.push(item)
  }

  function updateScheduleStatus(id: string, status: ScheduleItem['status']) {
    const item = scheduleItems.value.find(s => s.id === id)
    if (item) {
      item.status = status
    }
  }

  function updateScheduleItem(id: string, patch: Partial<ScheduleItem>) {
    const item = scheduleItems.value.find(s => s.id === id)
    if (item) {
      Object.assign(item, patch)
    }
  }

  function getScheduleByOrderId(orderId: string) {
    return scheduleItems.value.filter(s => s.orderId === orderId)
  }

  return {
    scheduleItems,
    todaySchedule,
    pendingSchedule,
    changedSchedule,
    remakeSchedule,
    addScheduleItem,
    updateScheduleStatus,
    updateScheduleItem,
    getScheduleByOrderId,
  }
})
