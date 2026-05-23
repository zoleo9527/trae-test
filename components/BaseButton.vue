<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[baseClass, sizeClass, variantClass, disabledClass, customClass]"
    @click="$emit('click', $event)"
  >
    <component v-if="loading" :is="Loader2" class="w-4 h-4 animate-spin mr-2" />
    <component v-if="icon && !loading" :is="icon" class="w-4 h-4" :class="{ 'mr-2': !iconOnly }" />
    <span v-if="!iconOnly"><slot /></span>
  </button>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import type { Component } from 'vue'

interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: Component
  iconOnly?: boolean
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  iconOnly: false,
  customClass: '',
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses: Record<string, string> = {
  primary: 'bg-gold-500 text-white hover:bg-gold-600 focus:ring-gold-200',
  secondary: 'bg-white text-gold-600 border-2 border-gold-500 hover:bg-gold-50 focus:ring-gold-100',
  danger: 'bg-coral-500 text-white hover:bg-coral-600 focus:ring-coral-200',
  ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-100',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}

const baseClass = computed(() => 
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
)

const sizeClass = computed(() => sizeClasses[props.size])
const variantClass = computed(() => variantClasses[props.variant])
const disabledClass = computed(() => 
  (props.disabled || props.loading) ? 'opacity-50 cursor-not-allowed hover:shadow-none hover:translate-y-0' : ''
)
</script>
