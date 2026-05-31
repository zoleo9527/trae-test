<template>
  <div class="card mb-6">
    <div class="flex flex-wrap gap-4 items-end">
      <div class="flex-1 min-w-64">
        <label class="block text-sm font-medium text-gray-700 mb-1">关键词搜索</label>
        <input
          v-model="localFilters.keyword"
          type="text"
          class="input"
          placeholder="输入编号、客户名称、内容关键词..."
          @input="emitChange"
        />
      </div>

      <div v-if="showDateRange" class="min-w-48">
        <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
        <input
          v-model="localFilters.startDate"
          type="date"
          class="input"
          @input="emitChange"
        />
      </div>

      <div v-if="showDateRange" class="min-w-48">
        <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
        <input
          v-model="localFilters.endDate"
          type="date"
          class="input"
          @input="emitChange"
        />
      </div>

      <div v-if="showStatus" class="min-w-40">
        <label class="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
        <select v-model="localFilters.status" class="select" @change="emitChange">
          <option value="">全部状态</option>
          <option v-for="s in statusOptions" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </select>
      </div>

      <div v-if="showCategory && categoryOptions.length > 0" class="min-w-40">
        <label class="block text-sm font-medium text-gray-700 mb-1">分类筛选</label>
        <select v-model="localFilters.category" class="select" @change="emitChange">
          <option value="">全部分类</option>
          <option v-for="c in categoryOptions" :key="c.value" :value="c.value">
            {{ c.label }}
          </option>
        </select>
      </div>

      <div v-if="showPriority" class="min-w-40">
        <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
        <select v-model="localFilters.priority" class="select" @change="emitChange">
          <option value="">全部优先级</option>
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="urgent">紧急</option>
        </select>
      </div>

      <div v-if="showAssignee" class="min-w-40">
        <label class="block text-sm font-medium text-gray-700 mb-1">责任人</label>
        <select v-model="localFilters.assignee" class="select" @change="emitChange">
          <option value="">全部责任人</option>
          <option v-for="u in userOptions" :key="u.value" :value="u.value">
            {{ u.label }}
          </option>
        </select>
      </div>

      <button @click="resetFilters" class="btn btn-secondary">
        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        重置
      </button>

      <button
        v-if="$slots.actions"
        class="btn btn-primary"
        @click="$emit('create')"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <slot name="actions"></slot>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { RecordStatus, ComplaintPriority } from '~/types'

interface FilterBarProps {
  showDateRange?: boolean
  showStatus?: boolean
  showCategory?: boolean
  showPriority?: boolean
  showAssignee?: boolean
  statusOptions?: { value: string; label: string }[]
  categoryOptions?: { value: string; label: string }[]
  userOptions?: { value: string; label: string }[]
  initialFilters?: {
    keyword?: string
    startDate?: string
    endDate?: string
    status?: string
    category?: string
    priority?: ComplaintPriority
    assignee?: string
  }
}

const props = withDefaults(defineProps<FilterBarProps>(), {
  showDateRange: true,
  showStatus: true,
  showCategory: false,
  showPriority: false,
  showAssignee: false,
  statusOptions: () => [
    { value: 'draft', label: '草稿' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
    { value: 'processing', label: '处理中' },
    { value: 'completed', label: '已完成' },
    { value: 'overdue', label: '已逾期' }
  ],
  categoryOptions: () => [],
  userOptions: () => [],
  initialFilters: () => ({})
})

const emit = defineEmits<{
  (e: 'filter', filters: typeof localFilters): void
  (e: 'create'): void
}>()

const localFilters = reactive({
  keyword: '',
  startDate: '',
  endDate: '',
  status: '',
  category: '',
  priority: '' as ComplaintPriority | '',
  assignee: '',
  ...props.initialFilters
})

function emitChange() {
  emit('filter', { ...localFilters })
}

function resetFilters() {
  localFilters.keyword = ''
  localFilters.startDate = ''
  localFilters.endDate = ''
  localFilters.status = ''
  localFilters.category = ''
  localFilters.priority = ''
  localFilters.assignee = ''
  emitChange()
}

watch(() => props.initialFilters, (newVal) => {
  Object.assign(localFilters, newVal)
}, { deep: true })
</script>
