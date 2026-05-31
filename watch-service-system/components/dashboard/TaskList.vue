<template>
  <div class="card">
    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <span class="text-sm text-gray-500">共 {{ orders.length }} 条</span>
    </div>

    <div class="divide-y divide-gray-50 max-h-96 overflow-y-auto scrollbar-thin">
      <div
        v-for="order in orders"
        :key="order.id"
        class="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
        @click="$emit('select', order)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 flex-wrap gap-y-1">
              <span class="text-sm font-medium text-primary-700">{{ order.orderNo }}</span>
              <StatusBadge :status="order.status" />
              <span
                v-if="showRoleBadge"
                :class="[
                  'px-2 py-0.5 rounded text-xs font-medium',
                  getRoleBadgeClass(getTaskRole(order))
                ]"
              >
                {{ getRoleLabel(getTaskRole(order)) }}
              </span>
            </div>
            <p class="mt-1 text-sm text-gray-900">{{ order.watchBrand }} {{ order.watchModel }}</p>
            <p class="mt-0.5 text-xs text-gray-500 truncate">{{ order.customer.name }} · {{ order.problemDesc }}</p>
          </div>
          <div class="ml-4 flex-shrink-0 text-right">
            <p class="text-xs text-gray-500">{{ formatRelativeTime(order.createdAt) }}</p>
            <PriorityBadge v-if="order.priority === 'high' || order.priority === 'urgent'" :priority="order.priority" class="mt-1" />
          </div>
        </div>
      </div>

      <EmptyState v-if="orders.length === 0" :title="emptyTitle" :description="emptyDesc" class="py-8" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkOrder, UserRole } from '~/types/workorder';
import { formatRelativeTime } from '~/utils/format';
import { ROLE_LABELS } from '~/utils/constants';

interface Props {
  title: string;
  orders: WorkOrder[];
  emptyTitle?: string;
  emptyDesc?: string;
  showRoleBadge?: boolean;
}

withDefaults(defineProps<Props>(), {
  emptyTitle: '暂无任务',
  emptyDesc: '当前没有需要处理的任务',
  showRoleBadge: false,
});

defineEmits<{
  select: [order: WorkOrder];
}>();

function getTaskRole(order: WorkOrder): UserRole {
  switch (order.status) {
    case 'pending_review':
    case 'pending_confirm':
    case 'completed':
      return 'consultant';
    case 'pending_approval':
    case 'picked_up':
      return 'manager';
    case 'quoting':
    case 'repairing':
      return 'technician';
    default:
      return 'technician';
  }
}

function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

function getRoleBadgeClass(role: UserRole): string {
  const classes: Record<UserRole, string> = {
    manager: 'bg-purple-100 text-purple-700',
    consultant: 'bg-blue-100 text-blue-700',
    technician: 'bg-amber-100 text-amber-700',
  };
  return classes[role];
}
</script>
