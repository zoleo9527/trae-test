<template>
  <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-700">
        共 <span class="font-medium text-gray-900">{{ total }}</span> 条记录
      </span>
      <span class="text-sm text-gray-500">·</span>
      <span class="text-sm text-gray-700">
        第 <span class="font-medium text-gray-900">{{ page }}</span> / <span class="font-medium text-gray-900">{{ totalPages }}</span> 页
      </span>
    </div>

    <div class="flex items-center gap-2">
      <select v-model="localPageSize" @change="handlePageSizeChange" class="select !w-auto !py-1 text-sm">
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }} 条/页
        </option>
      </select>

      <div class="flex items-center gap-1">
        <button
          @click="handlePageChange(1)"
          :disabled="page === 1"
          class="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <button
          @click="handlePageChange(page - 1)"
          :disabled="page === 1"
          class="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <template v-for="p in visiblePages" :key="p">
          <span v-if="p === '...'" class="px-2 py-1 text-sm text-gray-400">...</span>
          <button
            v-else
            @click="handlePageChange(p as number)"
            class="px-3 py-1 text-sm rounded border transition-colors"
            :class="p === page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'"
          >
            {{ p }}
          </button>
        </template>

        <button
          @click="handlePageChange(page + 1)"
          :disabled="page === totalPages"
          class="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          @click="handlePageChange(totalPages)"
          :disabled="page === totalPages"
          class="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
  pageSizeOptions?: number[]
}>()

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', pageSize: number): void
  (e: 'change', params: { page: number; pageSize: number }): void
}>()

const pageSizeOptions = computed(() => props.pageSizeOptions || [10, 20, 50, 100])
const localPageSize = ref(props.pageSize)

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const current = props.page
  const total = totalPages.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

function handlePageChange(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:page', page)
    emit('change', { page, pageSize: localPageSize.value })
  }
}

function handlePageSizeChange() {
  emit('update:pageSize', localPageSize.value)
  emit('change', { page: 1, pageSize: localPageSize.value })
}

watch(() => props.pageSize, (newVal) => {
  localPageSize.value = newVal
})
</script>
