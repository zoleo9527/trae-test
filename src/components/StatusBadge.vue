<script setup lang="ts">
import type { OrderStatus } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import { cn } from '@/lib/utils'

const props = defineProps<{
  status: OrderStatus
}>()
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      ORDER_STATUS_COLORS[props.status]
    )"
  >
    {{ ORDER_STATUS_LABELS[props.status] }}
  </span>
</template>
