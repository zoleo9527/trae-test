<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-white transition-colors"
          :class="{ 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700': viewMode === 'month' }"
          @click="setViewMode('month')"
        >
          月
        </button>
        <button
          class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-white transition-colors"
          :class="{ 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700': viewMode === 'week' }"
          @click="setViewMode('week')"
        >
          周
        </button>
        <button
          class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-white transition-colors"
          :class="{ 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700': viewMode === 'day' }"
          @click="setViewMode('day')"
        >
          日
        </button>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1">
          <button
            class="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            @click="navigatePrev"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="text-base font-semibold text-gray-900 min-w-[140px] text-center">
            {{ currentPeriodLabel }}
          </span>
          <button
            class="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            @click="navigateNext"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          class="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          @click="goToToday"
        >
          今天
        </button>
      </div>
    </div>

    <div v-if="viewMode === 'month'" class="p-4">
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-center text-sm font-medium text-gray-500 py-2"
        >
          {{ day }}
        </div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div
          v-for="(day, index) in monthDays"
          :key="index"
          :class="[
            'min-h-[100px] p-1 rounded-lg border transition-all cursor-pointer',
            day.isCurrentMonth ? 'bg-white border-gray-200 hover:border-primary-400' : 'bg-gray-50 border-gray-100',
            day.isToday ? 'ring-2 ring-primary-500 ring-offset-1' : '',
            day.isSelected ? 'bg-primary-50 border-primary-400' : ''
          ]"
          @click="selectDate(day.date)"
        >
          <div
            :class="[
              'text-sm font-medium mb-1',
              day.isToday ? 'text-primary-600' : '',
              !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'
            ]"
          >
            {{ day.day }}
          </div>
          <div class="space-y-1">
            <CalendarEventItem
              v-for="event in getEventsForDate(day.date).slice(0, 2)"
              :key="event.id"
              :event="event"
              :compact="true"
              @click.stop="handleEventClick(event)"
            />
            <div
              v-if="getEventsForDate(day.date).length > 2"
              class="text-xs text-gray-500 text-center"
            >
              +{{ getEventsForDate(day.date).length - 2 }} 更多
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="viewMode === 'week'" class="p-4">
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-center text-sm font-medium text-gray-500 py-2"
        >
          {{ day }}
        </div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div
          v-for="(day, index) in weekDaysData"
          :key="index"
          :class="[
            'min-h-[120px] p-2 rounded-lg border transition-all cursor-pointer',
            'bg-white border-gray-200 hover:border-primary-400',
            day.isToday ? 'ring-2 ring-primary-500 ring-offset-1' : '',
            day.isSelected ? 'bg-primary-50 border-primary-400' : ''
          ]"
          @click="selectDate(day.date)"
        >
          <div class="text-center mb-2">
            <div
              :class="[
                'text-lg font-bold',
                day.isToday ? 'text-primary-600' : 'text-gray-700'
              ]"
            >
              {{ day.day }}
            </div>
            <div class="text-xs text-gray-500">{{ day.month }}月</div>
          </div>
          <div class="space-y-1.5">
            <CalendarEventItem
              v-for="event in getEventsForDate(day.date)"
              :key="event.id"
              :event="event"
              @click.stop="handleEventClick(event)"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="viewMode === 'day'" class="p-4">
      <div class="mb-4">
        <h3 class="text-xl font-bold text-gray-900">
          {{ formatDate(currentDate, 'YYYY年MM月DD日') }}
          <span class="text-sm font-normal text-gray-500 ml-2">
            {{ weekDayLabel }}
          </span>
        </h3>
      </div>

      <div class="space-y-3">
        <div v-if="dayEvents.length === 0" class="text-center py-16">
          <svg class="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-gray-500 text-lg">当日暂无事件</p>
        </div>

        <div v-for="(group, type) in groupedDayEvents" :key="type" class="space-y-2">
          <h4 class="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full"
              :class="typeColor(type as string)"
            ></span>
            {{ typeLabel(type as string) }}
            <span class="text-gray-400 text-xs">({{ group.length }})</span>
          </h4>
          <div class="space-y-2">
            <CalendarEventItem
              v-for="event in group"
              :key="event.id"
              :event="event"
              @click="handleEventClick(event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '~/types'
import { useFilterStore } from '~/stores/filter'

