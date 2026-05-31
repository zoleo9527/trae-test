<template>
  <div class="bg-white border-b border-gray-200 px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="relative">
          <button
            @click="showStatusFilter = !showStatusFilter"
            class="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Icon icon="mdi:filter-variant" class="w-4 h-4 text-gray-500" />
            <span class="text-sm text-gray-700">状态</span>
            <Icon icon="mdi:chevron-down" class="w-4 h-4 text-gray-400" />
          </button>
          
          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="showStatusFilter"
              class="absolute left-0 top-full mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-100 z-50 py-2"
            >
              <label
                v-for="status in allStatuses"
                :key="status.value"
                class="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="selectedStatuses.includes(status.value)"
                  @change="toggleStatus(status.value)"
                  class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span class="ml-3 text-sm text-gray-700">{{ status.label }}</span>
              </label>
            </div>
          </Transition>
        </div>
        
        <div class="relative">
          <button
            @click="showPriorityFilter = !showPriorityFilter"
            class="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Icon icon="mdi:flag" class="w-4 h-4 text-gray-500" />
            <span class="text-sm text-gray-700">优先级</span>
            <Icon icon="mdi:chevron-down" class="w-4 h-4 text-gray-400" />
          </button>
          
          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="showPriorityFilter"
              class="absolute left-0 top-full mt-2 w-48 rounded-xl bg-white shadow-lg border border-gray-100 z-50 py-2"
            >
              <label
                v-for="priority in allPriorities"
                :key="priority.value"
                class="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="selectedPriorities.includes(priority.value)"
                  @change="togglePriority(priority.value)"
                  class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span class="ml-3 text-sm text-gray-700">{{ priority.label }}</span>
              </label>
            </div>
          </Transition>
        </div>
        
        <div class="h-6 w-px bg-gray-200"></div>
        
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <Icon icon="mdi:close-circle" class="w-4 h-4" />
          <span>清除筛选</span>
        </button>
      </div>
      
      <div class="text-sm text-gray-500">
        共 <span class="font-medium text-gray-900">{{ totalCount }}</span> 条工单
      </div>
    </div>
    
    <div v-if="showStatusFilter || showPriorityFilter" class="fixed inset-0 z-40" @click="closeAllFilters"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { WorkOrderStatus, Priority } from '~/types/workorder';
import { STATUS_LABELS, PRIORITY_LABELS } from '~/utils/constants';

interface Props {
  selectedStatuses: WorkOrderStatus[];
  selectedPriorities: Priority[];
  totalCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:selectedStatuses': [statuses: WorkOrderStatus[]];
  'update:selectedPriorities': [priorities: Priority[]];
  clear: [];
}>();

const showStatusFilter = ref(false);
const showPriorityFilter = ref(false);

const allStatuses = computed(() => 
  Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value: value as WorkOrderStatus,
    label,
  }))
);

const allPriorities = computed(() => 
  Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
    value: value as Priority,
    label,
  }))
);

const hasActiveFilters = computed(() => 
  props.selectedStatuses.length > 0 || props.selectedPriorities.length > 0
);

function toggleStatus(status: WorkOrderStatus) {
  const newStatuses = props.selectedStatuses.includes(status)
    ? props.selectedStatuses.filter(s => s !== status)
    : [...props.selectedStatuses, status];
  emit('update:selectedStatuses', newStatuses);
}

function togglePriority(priority: Priority) {
  const newPriorities = props.selectedPriorities.includes(priority)
    ? props.selectedPriorities.filter(p => p !== priority)
    : [...props.selectedPriorities, priority];
  emit('update:selectedPriorities', newPriorities);
}

function clearFilters() {
  emit('clear');
}

function closeAllFilters() {
  showStatusFilter.value = false;
  showPriorityFilter.value = false;
}
</script>
