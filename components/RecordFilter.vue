<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-64">
        <div class="relative">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchInput"
            @input="handleSearch"
            type="text"
            placeholder="搜索商品名称、SKU、备注..."
            class="input pl-10"
          />
        </div>
      </div>
      
      <select
        v-model="statusFilter"
        @change="handleStatusChange"
        class="input w-32"
      >
        <option value="all">全部状态</option>
        <option value="pending">待审批</option>
        <option value="approved">已批准</option>
        <option value="processing">处理中</option>
        <option value="completed">已完成</option>
        <option value="abnormal">异常</option>
        <option value="rejected">已驳回</option>
      </select>
      
      <select
        v-model="typeFilter"
        @change="handleTypeChange"
        class="input w-24"
      >
        <option value="all">全部类型</option>
        <option value="restock">补货</option>
        <option value="loss">损耗</option>
      </select>
      
      <select
        v-model="priorityFilter"
        @change="handlePriorityChange"
        class="input w-24"
      >
        <option value="all">全部优先级</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>

      <select
        v-model="locationFilter"
        @change="handleLocationChange"
        class="input w-32"
      >
        <option value="">全部位置</option>
        <option value="主馆文创区">主馆文创区</option>
        <option value="分馆文创角">分馆文创角</option>
        <option value="特展文创区">特展文创区</option>
        <option value="活动现场">活动现场</option>
        <option value="教育活动区">教育活动区</option>
      </select>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">日期范围：</span>
        <input
          v-model="dateStart"
          @change="handleDateRangeChange"
          type="date"
          class="input w-36 text-sm"
        />
        <span class="text-gray-400">至</span>
        <input
          v-model="dateEnd"
          @change="handleDateRangeChange"
          type="date"
          class="input w-36 text-sm"
        />
        <button
          v-if="hasDateFilter"
          @click="clearDateRangeFilter"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          <Icon name="lucide:x-circle" class="w-4 h-4" />
        </button>
      </div>
      
      <div class="flex-1"></div>
      
      <button
        @click="handleReset"
        class="btn btn-secondary text-sm"
      >
        重置筛选
      </button>
    </div>
    
    <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
      <div class="flex items-center gap-2">
        <span>共找到</span>
        <span class="font-semibold text-gray-900">{{ store.filteredRecords.length }}</span>
        <span>条记录</span>
      </div>
      <span v-if="store.selectedDate" class="flex items-center gap-1 text-museum-600">
        <Icon name="lucide:calendar" class="w-3 h-3" />
        选中日期：{{ formatDate(store.selectedDate) }}
        <button @click="clearDateFilter" class="hover:text-museum-700">
          <Icon name="lucide:x" class="w-3 h-3" />
        </button>
      </span>
      <span v-if="hasDateFilter" class="flex items-center gap-1 text-blue-600">
        <Icon name="lucide:calendar-range" class="w-3 h-3" />
        日期筛选生效
      </span>
      <span v-if="locationFilter" class="flex items-center gap-1 text-green-600">
        <Icon name="lucide:map-pin" class="w-3 h-3" />
        {{ locationFilter }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMuseumStore } from '~/stores/museum'
import { useFormat } from '~/composables/useFormat'
import type { RecordStatus, RecordType } from '~/types'

const store = useMuseumStore()
const { formatDate } = useFormat()

const searchInput = ref(store.filters.search)
const statusFilter = ref(store.filters.status)
const typeFilter = ref(store.filters.type)
const priorityFilter = ref(store.filters.priority)
const locationFilter = ref(store.filters.location)
const dateStart = ref(store.filters.dateRange?.start || '')
const dateEnd = ref(store.filters.dateRange?.end || '')

const hasDateFilter = computed(() => dateStart.value || dateEnd.value)

let searchTimeout: ReturnType<typeof setTimeout>

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.updateFilters({ search: searchInput.value })
  }, 300)
}

const handleStatusChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  store.updateFilters({ status: target.value as RecordStatus | 'all' })
}

const handleTypeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  store.updateFilters({ type: target.value as RecordType | 'all' })
}

const handlePriorityChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  store.updateFilters({ priority: target.value as 'low' | 'medium' | 'high' | 'all' })
}

const handleLocationChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  store.updateFilters({ location: target.value })
}

const handleDateRangeChange = () => {
  if (dateStart.value || dateEnd.value) {
    store.updateFilters({
      dateRange: {
        start: dateStart.value,
        end: dateEnd.value || dateStart.value
      }
    })
  } else {
    store.updateFilters({ dateRange: null })
  }
}

const clearDateFilter = () => {
  store.setSelectedDate(null)
}

const clearDateRangeFilter = () => {
  dateStart.value = ''
  dateEnd.value = ''
  store.updateFilters({ dateRange: null })
}

const handleReset = () => {
  store.resetFilters()
  searchInput.value = ''
  statusFilter.value = 'all'
  typeFilter.value = 'all'
  priorityFilter.value = 'all'
  locationFilter.value = ''
  dateStart.value = ''
  dateEnd.value = ''
}
</script>
