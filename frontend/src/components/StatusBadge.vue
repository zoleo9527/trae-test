<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  status: string
  type?: 'order' | 'pickup' | 'remake' | 'refund' | 'review' | 'schedule'
}>()

const statusConfig = computed(() => {
  const configs: Record<string, Record<string, { label: string; class: string }>> = {
    order: {
      pending: { label: '待确认', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      confirmed: { label: '已确认', class: 'bg-blue-100 text-blue-800 border-blue-200' },
      scheduled: { label: '已排产', class: 'bg-purple-100 text-purple-800 border-purple-200' },
      producing: { label: '制作中', class: 'bg-bakery-100 text-bakery-700 border-bakery-300' },
      completed: { label: '已完成', class: 'bg-green-100 text-green-800 border-green-200' },
      exception: { label: '异常', class: 'bg-accent-light text-accent border-accent' },
    },
    pickup: {
      waiting: { label: '待取货', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      notified: { label: '已通知', class: 'bg-blue-100 text-blue-800 border-blue-200' },
      verified: { label: '已核销', class: 'bg-green-100 text-green-800 border-green-200' },
      completed: { label: '已完成', class: 'bg-green-100 text-green-800 border-green-200' },
    },
    remake: {
      open: { label: '待处理', class: 'bg-accent-light text-accent border-accent' },
      scheduled: { label: '已排产', class: 'bg-purple-100 text-purple-800 border-purple-200' },
      producing: { label: '重做中', class: 'bg-bakery-100 text-bakery-700 border-bakery-300' },
      completed: { label: '已完成', class: 'bg-green-100 text-green-800 border-green-200' },
      closed: { label: '已关闭', class: 'bg-gray-100 text-gray-600 border-gray-200' },
    },
    refund: {
      requested: { label: '待审核', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      tracing: { label: '追溯中', class: 'bg-blue-100 text-blue-800 border-blue-200' },
      approved: { label: '已批准', class: 'bg-green-100 text-green-800 border-green-200' },
      completed: { label: '已完成', class: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { label: '已拒绝', class: 'bg-gray-100 text-gray-600 border-gray-200' },
    },
    review: {
      pending: { label: '待复核', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      approved: { label: '已通过', class: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { label: '已拒绝', class: 'bg-gray-100 text-gray-600 border-gray-200' },
    },
    schedule: {
      pending: { label: '待生产', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      producing: { label: '生产中', class: 'bg-bakery-100 text-bakery-700 border-bakery-300' },
      completed: { label: '已完成', class: 'bg-green-100 text-green-800 border-green-200' },
    },
  }
  const type = props.type || 'order'
  return configs[type]?.[props.status] || { label: props.status, class: 'bg-gray-100 text-gray-600 border-gray-200' }
})
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
    :class="cn(statusConfig.class)"
  >
    {{ statusConfig.label }}
  </span>
</template>
