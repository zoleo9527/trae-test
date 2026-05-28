<script setup lang="ts">
import type { OperationLog } from '@/types'

defineProps<{
  logs: OperationLog[]
}>()

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const roleColor = (role: string) => {
  const colors: Record<string, string> = {
    business: 'bg-blue-500',
    sampling: 'bg-amber-500',
    warehouse: 'bg-emerald-500'
  }
  return colors[role] || 'bg-gray-500'
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="log in logs" :key="log.id" class="flex gap-4">
      <div class="flex flex-col items-center">
        <div :class="['w-3 h-3 rounded-full', roleColor(log.operatorRole)]"></div>
        <div class="w-px h-full bg-gray-200 mt-1"></div>
      </div>
      <div class="flex-1 pb-4">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-medium text-gray-800 text-sm">{{ log.operator }}</span>
          <span class="text-xs text-gray-500">{{ formatTime(log.timestamp) }}</span>
        </div>
        <p class="text-sm text-gray-600">
          <span class="font-medium">{{ log.action }}</span>
          <span class="ml-1">- {{ log.detail }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
