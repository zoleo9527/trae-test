<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: string
  type?: 'borrow' | 'ticket' | 'exception'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'borrow'
})

const statusConfig: Record<string, Record<string, { label: string; class: string }>> = {
  borrow: {
    pending: { label: '待确认', class: 'bg-museum-gray-100 text-museum-gray-600' },
    transferring: { label: '流转中', class: 'bg-museum-gold/20 text-museum-gold' },
    installing: { label: '布展中', class: 'bg-museum-green/20 text-museum-green' },
    completed: { label: '已完成', class: 'bg-museum-green/20 text-museum-green' },
    exception: { label: '异常', class: 'bg-museum-coral/20 text-museum-coral' }
  },
  ticket: {
    pending: { label: '待核销', class: 'bg-museum-gray-100 text-museum-gray-600' },
    verifying: { label: '核销中', class: 'bg-museum-gold/20 text-museum-gold' },
    completed: { label: '已完成', class: 'bg-museum-green/20 text-museum-green' },
    exception: { label: '异常', class: 'bg-museum-coral/20 text-museum-coral' },
    unused: { label: '未使用', class: 'bg-museum-gray-100 text-museum-gray-600' },
    verified: { label: '已核销', class: 'bg-museum-green/20 text-museum-green' },
    expired: { label: '已过期', class: 'bg-museum-gray-100 text-museum-gray-500' }
  },
  exception: {
    pending: { label: '待处理', class: 'bg-museum-coral/20 text-museum-coral' },
    processing: { label: '处理中', class: 'bg-museum-gold/20 text-museum-gold' },
    resolved: { label: '已解决', class: 'bg-museum-green/20 text-museum-green' },
    closed: { label: '已关闭', class: 'bg-museum-gray-100 text-museum-gray-500' }
  }
}

const config = computed(() => statusConfig[props.type]?.[props.status] || {
  label: props.status,
  class: 'bg-museum-gray-100 text-museum-gray-600'
})
</script>

<template>
  <span 
    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
    :class="config.class"
  >
    <span 
      v-if="props.status === 'pending' && props.type === 'exception'"
      class="w-1.5 h-1.5 rounded-full bg-museum-coral mr-1.5 animate-pulse"
    ></span>
    {{ config.label }}
  </span>
</template>
