<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold text-gray-900">筛选条件</h3>
      <button
        v-if="hasActiveFilters"
        @click="handleClearAll"
        class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
      >
        <span>✕</span>
        清除全部
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">记录类型</label>
        <div class="flex flex-wrap gap-2">
          <button
              v-for="type in types"
              :key="type.value"
            :class="[
              'px-3 py-1.5 text-sm rounded-lg border transition-colors',
              selectedTypes.includes(type.value)
                ? `${type.bgClass} ${type.textClass} ${type.borderClass}`
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            ]"
            @click="toggleType(type.value)"
          >
            <span class="flex items-center gap-1.5">
              <span>{{ type.icon }}</span>
              {{ type.label }}
            </span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">日期范围</label>
          <div class="flex items-center gap-2">
            <input
              type="date"
              :value="filterStore.global.dateRange?.[0] || ''"
              @change="handleStartDateChange"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span class="text-gray-400">至</span>
            <input
              type="date"
              :value="filterStore.global.dateRange?.[1] || ''"
              @change="handleEndDateChange"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">关键词搜索</label>
          <div class="relative">
            <input
              v-model="localSearchText"
              @input="handleSearch"
              type="text"
              placeholder="搜索标题、描述、人员..."
              class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            项目筛选
            <span v-if="filterStore.global.projectIds.length > 0" class="text-primary-600 ml-1">
              (已选 {{ filterStore.global.projectIds.length }})
            </span>
          </label>
          <div ref="projectDropdownRef" class="relative">
            <button
              @click="showProjectDropdown = !showProjectDropdown"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between"
            >
              <span v-if="filterStore.global.projectIds.length === 0" class="text-gray-400">
                请选择项目
              </span>
              <span v-else-if="filterStore.global.projectIds.length <= 2">
                {{ filterStore.global.projectIds.map(id => getProjectName(id)).join('、') }}
              </span>
              <span v-else>
                已选择 {{ filterStore.global.projectIds.length }} 个项目
              </span>
              <span class="text-gray-400">▼</span>
            </button>
            <div
              v-if="showProjectDropdown"
              class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <div
                v-for="project in projects"
                :key="project.id"
                class="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                @click="toggleProject(project.id)"
              >
                <input
                  type="checkbox"
                  :checked="filterStore.global.projectIds.includes(project.id)"
                  class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span class="text-sm text-gray-700">{{ project.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            状态筛选
            <span v-if="filterStore.global.statuses.length > 0" class="text-primary-600 ml-1">
              (已选 {{ filterStore.global.statuses.length }})
            </span>
          </label>
          <div ref="statusDropdownRef" class="relative">
            <button
              @click="showStatusDropdown = !showStatusDropdown"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between"
            >
              <span v-if="filterStore.global.statuses.length === 0" class="text-gray-400">
                请选择状态
              </span>
              <span v-else-if="filterStore.global.statuses.length <= 2">
                {{ filterStore.global.statuses.map(s => getStatusText(s)).join('、') }}
              </span>
              <span v-else>
                已选择 {{ filterStore.global.statuses.length }} 个状态
              </span>
              <span class="text-gray-400">▼</span>
            </button>
            <div
              v-if="showStatusDropdown"
              class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <div
                v-for="status in availableStatuses"
                :key="status.value"
                class="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                @click="toggleStatus(status.value)"
              >
                <input
                  type="checkbox"
                  :checked="filterStore.global.statuses.includes(status.value)"
                  class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span class="text-sm text-gray-700">{{ status.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasActiveFilters" class="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <div
          v-for="tag in activeFilterTags"
          :key="tag.key"
          class="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
        >
          <span>{{ tag.label }}</span>
          <button @click="tag.onRemove" class="hover:text-primary-900">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '~/stores/data'
import { useFilterStore } from '~/stores/filter'
import { getStatusText } from '~/utils/formatters'
import type { Project } from '~/types'

interface RecordType {
  value: string
  label: string
  icon: string
  bgClass: string
  textClass: string
  borderClass: string
}

interface StatusOption {
  value: string
  label: string
}

interface FilterTag {
  key: string
  label: string
  onRemove: () => void
}

const props = defineProps<{
  types: RecordType[]
}>()

const emit = defineEmits<{
  filterChange: []
}>()

const dataStore = useDataStore()
const filterStore = useFilterStore()

const showProjectDropdown = ref(false)
const showStatusDropdown = ref(false)
const localSearchText = ref(filterStore.global.searchText)
const projectDropdownRef = ref<HTMLElement | null>(null)
const statusDropdownRef = ref<HTMLElement | null>(null)

const projects = computed<Project[]>(() => dataStore.projects)

const selectedTypes = computed(() => filterStore.global.types)

const availableStatuses = computed<StatusOption[]>(() => {
  const types = selectedTypes.value
  const statuses: StatusOption[] = []
  
  if (types.includes('schedule') || types.length === 0) {
    statuses.push(
      { value: 'scheduled', label: '已排期' },
      { value: 'in_progress', label: '进行中' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    )
  }
  if (types.includes('punch') || types.length === 0) {
    statuses.push(
      { value: 'normal', label: '正常' },
      { value: 'late', label: '迟到' },
      { value: 'early_leave', label: '早退' },
      { value: 'absent', label: '缺勤' }
    )
  }
  if (types.includes('inspection') || types.length === 0) {
    statuses.push(
      { value: 'excellent', label: '优秀' },
      { value: 'good', label: '良好' },
      { value: 'pass', label: '合格' },
      { value: 'fail', label: '不合格' }
    )
  }
  if (types.includes('requisition') || types.length === 0) {
    statuses.push(
      { value: 'draft', label: '草稿' },
      { value: 'pending', label: '待审核' },
      { value: 'approved', label: '已通过' },
      { value: 'rejected', label: '已拒绝' },
      { value: 'delivered', label: '已发货' },
      { value: 'completed', label: '已完成' }
    )
  }
  if (types.includes('alert') || types.length === 0) {
    statuses.push(
      { value: 'open', label: '未处理' },
      { value: 'in_progress', label: '处理中' },
      { value: 'resolved', label: '已解决' }
    )
  }
  
  const uniqueStatuses = statuses.filter((status, index, self) =>
    index === self.findIndex(s => s.value === status.value)
  )
  
  return uniqueStatuses
})

const hasActiveFilters = computed(() => filterStore.hasActiveFilters)

const activeFilterTags = computed<FilterTag[]>(() => {
  const tags: FilterTag[] = []
  
  if (filterStore.global.dateRange) {
    tags.push({
      key: 'dateRange',
      label: `日期: ${filterStore.global.dateRange[0]} 至 ${filterStore.global.dateRange[1]}`,
      onRemove: () => filterStore.setDateRange(null)
    })
  }
  
  filterStore.global.projectIds.forEach(id => {
    const project = dataStore.getProjectById(id)
    if (project) {
      tags.push({
        key: `project-${id}`,
        label: `项目: ${project.name}`,
        onRemove: () => filterStore.toggleProjectId(id)
      })
    }
  })
  
  filterStore.global.statuses.forEach(status => {
    tags.push({
      key: `status-${status}`,
      label: `状态: ${getStatusText(status)}`,
      onRemove: () => filterStore.toggleStatus(status)
    })
  })
  
  filterStore.global.types.forEach(type => {
    const typeConfig = props.types.find(t => t.value === type)
    if (typeConfig) {
      tags.push({
        key: `type-${type}`,
        label: `类型: ${typeConfig.label}`,
        onRemove: () => filterStore.toggleType(type)
      })
    }
  })
  
  if (filterStore.global.searchText) {
    tags.push({
      key: 'search',
      label: `搜索: ${filterStore.global.searchText}`,
      onRemove: () => {
        localSearchText.value = ''
        filterStore.setSearchText('')
      }
    })
  }
  
  return tags
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    filterStore.setSearchText(localSearchText.value)
    emit('filterChange')
  }, 300)
}

function handleStartDateChange(event: Event) {
  const target = event.target as HTMLInputElement
  const startDate = target.value
  const endDate = filterStore.global.dateRange?.[1] || ''
  
  if (startDate && endDate && startDate > endDate) {
    filterStore.setDateRange([startDate, startDate])
  } else if (startDate) {
    filterStore.setDateRange([startDate, endDate || startDate])
  } else {
    filterStore.setDateRange(null)
  }
  emit('filterChange')
}

function handleEndDateChange(event: Event) {
  const target = event.target as HTMLInputElement
  const endDate = target.value
  const startDate = filterStore.global.dateRange?.[0] || ''
  
  if (startDate && endDate && startDate > endDate) {
    filterStore.setDateRange([endDate, endDate])
  } else if (endDate) {
    filterStore.setDateRange([startDate || endDate, endDate])
  } else {
    filterStore.setDateRange(null)
  }
  emit('filterChange')
}

function toggleType(type: string) {
  filterStore.toggleType(type)
  emit('filterChange')
}

function toggleProject(projectId: string) {
  filterStore.toggleProjectId(projectId)
  emit('filterChange')
}

function toggleStatus(status: string) {
  filterStore.toggleStatus(status)
  emit('filterChange')
}

function handleClearAll() {
  localSearchText.value = ''
  filterStore.clearAllFilters()
  emit('filterChange')
}

function getProjectName(projectId: string): string {
  return dataStore.getProjectById(projectId)?.name || '未知项目'
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (projectDropdownRef.value && !projectDropdownRef.value.contains(target)) {
    showProjectDropdown.value = false
  }
  if (statusDropdownRef.value && !statusDropdownRef.value.contains(target)) {
    showStatusDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