interface Props {
  events: CalendarEvent[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'dateSelect', date: string): void
  (e: 'eventClick', event: CalendarEvent): void
}>()

const filterStore = useFilterStore()

const viewMode = computed(() => filterStore.calendar.viewMode)
const currentDate = computed(() => filterStore.calendar.currentDate)
const selectedDate = computed(() => filterStore.calendar.selectedDate)

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const currentPeriodLabel = computed(() => {
  const date = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  } else if (viewMode.value === 'week') {
    const weekData = weekDaysData.value
    if (weekData.length > 0) {
      const start = weekData[0]
      const end = weekData[6]
      if (start.month === end.month) {
        return `${start.month}月${start.day}日 - ${end.day}日`
      } else {
        return `${start.month}月${start.day}日 - ${end.month}月${end.day}日`
      }
    }
  } else {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }
  return ''
})

const weekDayLabel = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const dayIndex = new Date(currentDate.value).getDay()
  return days[dayIndex]
})

interface CalendarDay {
  date: string
  day: number
  month: number
  year: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

const monthDays = computed((): CalendarDay[] => {
  const date = new Date(currentDate.value)
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = getFirstDayOfMonth(year, month + 1)
  const daysInMonth = getDaysInMonth(year, month + 1)

  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1

  const days: CalendarDay[] = []

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth + 1)

  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i
    days.push({
      date: formatDate(new Date(prevYear, prevMonth, dayNum)),
      day: dayNum,
      month: prevMonth + 1,
      year: prevYear,
      isCurrentMonth: false,
      isToday: isToday(new Date(prevYear, prevMonth, dayNum)),
      isSelected: selectedDate.value === formatDate(new Date(prevYear, prevMonth, dayNum))
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: formatDate(new Date(year, month, i)),
      day: i,
      month: month + 1,
      year,
      isCurrentMonth: true,
      isToday: isToday(new Date(year, month, i)),
      isSelected: selectedDate.value === formatDate(new Date(year, month, i))
    })
  }

  const remainingDays = 42 - days.length
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: formatDate(new Date(nextYear, nextMonth, i)),
      day: i,
      month: nextMonth + 1,
      year: nextYear,
      isCurrentMonth: false,
      isToday: isToday(new Date(nextYear, nextMonth, i)),
      isSelected: selectedDate.value === formatDate(new Date(nextYear, nextMonth, i))
    })
  }

  return days
})

const weekDaysData = computed((): CalendarDay[] => {
  const date = new Date(currentDate.value)
  const dayOfWeek = date.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const days: CalendarDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(date)
    d.setDate(date.getDate() + mondayOffset + i)
    days.push({
      date: formatDate(d),
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      isCurrentMonth: true,
      isToday: isToday(d),
      isSelected: selectedDate.value === formatDate(d)
    })
  }
  return days
})

const dayEvents = computed(() => {
  return props.events.filter(e => e.date === currentDate.value)
})

const groupedDayEvents = computed(() => {
  const groups: Record<string, CalendarEvent[]> = {}
  dayEvents.value.forEach(event => {
    if (!groups[event.type]) {
      groups[event.type] = []
    }
    groups[event.type].push(event)
  })
  return groups
})

const getEventsForDate = (date: string) => {
  return props.events.filter(e => e.date === date)
}

const typeLabel = (type: string) => {
  const labels: Record<string, string> = {
    schedule: '排班',
    punch: '打卡异常',
    inspection: '质检',
    requisition: '耗材申领'
  }
  return labels[type] || type
}

const typeColor = (type: string) => {
  const colors: Record<string, string> = {
    schedule: 'bg-blue-500',
    punch: 'bg-red-500',
    inspection: 'bg-green-500',
    requisition: 'bg-purple-500'
  }
  return colors[type] || 'bg-gray-500'
}

const setViewMode = (mode: 'month' | 'week' | 'day') => {
  filterStore.setCalendarViewMode(mode)
}

const navigatePrev = () => {
  filterStore.navigateCalendar('prev')
}

const navigateNext = () => {
  filterStore.navigateCalendar('next')
}

const goToToday = () => {
  filterStore.goToToday()
}

const selectDate = (date: string) => {
  filterStore.setSelectedDate(date)
  emit('dateSelect', date)
}

const handleEventClick = (event: CalendarEvent) => {
  emit('eventClick', event)
}
</script>
