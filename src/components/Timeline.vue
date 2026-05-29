<script setup lang="ts">
export interface TimelineItem {
  title: string
  subtitle?: string
  detail?: string
  timestamp?: string
  color?: 'green' | 'amber' | 'red' | 'blue' | 'gray'
}

const props = defineProps<{
  items: TimelineItem[]
}>()

const dotColor = (color?: string) => {
  const map: Record<string, string> = {
    green: 'bg-status-green',
    amber: 'bg-accent-600',
    red: 'bg-danger-600',
    blue: 'bg-blue-500',
    gray: 'bg-status-gray',
  }
  return map[color || 'gray'] || map.gray
}
</script>

<template>
  <div class="relative">
    <div
      v-for="(item, idx) in items"
      :key="idx"
      class="flex gap-3 pb-4 last:pb-0"
    >
      <div class="flex flex-col items-center">
        <div :class="dotColor(item.color)" class="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" />
        <div v-if="idx < items.length - 1" class="w-px flex-1 bg-border mt-1" />
      </div>
      <div class="flex-1 min-w-0 pb-1">
        <div class="text-sm font-medium text-text-primary">{{ item.title }}</div>
        <div v-if="item.subtitle" class="text-xs text-text-secondary mt-0.5">{{ item.subtitle }}</div>
        <div v-if="item.detail" class="text-xs text-text-muted mt-0.5">{{ item.detail }}</div>
        <div v-if="item.timestamp" class="text-xs text-text-muted mt-0.5">{{ item.timestamp }}</div>
      </div>
    </div>
  </div>
</template>
