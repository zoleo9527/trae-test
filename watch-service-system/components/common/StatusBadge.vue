<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      colorClasses
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full mr-1.5', dotClass]"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { WorkOrderStatus } from '~/types/workorder';
import { STATUS_LABELS, STATUS_COLORS } from '~/utils/constants';

interface Props {
  status: WorkOrderStatus;
}

const props = defineProps<Props>();

const label = computed(() => STATUS_LABELS[props.status]);
const color = computed(() => STATUS_COLORS[props.status]);

const colorClasses = computed(() => {
  const colors: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    cyan: 'bg-cyan-100 text-cyan-800',
    green: 'bg-green-100 text-green-800',
    gray: 'bg-gray-100 text-gray-800',
  };
  return colors[color.value] || colors.gray;
});

const dotClass = computed(() => {
  const colors: Record<string, string> = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    green: 'bg-green-500',
    gray: 'bg-gray-500',
  };
  return colors[color.value] || colors.gray;
});
</script>
