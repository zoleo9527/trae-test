<script setup lang="ts">
import { computed } from 'vue'

export interface Column {
  key: string
  label: string
  width?: string
}

const props = defineProps<{
  columns: Column[]
  data: Record<string, any>[]
  loading?: boolean
  emptyText?: string
  showHeader?: boolean
}>()

const emit = defineEmits<{
  rowClick: [row: Record<string, any>]
}>()

const emptyMessage = computed(() => props.emptyText || '暂无数据')
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead v-if="showHeader !== false">
        <tr class="border-b border-border">
          <th
            v-for="col in columns"
            :key="col.key"
            :style="col.width ? { width: col.width } : {}"
            class="text-left py-2.5 px-3 text-text-secondary font-medium text-xs"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody v-if="!loading">
        <tr
          v-for="(row, idx) in data"
          :key="idx"
          class="border-b border-border/50 hover:bg-forest-50/50 cursor-pointer transition-colors"
          @click="emit('rowClick', row)"
        >
          <td v-for="col in columns" :key="col.key" class="py-2.5 px-3">
            <slot :name="col.key" :value="row[col.key]" :row="row">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
        <tr v-if="data.length === 0">
          <td :colspan="columns.length" class="text-center py-8 text-text-muted">
            {{ emptyMessage }}
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr v-for="i in 5" :key="i">
          <td v-for="col in columns" :key="col.key" class="py-2.5 px-3">
            <div class="h-4 bg-gray-100 rounded animate-pulse" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
