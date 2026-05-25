<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  priority: 'urgent' | 'high' | 'medium' | 'low'
}

const props = defineProps<Props>()

const priorityConfig = {
  urgent: { label: '紧急', class: 'bg-museum-coral text-white' },
  high: { label: '高', class: 'bg-museum-orange text-white' },
  medium: { label: '中', class: 'bg-museum-gold text-museum-dark' },
  low: { label: '低', class: 'bg-museum-gray-300 text-museum-gray-700' }
}

const config = computed(() => priorityConfig[props.priority])
</script>

<template>
  <span 
    class="inline-flex items-center px-2 py-1 rounded text-xs font-semibold"
    :class="config.class"
  >
    <span 
      v-if="props.priority === 'urgent'"
      class="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"
    ></span>
    {{ config.label }}
  </span>
</template>
