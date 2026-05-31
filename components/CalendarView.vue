<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <button @click="prevMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 class="text-xl font-bold text-gray-900 min-w-32 text-center">
          {{ currentYear }}年{{ currentMonth }}月
        </h2>
        <button @click="nextMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button @click="goToToday" class="btn btn-secondary text-sm">
          今天
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-for="view in viewOptions"
          :key="view.value"
          @click="currentView = view.value"
          class="px-3 py-1.5 text-sm rounded-lg transition-colors"
          :class="currentView === view.value ? 'bg-primary-100 text-primary-700 font-medium' : 'hover:bg-gray-100 text-gray-600'"
        >
          {{ view.label }}
        </button>
      </div>
    </div>

    <div class="flex items-center gap-4 mb-4 px-2">
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-full bg-blue-500"></span>
        <span class="text-xs text-gray-600">预约</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-full bg-green-500"></span>
        <span class="text-xs text-gray-600">巡场</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-full bg-red-500"></span>
        <span class="text-xs text-gray-600">投诉</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-full bg-purple-500"></span>
        <span class="text-xs text-gray-600">器材到期</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-full bg-amber-500"></span>
        <span class="text-xs text-gray-600">设备维护</span>
      </div>
    </div>

    <div v-if="currentView === 'month'" class="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
      <div
        v-for="day in weekDays"
        :key="day"
        class="bg-gray-50 py-3 text-center text-sm font-medium text-gray-500"
      >
        {{ day }}
      </div>
      
      <div
        v-for="(week, weekIndex) in calendarDays"
        :key="weekIndex"
        class="contents"
      >
        <div
          v-for="(day, dayIndex) in week"
          :key="dayIndex"
          class="bg-white p-2 min-h-28 relative group"
          :class="{
            'bg-gray-50': !day.isCurrentMonth,
            'bg-primary-50/30': day.isToday,
            'hover:bg-gray-50': true
          }"
          @click="selectDate(day.date)"
        >
          <div class="flex items-center justify-between mb-1">
            <span
              class="text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full"
              :class="{
                'text-gray-400': !day.isCurrentMonth,
                'text-gray-900': day.isCurrentMonth,
                'bg-primary-600 text-white': day.isToday
              }"
            >
              {{ day.day }}
            </span>
            <div v-if="day.eventCount > 0" class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {{ day.eventCount }}
            </div>
          </div>
          
          <div class="space-y-1 max-h-16 overflow-hidden">
            <div
              v-for="event in day.events.slice(0, 3)"
              :key="event.id"
              class="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
              :class="getEventClass(event.type)"
              @click.stop="handleEventClick(event)"
            >
              <span v-if="event.startTime" class="opacity-75 mr-1">{{ event.startTime }}</span>
              {{ event.title }}
            </div>
            <div v-if="day.events.length > 3" class="text-xs text-gray-500 pl-1">
              +{{ day.events.length - 3 }} 更多
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="currentView === 'week'" class="space-y-2">
      <div class="grid grid-cols-8 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
        <div class="bg-gray-50 py-3 text-center text-sm font-medium text-gray-500">
          时间
        </div>
        <div
          v-for="day in weekViewDays"
          :key="day.date"
          class="bg-gray-50 py-3 text-center"
          :class="{ 'bg-primary-50/50': day.isToday }"
        >
          <div class="text-sm font-medium text-gray-500">{{ day.weekDay }}</div>
          <div
            class="text-lg font-bold"
            :class="{ 'text-primary-600': day.isToday, 'text-gray-900': !day.isToday }"
          >
            {{ day.day }}
          </div>
        </div>
      </div>
      
      <div
        v-for="hour in timeSlots"
        :key="hour"
        class="grid grid-cols-8 gap-px bg-gray-200"
      >
        <div class="bg-white py-2 px-2 text-xs text-gray-500 text-right pr-3">
          {{ String(hour).padStart(2, '0') }}:00
        </div>
        <div
          v-for="day in weekViewDays"
          :key="day.date + '-' + hour"
          class="bg-white p-1 min-h-12 hover:bg-gray-50 cursor-pointer transition-colors relative"
          @click="selectDateTime(day.date, hour)"
        >
          <template v-for="event in getEventsForDateTime(day.date, hour)" :key="event.id">
            <div
              class="text-xs px-1.5 py-1 rounded mb-1 truncate cursor-pointer hover:opacity-80 transition-opacity"
              :class="getEventClass(event.type)"
              @click.stop="handleEventClick(event)"
            >
              {{ event.title }}
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="selectedDateEvents.length > 0" class="mt-6 border-t border-gray-200 pt-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        {{ selectedDateLabel }} 的日程
      </h3>
      <div class="space-y-2">
        <div
          v-for="event in selectedDateEvents"
          :key="event.id"
          class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          @click="handleEventClick(event)"
        >
          <div
            class="w-1 h-12 rounded-full flex-shrink-0"
            :class="getEventLineClass(event.type)"
          ></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="text-xs px-2 py-0.5 rounded"
                :class="getEventBadgeClass(event.type)"
              >
                {{ getEventTypeLabel(event.type) }}
              </span>
              <StatusBadge v-if="event.status" :status="event.status" />
              <span v-if="event.priority === 'urgent'" class="badge bg-red-100 text-red-700">紧急</span>
              <span v-else-if="event.priority === 'high'" class="badge bg-orange-100 text-orange-700">高优</span>
            </div>
            <p class="text-sm font-medium text-gray-900 mt-1">{{ event.title }}</p>
            <p v-if="event.description" class="text-xs text-gray-500 mt-0.5 truncate">{{ event.description }}</p>
            <p v-if="event.startTime" class="text-xs text-gray-400 mt-1">
              {{ event.startTime }}{{ event.endTime ? ' - ' + event.endTime : '' }}
            </p>
          </div>
          <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>

    <div v-else-if="selectedDate" class="mt-6 border-t border-gray-200 pt-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        {{ selectedDateLabel }} 的日程
      </h3>
      <div class="text-center py-8 text-gray-500">
        <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-sm">当天暂无日程安排</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import type { CalendarEvent } from '~/types'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  events: CalendarEvent[]
}>()

