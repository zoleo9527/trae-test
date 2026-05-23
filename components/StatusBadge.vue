<template>
  <span :class="[baseClass, customClass]">
    <component v-if="icon" :is="icon" class="w-3 h-3 mr-1" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
interface Props {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold'
  customClass?: string
  icon?: any
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  customClass: '',
})

const variantClasses: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-forest-100 text-forest-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-coral-100 text-coral-700',
  info: 'bg-blue-100 text-blue-700',
  gold: 'bg-gold-100 text-gold-700',
}

const baseClass = computed(() => 
  `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variantClasses[props.variant || 'default']}`
)
</script>
