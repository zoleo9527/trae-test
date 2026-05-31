<template>
  <div
    :class="[
      'p-2 rounded border-l-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]',
      event.color,
      compact ? 'text-xs' : 'text-sm'
    ]"
    @click="handleClick"
  >
    <div class="flex items-center justify-between gap-1">
      <span class="font-medium truncate" :class="compact ? 'text-xs' : 'text-sm'">
        {{ typeLabel }}
      </span>
      <span
        v-if="!compact"
        :class="[
          'px-1.5 py-0.5 rounded text-xs font-medium',
          statusClass
        ]"
      >
        {{ statusLabel }}
      </span>
    </div>
    <div v-if="!compact" class="mt-1 text-gray-700 truncate">
      {{ event.title }}
    </div>
    <div v-if="!compact && event.description" class="mt-0.5 text-xs text-gray-500 truncate">
      {{ event.description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '~/types'

interface Props {
  event: CalendarEvent
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const emit = defineEmits<{
  (e: 'click', event: CalendarEvent): void
}>()

const typeLabel = computed(() => {
  const labels: Record<string, string> = {
    schedule: '排班',
    punch: '打卡异常',
    inspection: '质检',
    requisition: '耗材申领'
  }
  return labels[props.event.type] || props.event.type
})

const statusLabel = computed(() => {
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
  return statusMap[props.event.type]?.[props.event.status] || props.event.status
})

const statusClass = computed(() => {
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
  return colorMap[props.event.status] || 'bg-gray-100 text-gray-700'
})

const handleClick = () => {
  emit('click', props.event)
}
</script>
