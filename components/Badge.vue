<template>
  <span class="badge" :class="badgeClass">
    {{ statusText[status] }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormat } from '~/composables/useFormat'
import type { RecordStatus } from '~/types'

const props = defineProps<{
  status: RecordStatus
}>()

const { statusText } = useFormat()

const badgeClass = computed(() => {
  const classes: Record<RecordStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-purple-100 text-purple-700',
    abnormal: 'bg-orange-100 text-orange-700'
  }
  return classes[props.status]
})
</script>
