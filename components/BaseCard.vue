<template>
  <div :class="[baseClass, hoverableClass, customClass]">
    <div v-if="$slots.header" class="px-6 py-4 border-b border-gold-100">
      <slot name="header" />
    </div>
    <div :class="contentClass">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gold-100 bg-gold-50/50 rounded-b-xl">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  hoverable?: boolean
  gold?: boolean
  customClass?: string
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: false,
  gold: false,
  customClass: '',
  contentClass: 'p-6',
})

const baseClass = computed(() => 
  `rounded-xl border ${props.gold ? 'bg-gradient-to-br from-gold-50 to-white border-gold-200 shadow-gold' : 'bg-white border-gold-100 shadow-card'}`
)

const hoverableClass = computed(() => 
  props.hoverable ? 'hover:shadow-hover transition-all duration-300 cursor-pointer' : ''
)
</script>
