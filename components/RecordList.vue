<template>
  <div class="card overflow-hidden">
    <div v-if="records.length === 0" class="p-12 text-center">
      <Icon name="lucide:inbox" class="w-12 h-12 mx-auto text-gray-300 mb-4" />
      <p class="text-gray-500">暂无记录</p>
    </div>
    
    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="record in records"
        :key="record.id"
        @click="$emit('select', record.id)"
        class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        :class="{ 'bg-museum-50': store.selectedRecordId === record.id }"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <div 
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="record.type === 'restock' ? 'bg-blue-100' : 'bg-orange-100'"
            >
              <Icon 
                :name="record.type === 'restock' ? 'lucide:package' : 'lucide:trash-2'" 
                class="w-5 h-5"
                :class="record.type === 'restock' ? 'text-blue-600' : 'text-orange-600'"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-medium text-gray-900 truncate">{{ record.productName }}</h3>
                <Badge :status="record.status" />
                <span 
                  v-if="record.priority === 'high'" 
                  class="badge bg-red-100 text-red-700"
                >
                  紧急
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-0.5">{{ record.productSku }}</p>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                <span class="flex items-center gap-1">
                  <Icon name="lucide:hash" class="w-3 h-3" />
                  {{ record.quantity }}{{ getProductUnit(record.productId) }}
                </span>
                <span class="flex items-center gap-1">
                  <Icon name="lucide:user" class="w-3 h-3" />
                  {{ record.createdByName }}
                </span>
                <span v-if="canSeeField('location')" class="flex items-center gap-1">
                  <Icon name="lucide:map-pin" class="w-3 h-3" />
                  {{ record.location }}
                </span>
                <span v-if="canSeeField('supplier') && record.supplier" class="flex items-center gap-1">
                  <Icon name="lucide:building" class="w-3 h-3" />
                  {{ record.supplier }}
                </span>
                <span v-if="canSeeField('relatedEvent') && record.relatedEvent" class="flex items-center gap-1">
                  <Icon name="lucide:calendar" class="w-3 h-3" />
                  {{ record.relatedEvent }}
                </span>
                <span v-if="canSeeField('relatedTicketOrder') && record.relatedTicketOrder" class="flex items-center gap-1">
                  <Icon name="lucide:ticket" class="w-3 h-3" />
                  {{ record.relatedTicketOrder }}
                </span>
              </div>
              <div v-if="record.status === 'abnormal'" class="mt-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                  <Icon name="lucide:alert-triangle" class="w-3 h-3" />
                  {{ getAbnormalRemark(record) }}
                </span>
              </div>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-xs text-gray-500">
              <span class="text-gray-400">{{ getDateLabel(record) }}：</span>
              {{ formatDate(getBusinessDate(record) || record.updatedAt) }}
            </p>
            <p class="text-xs text-gray-400 mt-1">{{ relativeTime(record.updatedAt) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMuseumStore } from '~/stores/museum'
import { useFormat } from '~/composables/useFormat'
import type { InventoryRecord } from '~/types'

defineProps<{
  records: InventoryRecord[]
}>()

defineEmits<{
  (e: 'select', recordId: string): void
}>()

const store = useMuseumStore()
const { relativeTime, formatDate } = useFormat()

const getBusinessDate = store.getBusinessDate

const getDateLabel = (record: InventoryRecord): string => {
  if (record.status === 'completed') return '完成日期'
  if (record.type === 'restock') return '预计到货'
  if (record.type === 'loss') return '发生日期'
  return '业务日期'
}

const getProductUnit = (productId: string): string => {
  const product = store.products.find(p => p.id === productId)
  return product?.unit || ''
}

const canSeeField = (field: string): boolean => {
  if (store.permissions.visibleFields.includes('all')) return true
  return store.permissions.visibleFields.includes(field)
}

const getAbnormalRemark = (record: InventoryRecord): string => {
  const abnormalHistory = record.history.find(h => h.status === 'abnormal')
  if (abnormalHistory) {
    const remark = abnormalHistory.remark.replace(/【.*?】/g, '').trim()
    return remark.length > 20 ? remark.substring(0, 20) + '...' : remark
  }
  return '异常待处理'
}
</script>
