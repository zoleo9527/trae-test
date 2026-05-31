<template>
  <div
    :class="[
      'card p-6 relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]',
      gradientClass
    ]"
    @click="$emit('click')"
  >
    <div class="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
      <Icon :icon="icon" class="w-full h-full text-white" />
    </div>
    
    <div class="relative">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-white/80">{{ title }}</p>
          <p class="mt-2 text-3xl font-bold text-white">{{ value }}</p>
        </div>
        <div :class="['w-12 h-12 rounded-xl flex items-center justify-center', iconBgClass]">
          <Icon :icon="icon" class="w-6 h-6 text-white" />
        </div>
      </div>
      
      <div v-if="subText" class="mt-4 flex items-center text-sm text-white/70">
        <Icon :icon="subIcon" class="w-4 h-4 mr-1" />
        {{ subText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  value: number | string;
  icon: string;
  variant?: 'primary' | 'warning' | 'danger' | 'success' | 'info';
  subText?: string;
  subIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  subIcon: 'mdi:trending-up',
});

defineEmits<{
  click: [];
}>();

const gradientClass = computed(() => {
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-br from-primary-700 to-primary-900',
    warning: 'bg-gradient-to-br from-amber-500 to-orange-600',
    danger: 'bg-gradient-to-br from-red-500 to-red-700',
    success: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    info: 'bg-gradient-to-br from-blue-500 to-blue-700',
  };
  return variants[props.variant] || variants.primary;
});

const iconBgClass = computed(() => {
  const variants: Record<string, string> = {
    primary: 'bg-white/20',
    warning: 'bg-white/20',
    danger: 'bg-white/20',
    success: 'bg-white/20',
    info: 'bg-white/20',
  };
  return variants[props.variant] || variants.primary;
});
</script>
