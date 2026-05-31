<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      colorClasses
    ]"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Priority } from '~/types/workorder';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '~/utils/constants';

interface Props {
  priority: Priority;
}

const props = defineProps<Props>();

const label = computed(() => PRIORITY_LABELS[props.priority]);
const color = computed(() => PRIORITY_COLORS[props.priority]);

const colorClasses = computed(() => {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
  };
  return colors[color.value] || colors.gray;
});
</script>
