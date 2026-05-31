<template>
  <div class="space-y-6">
    <div
      v-for="(entry, index) in sortedEntries"
      :key="entry.id"
      class="relative pl-8"
    >
      <div
        v-if="index < sortedEntries.length - 1"
        class="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200"
      ></div>
      
      <div :class="[
        'absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white',
        bgColorClass(entry.operatorRole)
      ]">
        <Icon :icon="iconForRole(entry.operatorRole)" class="w-3 h-3 text-white" />
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium text-gray-900">{{ entry.action }}</p>
            <div class="mt-1 flex items-center space-x-2">
              <span class="text-sm text-gray-600">{{ entry.operator }}</span>
              <span :class="[
                'px-2 py-0.5 rounded text-xs font-medium',
                badgeColorClass(entry.operatorRole)
              ]">
                {{ roleLabel(entry.operatorRole) }}
              </span>
            </div>
          </div>
          <span class="text-xs text-gray-400">{{ formatDateTime(entry.createdAt) }}</span>
        </div>
        <p v-if="entry.remark" class="mt-2 text-sm text-gray-600 bg-white rounded px-3 py-2">
          {{ entry.remark }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TimelineEntry, UserRole } from '~/types/workorder';
import { formatDateTime } from '~/utils/format';
import { ROLE_LABELS } from '~/utils/constants';

interface Props {
  entries: TimelineEntry[];
}

const props = defineProps<Props>();

const sortedEntries = computed(() => {
  return [...props.entries].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

function iconForRole(role: UserRole): string {
  const icons: Record<UserRole, string> = {
    manager: 'mdi:account-tie',
    consultant: 'mdi:account-headset',
    technician: 'mdi:hammer-wrench',
  };
  return icons[role];
}

function bgColorClass(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    manager: 'bg-purple-500',
    consultant: 'bg-blue-500',
    technician: 'bg-amber-500',
  };
  return colors[role];
}

function badgeColorClass(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    manager: 'bg-purple-100 text-purple-700',
    consultant: 'bg-blue-100 text-blue-700',
    technician: 'bg-amber-100 text-amber-700',
  };
  return colors[role];
}

function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}
</script>
