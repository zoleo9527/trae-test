<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: number | string
  subtitle?: string
  icon?: any
  color?: 'dark' | 'gold' | 'green' | 'coral' | 'orange'
  trend?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: 'dark',
  trend: 0
})

const colorClasses = computed(() => ({
  dark: 'bg-museum-dark text-white',
  gold: 'bg-museum-gold text-museum-dark',
  green: 'bg-museum-green text-white',
  coral: 'bg-museum-coral text-white',
  orange: 'bg-museum-orange text-white'
}[props.color]))

const iconBgClasses = computed(() => ({
  dark: 'bg-white/10',
  gold: 'bg-museum-dark/10',
  green: 'bg-white/10',
  coral: 'bg-white/10',
  orange: 'bg-white/10'
}[props.color]))
</script>

<template>
  <div class="bg-white rounded-xl shadow-museum p-5 hover:shadow-museum-hover transition-shadow duration-300">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-museum-gray-500 mb-1">{{ title }}</p>
        <p class="text-3xl font-bold text-museum-gray-800 font-serif">{{ value }}</p>
        <p v-if="subtitle" class="text-xs text-museum-gray-400 mt-1">{{ subtitle }}</p>
      </div>
      <div 
        v-if="icon"
        class="w-12 h-12 rounded-xl flex items-center justify-center"
        :class="iconBgClasses"
      >
        <component :is="icon" class="w-6 h-6" :class="colorClasses" />
      </div>
    </div>
    <div v-if="trend !== 0" class="mt-4 flex items-center gap-1">
      <span 
        class="text-xs font-medium"
        :class="trend > 0 ? 'text-museum-green' : 'text-museum-coral'"
      >
        {{ trend > 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
      </span>
      <span class="text-xs text-museum-gray-400">较上周</span>
    </div>
  </div>
</template>
