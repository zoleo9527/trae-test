<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">日历视图</h1>
        <p class="text-gray-500 mt-1">查看排班、打卡、质检和耗材申领的日历概览</p>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">项目筛选:</label>
          <select
            v-model="selectedProject"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">全部项目</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">事件类型:</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="type in eventTypes"
              :key="type.value"
              :class="[
                'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                selectedTypes.includes(type.value)
                  ? `${type.bgClass} ${type.textClass} ${type.borderClass}`
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              ]"
              @click="toggleEventType(type.value)"
            >
              <span class="flex items-center gap-1.5">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="type.dotClass"
                ></span>
                {{ type.label }}
              </span>
            </button>
          </div>
        </div>

        <button
          v-if="hasActiveFilters"
          class="ml-auto px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          @click="clearFilters"
        >
          清除筛选
        </button>
      </div>

      <div class="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-blue-500"></span>
          <span>排班 ({{ eventCounts.schedule }})</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-red-500"></span>
          <span>打卡异常 ({{ eventCounts.punch }})</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-green-500"></span>
          <span>质检 ({{ eventCounts.inspection }})</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-purple-500"></span>
          <span>耗材申领 ({{ eventCounts.requisition }})</span>
        </div>
      </div>

      <CalendarView
        :events="filteredEvents"
        @date-select="handleDateSelect"
        @event-click="handleEventClick"
      />

      <CalendarDetailPanel
        :visible="detailPanelVisible"
        :date="selectedDate || currentDate"
        :events="filteredEvents"
        @close="detailPanelVisible = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CalendarEvent } from '~/types'
import { useDataStore } from '~/stores/data'
import { useFilterStore } from '~/stores/filter'

const dataStore = useDataStore()
const filterStore = useFilterStore()

const selectedProject = ref('')
const selectedTypes = ref<string[]>(['schedule', 'punch', 'inspection', 'requisition'])
const detailPanelVisible = ref(false)

const eventTypes = [
  { value: 'schedule', label: '排班', dotClass: 'bg-blue-500', bgClass: 'bg-blue-50', textClass: 'text-blue-700', borderClass: 'border-blue-300' },
  { value: 'punch', label: '打卡异常', dotClass: 'bg-red-500', bgClass: 'bg-red-50', textClass: 'text-red-700', borderClass: 'border-red-300' },
  { value: 'inspection', label: '质检', dotClass: 'bg-green-500', bgClass: 'bg-green-50', textClass: 'text-green-700', borderClass: 'border-green-300' },
  { value: 'requisition', label: '耗材申领', dotClass: 'bg-purple-500', bgClass: 'bg-purple-50', textClass: 'text-purple-700', borderClass: 'border-purple-300' }
]

const projects = computed(() => dataStore.projects)
const currentDate = computed(() => filterStore.calendar.currentDate)
const selectedDate = computed(() => filterStore.calendar.selectedDate)

const dateRange = computed(() => {
  const viewMode = filterStore.calendar.viewMode
  const current = new Date(filterStore.calendar.currentDate)

  if (viewMode === 'month') {
    const year = current.getFullYear()
    const month = current.getMonth()
    return {
      start: startOfMonth(year, month + 1),
      end: endOfMonth(year, month + 1)
    }
  } else if (viewMode === 'week') {
    const dayOfWeek = current.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(current)
    monday.setDate(current.getDate() + mondayOffset)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return {
      start: formatDate(monday),
      end: formatDate(sunday)
    }
  } else {
    return {
      start: filterStore.calendar.currentDate,
      end: filterStore.calendar.currentDate
    }
  }
})

const allEvents = computed(() => {
  return dataStore.getCalendarEvents(dateRange.value.start, dateRange.value.end)
})

const filteredEvents = computed(() => {
  return allEvents.value.filter(event => {
    if (selectedProject.value && event.projectId !== selectedProject.value) {
      return false
    }
    if (selectedTypes.value.length > 0 && !selectedTypes.value.includes(event.type)) {
      return false
    }
    return true
  })
})

const eventCounts = computed(() => {
  const counts = {
    schedule: 0,
    punch: 0,
    inspection: 0,
    requisition: 0
  }
  filteredEvents.value.forEach(event => {
    if (counts.hasOwnProperty(event.type)) {
      counts[event.type as keyof typeof counts]++
    }
  })
  return counts
})

const hasActiveFilters = computed(() => {
  return selectedProject.value !== '' || selectedTypes.value.length !== 4
})

const toggleEventType = (type: string) => {
  const index = selectedTypes.value.indexOf(type)
  if (index > -1) {
    if (selectedTypes.value.length > 1) {
      selectedTypes.value.splice(index, 1)
    }
  } else {
    selectedTypes.value.push(type)
  }
}

const clearFilters = () => {
  selectedProject.value = ''
  selectedTypes.value = ['schedule', 'punch', 'inspection', 'requisition']
}

const handleDateSelect = (date: string) => {
  detailPanelVisible.value = true
}

const handleEventClick = (event: CalendarEvent) => {
  filterStore.setSelectedDate(event.date)
  detailPanelVisible.value = true
}

watch(selectedDate, (newDate) => {
  if (newDate) {
    detailPanelVisible.value = true
  }
})
</script>
