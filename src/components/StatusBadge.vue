<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  size?: 'sm' | 'md'
}>()

const sizeClass = computed(() => {
  return props.size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
})

const colorClass = computed(() => {
  const s = props.status
  if (['完成', '已完成', '正常', '在养', '已通过'].includes(s)) {
    return 'bg-green-100 text-status-green'
  }
  if (['待审批', '待处理', '预警', '进行中', '待起苗', '轻度'].includes(s)) {
    return 'bg-amber-100 text-accent-600'
  }
  if (['超时', '紧急', '重度', '已退回', '已取消'].includes(s)) {
    return 'bg-red-100 text-danger-600'
  }
  if (['中度'].includes(s)) {
    return 'bg-orange-100 text-orange-700'
  }
  return 'bg-gray-100 text-status-gray'
})
</script>

<template>
  <span :class="[sizeClass, colorClass]" class="badge">{{ status }}</span>
</template>
