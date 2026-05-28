<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus, ExceptionStatus, ExceptionSeverity } from '@/types'

const props = defineProps<{
  type: 'order' | 'exception' | 'severity'
  status: OrderStatus | ExceptionStatus | ExceptionSeverity
}>()

const orderStatusConfig: Record<OrderStatus, { label: string; class: string }> = {
  draft: { label: '草稿', class: 'bg-gray-100 text-gray-600' },
  quoting: { label: '报价中', class: 'bg-blue-100 text-blue-600' },
  sampling: { label: '打样中', class: 'bg-amber-100 text-amber-600' },
  sample_confirmed: { label: '样品确认', class: 'bg-green-100 text-green-600' },
  version_locked: { label: '版本锁定', class: 'bg-emerald-100 text-emerald-600' },
  scheduled: { label: '已排期', class: 'bg-cyan-100 text-cyan-600' },
  producing: { label: '生产中', class: 'bg-orange-100 text-orange-600' },
  qc_passed: { label: '质检通过', class: 'bg-green-100 text-green-600' },
  shipping: { label: '发货中', class: 'bg-blue-100 text-blue-600' },
  completed: { label: '已完成', class: 'bg-gray-100 text-gray-600' }
}

const exceptionStatusConfig: Record<ExceptionStatus, { label: string; class: string }> = {
  pending: { label: '待处理', class: 'bg-red-100 text-red-600' },
  processing: { label: '处理中', class: 'bg-amber-100 text-amber-600' },
  resolved: { label: '已解决', class: 'bg-green-100 text-green-600' }
}

const severityConfig: Record<ExceptionSeverity, { label: string; class: string }> = {
  critical: { label: '紧急', class: 'bg-red-500 text-white' },
  warning: { label: '警告', class: 'bg-amber-500 text-white' }
}

const config = computed(() => {
  if (props.type === 'order') {
    return orderStatusConfig[props.status as OrderStatus]
  } else if (props.type === 'exception') {
    return exceptionStatusConfig[props.status as ExceptionStatus]
  } else {
    return severityConfig[props.status as ExceptionSeverity]
  }
})
</script>

<template>
  <span class="badge" :class="config.class">
    {{ config.label }}
  </span>
</template>
