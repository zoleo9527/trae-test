<template>
  <div class="space-y-6">
    <CalendarView
      :events="calendarEvents"
      @event-click="handleEventClick"
      @date-select="handleDateSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useBookingStore } from '~/stores/booking'
import { useComplaintStore } from '~/stores/complaint'
import { usePatrolStore } from '~/stores/patrol'
import { useEquipmentStore } from '~/stores/equipment'
import CalendarView from '~/components/CalendarView.vue'
import type { CalendarEvent } from '~/types'

const bookingStore = useBookingStore()
const complaintStore = useComplaintStore()
const patrolStore = usePatrolStore()
const equipmentStore = useEquipmentStore()

const calendarEvents = computed((): CalendarEvent[] => {
  const events: CalendarEvent[] = []

  bookingStore.bookings.forEach(b => {
    events.push({
      id: `booking-${b.id}`,
      date: b.date,
      type: 'booking',
      title: `${b.customerName} - ${getBookingTypeLabel(b.type)}`,
      description: `打位: ${b.bayNumber || '未分配'}`,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      relatedId: b.id,
      priority: b.status === 'pending' ? 'high' : 'medium'
    })
  })

  patrolStore.patrols.forEach(p => {
    events.push({
      id: `patrol-${p.id}`,
      date: p.date,
      type: 'patrol',
      title: `巡场 - ${p.location}`,
      description: `检查项: ${p.items.length}项, 问题: ${p.issues.length}个`,
      startTime: p.startTime,
      endTime: p.endTime,
      status: p.status,
      relatedId: p.id,
      priority: p.status === 'pending' ? 'high' : 'medium'
    })
  })

  complaintStore.complaints.forEach(c => {
    if (c.expectedResolveDate) {
      events.push({
        id: `complaint-${c.id}`,
        date: c.expectedResolveDate,
        type: 'complaint',
        title: c.title,
        description: `投诉人: ${c.customerName}`,
        status: c.status,
        relatedId: c.id,
        priority: c.priority
      })
    }
  })

  equipmentStore.equipment.forEach(e => {
    e.borrowHistory.forEach(b => {
      if (b.status === 'active') {
        events.push({
          id: `equipment-due-${e.id}`,
          date: b.expectedReturnDate,
          type: 'equipment_due',
          title: `${e.name} 归还`,
          description: `借用人: ${b.borrowerName}`,
          status: dayjs(b.expectedReturnDate).isBefore(dayjs(), 'day') ? 'overdue' : 'pending',
          relatedId: e.id,
          priority: dayjs(b.expectedReturnDate).isBefore(dayjs(), 'day') ? 'urgent' : 'high'
        })
      }
    })

    if (e.nextMaintenanceDate) {
      events.push({
        id: `maintenance-${e.id}`,
        date: e.nextMaintenanceDate,
        type: 'maintenance',
        title: `${e.name} 维护`,
        description: `下次维护日期`,
        status: 'pending',
        relatedId: e.id,
        priority: 'medium'
      })
    }
  })

  return events
})

function getBookingTypeLabel(type: string) {
  const map: Record<string, string> = {
    driving_range: '练习场',
    putting_green: '推杆区',
    chipping_area: '切杆区',
    lesson: '教练课'
  }
  return map[type] || type
}

function handleEventClick(event: CalendarEvent) {
  const routeMap: Record<string, string> = {
    booking: `/booking/${event.relatedId}`,
    patrol: `/patrol/${event.relatedId}`,
    complaint: `/complaint/${event.relatedId}`,
    equipment_due: `/equipment/${event.relatedId}`,
    maintenance: `/equipment/${event.relatedId}`
  }
  if (routeMap[event.type]) {
    navigateTo(routeMap[event.type])
  }
}

function handleDateSelect(date: string) {
  console.log('Selected date:', date)
}
</script>
