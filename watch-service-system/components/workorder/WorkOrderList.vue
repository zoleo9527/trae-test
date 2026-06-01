<template>
  <div class="h-full flex flex-col bg-white border-r border-gray-200">
    <div class="p-4 border-b border-gray-100">
      <div class="relative">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索工单编号、客户、品牌..."
          class="input pl-10"
          @input="handleSearch"
        />
      </div>
    </div>
    
    <div class="px-4 py-3 border-b border-gray-100 flex items-center space-x-2 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="selectTab(tab.value)"
        :class="[
          'px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
          activeTab === tab.value
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-600 hover:bg-gray-100'
        ]"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          :class="[
            'ml-1.5 px-1.5 py-0.5 text-xs rounded-full',
            activeTab === tab.value ? 'bg-primary-200 text-primary-800' : 'bg-gray-200 text-gray-600'
          ]"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto scrollbar-thin">
      <div
        v-for="order in orders"
        :key="order.id"
        @click="selectOrder(order)"
        :class="[
          'p-4 border-b border-gray-50 cursor-pointer transition-all',
          selectedId === order.id
            ? 'bg-primary-50 border-l-4 border-l-primary-600'
            : 'hover:bg-gray-50 border-l-4 border-l-transparent'
        ]"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-semibold text-gray-900">{{ order.orderNo }}</span>
              <StatusBadge :status="order.status" />
            </div>
            <p class="mt-1 text-sm font-medium text-gray-800">{{ order.watchBrand }} {{ order.watchModel }}</p>
            <p class="mt-0.5 text-xs text-gray-500">{{ order.customer.name }} · {{ formatPhone(order.customer.phone) }}</p>
            <p class="mt-1 text-xs text-gray-600 truncate">{{ order.problemDesc }}</p>
          </div>
          <PriorityBadge v-if="order.priority === 'high' || order.priority === 'urgent'" :priority="order.priority" />
        </div>
        <div class="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>{{ formatDate(order.receivedAt) }}</span>
          <span v-if="order.quote">报价: {{ formatCurrency(order.quote.amount) }}</span>
        </div>
      </div>
      
      <LoadingState v-if="loading" text="加载工单列表..." />
      <ErrorState v-else-if="error" :message="error" @retry="fetchWorkOrders" />
      <EmptyState v-else-if="orders.length === 0" title="没有找到工单" description="试试调整搜索条件或筛选标签" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { WorkOrder, WorkOrderStatus } from '~/types/workorder';
import { formatDate, formatPhone, formatCurrency } from '~/utils/format';
import { STATUS_GROUPS } from '~/utils/constants';

interface Props {
  orders: WorkOrder[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [order: WorkOrder];
  search: [query: string];
  filter: [status: WorkOrderStatus[] | null];
  fetch: [];
}>();

const searchQuery = ref('');
const activeTab = ref<string>('all');

const tabs = computed(() => [
  { value: 'all', label: '全部', count: undefined },
  { value: 'pending', label: '待处理' },
  { value: 'approval', label: '待审批' },
  { value: 'rejected', label: '已驳回' },
  { value: 'completed', label: '已完成' },
]);

function selectOrder(order: WorkOrder) {
  emit('select', order);
}

function handleSearch() {
  emit('search', searchQuery.value);
}

function selectTab(tab: string) {
  activeTab.value = tab;
  
  let statusFilter: WorkOrderStatus[] | null = null;
  
  if (tab !== 'all') {
    const groupStatuses = STATUS_GROUPS[tab];
    if (groupStatuses) {
      statusFilter = groupStatuses;
    }
  }
  
  emit('filter', statusFilter);
}

function fetchWorkOrders() {
  emit('fetch');
}
</script>
