<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import StatusBadge from '@/components/StatusBadge.vue'
import DataTable, { type Column } from '@/components/DataTable.vue'
import { Search } from 'lucide-vue-next'

const router = useRouter()
const store = useDataStore()

const searchQuery = ref('')
const speciesFilter = ref('')
const statusFilter = ref('')

onMounted(() => {
  store.fetchPlots()
})

const speciesOptions = computed(() => {
  const set = new Set(store.plots.map(p => p.species))
  return Array.from(set)
})

const filteredPlots = computed(() => {
  return store.plots.filter(p => {
    if (searchQuery.value && !p.name.includes(searchQuery.value) && !p.species.includes(searchQuery.value)) return false
    if (speciesFilter.value && p.species !== speciesFilter.value) return false
    if (statusFilter.value && p.status !== statusFilter.value) return false
    return true
  })
})

const columns: Column[] = [
  { key: 'name', label: '地块名称' },
  { key: 'species', label: '品种' },
  { key: 'area', label: '面积' },
  { key: 'responsible_person', label: '负责人' },
  { key: 'status', label: '状态' },
  { key: 'updated_at', label: '更新时间' },
]

function handleRowClick(row: Record<string, any>) {
  router.push(`/plots/${row.id}`)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 16)
}
</script>

<template>
  <div>
    <h1 class="page-title mb-6">地块库存</h1>

    <div class="card p-4 mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[200px]">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            v-model="searchQuery"
            placeholder="搜索地块名称或品种..."
            class="input-field pl-9"
          />
        </div>
        <select v-model="speciesFilter" class="input-field w-auto min-w-[120px]">
          <option value="">全部品种</option>
          <option v-for="s in speciesOptions" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-model="statusFilter" class="input-field w-auto min-w-[120px]">
          <option value="">全部状态</option>
          <option value="在养">在养</option>
          <option value="休养">休养</option>
          <option value="已调出">已调出</option>
        </select>
      </div>
    </div>

    <div class="card">
      <DataTable
        :columns="columns"
        :data="filteredPlots"
        :loading="store.loadingPlots"
        empty-text="没有找到地块"
        @row-click="handleRowClick"
      >
        <template #status="{ value }">
          <StatusBadge :status="value" />
        </template>
        <template #updated_at="{ value }">
          {{ formatDate(value) }}
        </template>
      </DataTable>
    </div>
  </div>
</template>
