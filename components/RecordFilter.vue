<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-4">
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
        class="input w-36"
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
        class="input w-32"
      >
        <option value="all">全部类型</option>
        <option value="restock">补货</option>
        <option value="loss">损耗</option>
      </select>
      
      <select
        v-model="priorityFilter"
        @change="handlePriorityChange"
        class="input w-32"
      >
        <option value="all">全部优先级</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>

      <button
        @click="handleReset"
        class="btn btn-secondary text-sm"
      >
        重置筛选
      </button>
    </div>
    
    <div class="flex items-center gap-2 text-sm text-gray-500">
      <span>共找到</span>
      <span class="font-semibold text-gray-900">{{ store.filteredRecords.length }}</span>
      <span>条记录</span>
      <span v-if="store.selectedDate" class="ml-2 flex items-center gap-1 text-museum-600">
        <Icon name="lucide:calendar" class="w-3 h-3" />
        {{ formatDate(store.selectedDate) }}
        <button @click="clearDateFilter" class="hover:text-museum-700 ml-1">
          <Icon name="lucide:x" class="w-3 h-3" />
        </button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMuseumStore } from '~/stores/museum'
import { useFormat } from '~/composables/useFormat'
import type { RecordStatus, RecordType } from '~/types'

const store = useMuseumStore()
const { formatDate } = useFormat()

const searchInput = ref(store.filters.search)
const statusFilter = ref(store.filters.status)
const typeFilter = ref(store.filters.type)
const priorityFilter = ref(store.filters.priority)

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

const clearDateFilter = () => {
  store.setSelectedDate(null)
}

const handleReset = () => {
  store.resetFilters()
  searchInput.value = ''
  statusFilter.value = 'all'
  typeFilter.value = 'all'
  priorityFilter.value = 'all'
}
</script>
