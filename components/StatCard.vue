<template>
  <div class="card p-4">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-gray-500">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ value }}</p>
      </div>
      <div 
        class="w-10 h-10 rounded-lg flex items-center justify-center"
        :class="bgColorClass"
      >
        <Icon :name="icon" class="w-5 h-5" :class="textColorClass" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: number
  icon: string
  color: 'amber' | 'red' | 'blue' | 'green' | 'orange'
}>()

const bgColorClass = computed(() => {
  const classes: Record<string, string> = {
    amber: 'bg-amber-100',
    red: 'bg-red-100',
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    orange: 'bg-orange-100'
  }
  return classes[props.color]
})

const textColorClass = computed(() => {
  const classes: Record<string, string> = {
    amber: 'text-amber-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600'
  }
  return classes[props.color]
})
</script>
