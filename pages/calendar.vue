<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">日历视图</h1>
        <p class="text-sm text-gray-500 mt-1">按日期查看补货、损耗、活动和展览</p>
      </div>
      <button
        @click="goToToday"
        class="btn btn-secondary text-sm"
      >
        回到今天
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="card p-4">
          <div class="flex items-center justify-between mb-4">
            <button
              @click="goToPreviousMonth"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="lucide:chevron-left" class="w-5 h-5 text-gray-600" />
            </button>
            <h2 class="text-lg font-semibold text-gray-900">
              {{ currentYear }}年 {{ monthNames[currentMonth] }}
            </h2>
            <button
              @click="goToNextMonth"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="lucide:chevron-right" class="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
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
              v-for="(day, index) in calendarDays"
              :key="index"
              @click="day.isCurrentMonth && selectDate(day.date)"
              class="min-h-24 p-1 rounded-lg border transition-all cursor-pointer"
              :class="getDayClasses(day)"
            >
              <span 
                class="text-sm font-medium"
                :class="getDayNumberClasses(day)"
              >
                {{ day.date?.getDate() }}
              </span>
              <div class="mt-1 space-y-0.5">
                <div
                  v-for="event in getEventsForDate(day.date)"
                  :key="event.id"
                  @click.stop="handleEventClick(event)"
                  class="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                  :class="getEventClass(event.type)"
                >
                  {{ event.title }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-y-4">
        <div class="card p-4">
          <h3 class="font-semibold text-gray-900 mb-3">
            {{ selectedDate ? formatDate(selectedDate) + ' 事件' : '今日事件' }}
          </h3>
          <div class="space-y-3">
            <div
              v-for="event in selectedDateEvents"
              :key="event.id"
              @click="handleEventClick(event)"
              class="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div class="flex items-start gap-2">
                <span class="w-2 h-2 rounded-full mt-1.5" :class="getEventDotClass(event.type)"></span>
                <div class="flex-1">
                  <p class="font-medium text-gray-900 text-sm">{{ event.title }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ event.description }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <Badge :status="event.status" />
                    <span class="text-xs text-gray-400">{{ calendarEventTypeText[event.type] }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="selectedDateEvents.length === 0" class="text-center py-8">
              <Icon name="lucide:calendar-x" class="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p class="text-sm text-gray-500">当天无事件</p>
            </div>
          </div>
        </div>
        
        <div class="card p-4">
          <h3 class="font-semibold text-gray-900 mb-3">图例</h3>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-blue-500"></span>
              <span class="text-gray-600">补货</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-orange-500"></span>
              <span class="text-gray-600">损耗</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-purple-500"></span>
              <span class="text-gray-600">活动</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-green-500"></span>
              <span class="text-gray-600">展览</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-red-500"></span>
              <span class="text-gray-600">客流高峰</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMuseumStore } from '~/stores/museum'
import { useCalendar } from '~/composables/useCalendar'
import { useFormat } from '~/composables/useFormat'
import type { CalendarEvent } from '~/types'

const store = useMuseumStore()
const { 
  currentYear, 
  currentMonth, 
  monthNames, 
  weekDays, 
  calendarDays, 
  goToPreviousMonth, 
  goToNextMonth, 
  goToToday,
  formatDateKey 
} = useCalendar(new Date(2024, 4, 1))

const { formatDate, calendarEventTypeText } = useFormat()

const selectedDate = ref<Date | null>(null)

const getDayClasses = (day: { date: Date | null; isCurrentMonth: boolean; isToday: boolean }) => {
  if (!day.isCurrentMonth) return 'bg-gray-50 border-transparent'
  const classes = ['border-gray-100 hover:border-museum-300']
  if (day.isToday) classes.push('bg-museum-50 border-museum-200')
  if (selectedDate.value && day.date && selectedDate.value.toDateString() === day.date.toDateString()) {
    classes.push('ring-2 ring-museum-500')
  }
  return classes.join(' ')
}

const getDayNumberClasses = (day: { date: Date | null; isCurrentMonth: boolean; isToday: boolean }) => {
  if (!day.isCurrentMonth) return 'text-gray-300'
  if (day.isToday) return 'text-museum-600 font-bold'
  return 'text-gray-700'
}

const getEventsForDate = (date: Date | null): CalendarEvent[] => {
  if (!date) return []
  const dateKey = formatDateKey(date)
  return store.eventsByDate[dateKey] || []
}

const getEventClass = (type: string): string => {
  const classes: Record<string, string> = {
    restock: 'bg-blue-100 text-blue-700',
    loss: 'bg-orange-100 text-orange-700',
    exhibition: 'bg-green-100 text-green-700',
    event: 'bg-purple-100 text-purple-700',
    ticket_peak: 'bg-red-100 text-red-700'
  }
  return classes[type] || 'bg-gray-100 text-gray-700'
}

const getEventDotClass = (type: string): string => {
  const classes: Record<string, string> = {
    restock: 'bg-blue-500',
    loss: 'bg-orange-500',
    exhibition: 'bg-green-500',
    event: 'bg-purple-500',
    ticket_peak: 'bg-red-500'
  }
  return classes[type] || 'bg-gray-500'
}

const selectedDateEvents = computed(() => {
  const date = selectedDate.value || new Date()
  const dateKey = formatDateKey(date)
  return store.eventsByDate[dateKey] || []
})

const selectDate = (date: Date | null) => {
  if (!date) return
  selectedDate.value = date
  store.setSelectedDate(formatDateKey(date))
}

const handleEventClick = (event: CalendarEvent) => {
  if (event.relatedRecordId) {
    store.setSelectedRecord(event.relatedRecordId)
    navigateTo('/')
  }
}
</script>
