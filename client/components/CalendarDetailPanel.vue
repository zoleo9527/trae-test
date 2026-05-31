<template>
  <div
    v-if="visible"
    class="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300"
    :class="visible ? 'translate-x-0' : 'translate-x-full'"
  >
    <div class="h-full flex flex-col">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ formatDate(date, 'YYYY年MM月DD日') }}
          </h3>
          <p class="text-sm text-gray-500 mt-0.5">
            {{ relativeTime(date) }} · {{ weekDayLabel }}
          </p>
        </div>
        <button
          class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          @click="handleClose"
        >
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-if="filteredEvents.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-gray-500">当日暂无事件</p>
        </div>

        <div v-for="(group, type) in groupedEvents" :key="type" class="space-y-2">
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
              @click="handleEventClick"
            />
          </div>
        </div>
      </div>

      <div
        v-if="selectedEvent"
        class="border-t border-gray-200 p-4 bg-gray-50"
      >
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-medium text-gray-900">事件详情</h4>
          <button
            class="text-sm text-primary-600 hover:text-primary-700"
            @click="selectedEvent = null"
          >
            收起
          </button>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-16">类型:</span>
            <span class="font-medium">{{ typeLabel(selectedEvent.type) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-16">标题:</span>
            <span class="text-gray-900">{{ selectedEvent.title }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-16">描述:</span>
            <span class="text-gray-700">{{ selectedEvent.description }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-16">状态:</span>
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :class="statusColor(selectedEvent.status)"
            >
              {{ statusLabel(selectedEvent.type, selectedEvent.status) }}
            </span>
          </div>
          <div class="flex items-center gap-2" v-if="projectName">
            <span class="text-gray-500 w-16">项目:</span>
            <span class="text-gray-700">{{ projectName }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="visible"
    class="fixed inset-0 bg-black/30 z-40"
    @click="handleClose"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CalendarEvent } from '~/types'
import { useDataStore } from '~/stores/data'

interface Props {
  visible: boolean
  date: string
  events: CalendarEvent[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const dataStore = useDataStore()
const selectedEvent = ref<CalendarEvent | null>(null)

const weekDayLabel = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const dayIndex = new Date(props.date).getDay()
  return days[dayIndex]
})

const filteredEvents = computed(() => {
  return props.events.filter(e => e.date === props.date)
})

const groupedEvents = computed(() => {
  const groups: Record<string, CalendarEvent[]> = {}
  filteredEvents.value.forEach(event => {
    if (!groups[event.type]) {
      groups[event.type] = []
    }
    groups[event.type].push(event)
  })
  return groups
})

const projectName = computed(() => {
  if (!selectedEvent.value) return null
  const project = dataStore.getProjectById(selectedEvent.value.projectId)
  return project?.name
})

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

const statusLabel = (type: string, status: string) => {
  const statusMap: Record<string, Record<string, string>> = {
    schedule: {
      scheduled: '待执行',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    },
    punch: {
      absent: '缺勤',
      late: '迟到',
      early_leave: '早退'
    },
    inspection: {
      excellent: '优秀',
      good: '良好',
      pass: '合格',
      fail: '不合格'
    },
    requisition: {
      draft: '草稿',
      pending: '待审核',
      approved: '已批准',
      rejected: '已拒绝',
      delivered: '已发货',
      completed: '已完成'
    }
  }
  return statusMap[type]?.[status] || status
}

const statusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-gray-200 text-gray-600',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-yellow-100 text-yellow-700',
    early_leave: 'bg-yellow-100 text-yellow-700',
    excellent: 'bg-green-100 text-green-700',
    good: 'bg-green-100 text-green-700',
    pass: 'bg-yellow-100 text-yellow-700',
    fail: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    delivered: 'bg-blue-100 text-blue-700',
    draft: 'bg-gray-100 text-gray-700'
  }
  return colorMap[status] || 'bg-gray-100 text-gray-700'
}

const handleClose = () => {
  selectedEvent.value = null
  emit('close')
}

const handleEventClick = (event: CalendarEvent) => {
  selectedEvent.value = event
}
</script>
