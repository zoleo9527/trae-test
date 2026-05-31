<template>
  <div class="h-[calc(100vh-140px)]">
    <div class="mb-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">工单管理</h1>
          <p class="mt-1 text-sm text-gray-500">查看和处理所有售后工单</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="handleRefresh"
            class="btn-secondary btn-sm"
            :disabled="loading"
          >
            <Icon v-if="loading" icon="mdi:loading" class="w-4 h-4 mr-2 animate-spin" />
            <Icon v-else icon="mdi:refresh" class="w-4 h-4 mr-2" />
            刷新
          </button>
        </div>
      </div>
    </div>

    <div class="card h-full overflow-hidden">
      <div class="grid grid-cols-12 h-full">
        <div class="col-span-5 border-r border-gray-200 flex flex-col h-full">
          <WorkOrderFilter
            v-model:selected-statuses="statusFilter"
            v-model:selected-priorities="priorityFilter"
            :total-count="totalCount"
            @clear="clearFilters"
          />
          <WorkOrderList
            :orders="workOrders"
            :selected-id="selectedOrder?.id || null"
            :loading="loading"
            :error="error"
            @select="handleSelectOrder"
            @search="handleSearch"
            @filter="handleTabFilter"
            @fetch="fetchWorkOrders"
            class="flex-1"
          />
        </div>

        <div class="col-span-7 h-full">
          <WorkOrderDetail
            :order="selectedOrder"
          />
        </div>
      </div>
    </div>

    <div
      v-if="actionError"
      class="fixed bottom-6 right-6 max-w-sm bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50"
    >
      <div class="flex items-start space-x-3">
        <Icon icon="mdi:alert-circle" class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm font-medium text-red-800">操作失败</p>
          <p class="text-sm text-red-700 mt-0.5">{{ actionError }}</p>
        </div>
        <button
          @click="clearActionError"
          class="text-red-400 hover:text-red-600"
        >
          <Icon icon="mdi:close" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { WorkOrderStatus } from '~/types/workorder';

const {
  workOrders,
  selectedOrder,
  loading,
  error,
  actionError,
  pagination,
  fetchWorkOrders,
  fetchPartInventory,
  selectOrder,
  setFilter,
  clearFilter,
  clearActionError,
} = useWorkOrder();

const statusFilter = ref<WorkOrderStatus[]>([]);
const priorityFilter = ref<string[]>([]);

const totalCount = computed(() => pagination.value.total);

onMounted(async () => {
  await Promise.all([
    fetchWorkOrders(),
    fetchPartInventory(),
  ]);
});

function handleSelectOrder(order: any) {
  selectOrder(order);
}

function handleSearch(query: string) {
  setFilter({ search: query });
}

function handleTabFilter(statuses: WorkOrderStatus[] | null) {
  setFilter({ status: statuses || [] });
}

function clearFilters() {
  statusFilter.value = [];
  priorityFilter.value = [];
  clearFilter();
}

function handleRefresh() {
  Promise.all([
    fetchWorkOrders(),
    fetchPartInventory(),
  ]);
}

watch([statusFilter, priorityFilter], () => {
  setFilter({
    status: statusFilter.value.length > 0 ? statusFilter.value : undefined,
    priority: priorityFilter.value.length > 0 ? priorityFilter.value as any : undefined,
  });
});
</script>