const emit = defineEmits<{
  (e: 'eventClick', event: CalendarEvent): void
  (e: 'dateSelect', date: string): void
}>()

const currentDate = ref(dayjs())
const currentView = ref<'month' | 'week'>('month')
const selectedDate = ref<string | null>(null)

const viewOptions = [
  { value: 'month' as const, label: '月视图' },
  { value: 'week' as const, label: '周视图' }
]

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7)

const currentYear = computed(() => currentDate.value.year())
const currentMonth = computed(() => currentDate.value.month() + 1)

const calendarDays = computed(() => {
  const year = currentDate.value.year()
  const month = currentDate.value.month()
  const firstDay = dayjs(`${year}-${month + 1}-01`)
  const startOfMonth = firstDay.startOf('month')
  const startOfCalendar = startOfMonth.startOf('week')
  
  const weeks: Array<Array<{
    date: string
    day: number
    isCurrentMonth: boolean
    isToday: boolean
    events: CalendarEvent[]
    eventCount: number
  }>> = []
  
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const day = startOfCalendar.add(w * 7 + d, 'day')
      const dateStr = day.format('YYYY-MM-DD')
      const dayEvents = props.events.filter(e => e.date === dateStr)
      
      week.push({
        date: dateStr,
        day: day.date(),
        isCurrentMonth: day.month() === month,
        isToday: day.isSame(dayjs(), 'day'),
        events: dayEvents,
        eventCount: dayEvents.length
      })
    }
    weeks.push(week)
  }
  
  return weeks
})

const weekViewDays = computed(() => {
  const startOfWeek = currentDate.value.startOf('week')
  const days = []
  
  for (let i = 0; i < 7; i++) {
    const day = startOfWeek.add(i, 'day')
    days.push({
      date: day.format('YYYY-MM-DD'),
      day: day.date(),
      weekDay: weekDays[i],
      isToday: day.isSame(dayjs(), 'day')
    })
  }
  
  return days
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  const date = dayjs(selectedDate.value)
  const today = dayjs()
  if (date.isSame(today, 'day')) return '今天'
  if (date.isSame(today.subtract(1, 'day'), 'day')) return '昨天'
  if (date.isSame(today.add(1, 'day'), 'day')) return '明天'
  return date.format('YYYY年MM月DD日')
})

const selectedDateEvents = computed(() => {
  if (!selectedDate.value) return []
  return props.events
    .filter(e => e.date === selectedDate.value)
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const pa = a.priority ? priorityOrder[a.priority] : 4
      const pb = b.priority ? priorityOrder[b.priority] : 4
      if (pa !== pb) return pa - pb
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime)
      return 0
    })
})

function prevMonth() {
  currentDate.value = currentDate.value.subtract(1, 'month')
}

function nextMonth() {
  currentDate.value = currentDate.value.add(1, 'month')
}

function goToToday() {
  currentDate.value = dayjs()
  selectedDate.value = dayjs().format('YYYY-MM-DD')
}

function selectDate(date: string) {
  selectedDate.value = date
  emit('dateSelect', date)
}

function selectDateTime(date: string, hour: number) {
  selectedDate.value = date
  emit('dateSelect', date)
}

function getEventsForDateTime(date: string, hour: number) {
  const hourStr = String(hour).padStart(2, '0')
  return props.events.filter(e => {
    if (e.date !== date) return false
    if (!e.startTime) return hour === 12
    const eventHour = parseInt(e.startTime.split(':')[0])
    return eventHour === hour
  })
}

function handleEventClick(event: CalendarEvent) {
  emit('eventClick', event)
}

function getEventClass(type: string) {
  const map: Record<string, string> = {
    booking: 'bg-blue-100 text-blue-800',
    patrol: 'bg-green-100 text-green-800',
    complaint: 'bg-red-100 text-red-800',
    equipment_due: 'bg-purple-100 text-purple-800',
    maintenance: 'bg-amber-100 text-amber-800'
  }
  return map[type] || 'bg-gray-100 text-gray-800'
}

function getEventLineClass(type: string) {
  const map: Record<string, string> = {
    booking: 'bg-blue-500',
    patrol: 'bg-green-500',
    complaint: 'bg-red-500',
    equipment_due: 'bg-purple-500',
    maintenance: 'bg-amber-500'
  }
  return map[type] || 'bg-gray-500'
}

function getEventBadgeClass(type: string) {
  const map: Record<string, string> = {
    booking: 'bg-blue-100 text-blue-700',
    patrol: 'bg-green-100 text-green-700',
    complaint: 'bg-red-100 text-red-700',
    equipment_due: 'bg-purple-100 text-purple-700',
    maintenance: 'bg-amber-100 text-amber-700'
  }
  return map[type] || 'bg-gray-100 text-gray-700'
}

function getEventTypeLabel(type: string) {
  const map: Record<string, string> = {
    booking: '球道预约',
    patrol: '巡场任务',
    complaint: '投诉跟进',
    equipment_due: '器材归还',
    maintenance: '设备维护'
  }
  return map[type] || type
}
</script>
