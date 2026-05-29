<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore, type CalendarEvent } from '@/stores/data'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const router = useRouter()
const store = useDataStore()

const currentDate = ref(new Date())
const selectedDay = ref<number | null>(null)
const typeFilters = ref<Record<string, boolean>>({
  lifting: true,
  maintenance: true,
  disease: true,
  loading: true,
  followup: true,
})

const typeLabels: Record<string, string> = {
  lifting: '起苗任务',
  maintenance: '养护任务',
  disease: '病害上报',
  loading: '装车单',
  followup: '回访',
}

const typeDotColors: Record<string, string> = {
  lifting: 'bg-status-green',
  maintenance: 'bg-blue-500',
  disease: 'bg-danger-600',
  loading: 'bg-accent-600',
  followup: 'bg-purple-500',
}

const activeTypes = computed(() => {
  return Object.entries(typeFilters.value)
    .filter(([, active]) => active)
    .map(([type]) => type)
})

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const monthLabel = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOfWeek = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

const calendarDays = computed(() => {
  const days: (number | null)[] = []
  const offset = firstDayOfWeek.value === 0 ? 6 : firstDayOfWeek.value - 1
  for (let i = 0; i < offset; i++) days.push(null)
  for (let i = 1; i <= daysInMonth.value; i++) days.push(i)
  return days
})

const eventsByDay = computed(() => {
  const map: Record<number, CalendarEvent[]> = {}
  for (const event of store.calendarEvents) {
    if (!activeTypes.value.includes(event.type)) continue
    const d = new Date(event.date)
    if (d.getFullYear() === currentYear.value && d.getMonth() === currentMonth.value) {
      const day = d.getDate()
      if (!map[day]) map[day] = []
      map[day].push(event)
    }
  }
  return map
})

const selectedDayEvents = computed(() => {
  if (selectedDay.value === null) return []
  return eventsByDay.value[selectedDay.value] || []
})

function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

function selectDay(day: number | null) {
  if (day === null) return
  selectedDay.value = selectedDay.value === day ? null : day
}

function navigateEvent(event: CalendarEvent) {
  router.push(event.link)
}

function isToday(day: number) {
  const today = new Date()
  return day === today.getDate() && currentMonth.value === today.getMonth() && currentYear.value === today.getFullYear()
}

function getEventTypes(day: number) {
  const events = eventsByDay.value[day]
  if (!events) return []
  const types = new Set(events.map(e => e.type))
  return Array.from(types)
}

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

async function loadCalendar() {
  const month = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}`
  await store.fetchCalendarEvents(month, activeTypes.value)
}

onMounted(() => {
  loadCalendar()
})

watch([currentYear, currentMonth], () => {
  loadCalendar()
})
</script>

<template>
  <div>
    <h1 class="page-title mb-6">日历视图</h1>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3">
        <div class="card p-4">
          <div class="flex items-center justify-between mb-4">
            <button class="p-1 hover:bg-gray-100 rounded" @click="prevMonth">
              <ChevronLeft class="w-5 h-5 text-text-secondary" />
            </button>
            <h2 class="text-base font-semibold text-text-primary">{{ monthLabel }}</h2>
            <button class="p-1 hover:bg-gray-100 rounded" @click="nextMonth">
              <ChevronRight class="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          <div class="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            <div
              v-for="day in weekDays"
              :key="day"
              class="bg-gray-50 text-center py-2 text-xs font-medium text-text-secondary"
            >
              {{ day }}
            </div>

            <div
              v-for="(day, idx) in calendarDays"
              :key="idx"
              :class="[
                day === null ? 'bg-gray-50/50' : 'bg-surface hover:bg-forest-50/50',
                day === selectedDay ? 'ring-2 ring-forest-500 ring-inset' : '',
                isToday(day!) ? 'bg-forest-50' : '',
              ]"
              class="min-h-[80px] p-1.5 cursor-pointer"
              @click="selectDay(day)"
            >
              <div v-if="day !== null">
                <span
                  :class="[
                    isToday(day) ? 'bg-forest-700 text-white' : 'text-text-primary',
                  ]"
                  class="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full"
                >
                  {{ day }}
                </span>
                <div class="flex flex-wrap gap-0.5 mt-1">
                  <div
                    v-for="type in getEventTypes(day)"
                    :key="type"
                    :class="typeDotColors[type]"
                    class="w-1.5 h-1.5 rounded-full"
                  />
                </div>
                <div class="mt-0.5 space-y-px">
                  <div
                    v-for="event in (eventsByDay[day] || []).slice(0, 2)"
                    :key="event.id"
                    :class="typeDotColors[event.type] + '/15'"
                    class="text-[10px] px-1 py-px rounded truncate"
                  >
                    {{ event.title }}
                  </div>
                  <div
                    v-if="(eventsByDay[day] || []).length > 2"
                    class="text-[10px] text-text-muted px-1"
                  >
                    +{{ (eventsByDay[day] || []).length - 2 }}项
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="card p-4 mb-4">
          <h3 class="section-title">类型筛选</h3>
          <div class="space-y-2">
            <label
              v-for="(label, type) in typeLabels"
              :key="type"
              class="flex items-center gap-2 cursor-pointer text-sm"
            >
              <input
                v-model="typeFilters[type]"
                type="checkbox"
                class="w-4 h-4 rounded border-border text-forest-700 focus:ring-forest-500"
              />
              <span :class="typeDotColors[type]" class="w-2 h-2 rounded-full" />
              <span class="text-text-secondary">{{ label }}</span>
            </label>
          </div>
        </div>

        <div v-if="selectedDay !== null" class="card p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-text-primary">{{ currentMonth + 1 }}月{{ selectedDay }}日</h3>
            <button class="text-text-muted hover:text-text-primary" @click="selectedDay = null">
              <X class="w-4 h-4" />
            </button>
          </div>
          <div v-if="selectedDayEvents.length === 0" class="text-xs text-text-muted py-2 text-center">
            暂无事件
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="event in selectedDayEvents"
              :key="event.id"
              class="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
              @click="navigateEvent(event)"
            >
              <span :class="typeDotColors[event.type]" class="w-2 h-2 rounded-full mt-1.5 shrink-0" />
              <div>
                <div class="text-xs font-medium text-text-primary">{{ event.title }}</div>
                <div class="text-[10px] text-text-muted">{{ typeLabels[event.type] }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
