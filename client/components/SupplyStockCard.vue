<template>
  <div
    class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-primary-200 hover:-translate-y-1 transition-all duration-300"
    :class="{
      'border-yellow-300 bg-yellow-50': stockStatus === 'warning',
      'border-red-300 bg-red-50': stockStatus === 'critical'
    }"
  >
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center"
          :class="categoryBg"
        >
          <span class="text-2xl">{{ categoryIcon }}</span>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">{{ supply.name }}</h3>
          <span
            class="text-xs px-2 py-0.5 rounded-full"
            :class="categoryBadgeClass"
          >
            {{ getCategoryText(supply.category) }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span
          v-if="stockStatus !== 'normal'"
          class="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
          :class="statusBadgeClass"
        >
          <span v-if="stockStatus === 'warning'">⚠️</span>
          <span v-else>🚨</span>
          {{ statusText }}
        </span>
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-500">当前库存</span>
        <span class="font-semibold" :class="stockValueClass">
          {{ supply.currentStock }} {{ supply.unit }}
        </span>
      </div>

      <div class="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
        class="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
        :class="progressBarClass"
        :style="{ width: stockPercentage + '%' }"
      ></div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="bg-gray-50 rounded-lg p-2">
          <p class="text-gray-400">安全库存</p>
          <p class="font-medium text-gray-700">{{ supply.safeStock }} {{ supply.unit }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-2">
          <p class="text-gray-400">警告库存</p>
          <p class="font-medium text-gray-700">{{ supply.warningStock }} {{ supply.unit }}</p>
        </div>
      </div>

      <div class="pt-2 border-t border-gray-100">
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span>单价: {{ formatCurrency(supply.unitPrice) }}</span>
          <span v-if="supply.lastRestockDate">
            上次补货: {{ supply.lastRestockDate }} (+{{ supply.lastRestockQuantity }}{{ supply.unit }})
          </span>
        </div>
      </div>

      <div v-if="supply.note" class="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
        {{ supply.note }}
      </div>

      <button
        v-if="showRestockButton"
        @click="$emit('restock', supply)"
        class="w-full mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
      >
        快速补货
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Supply } from '~/types'
import { getCategoryText } from '~/utils/formatters'
import { formatCurrency } from '~/utils/formatters'

interface Props {
  supply: Supply
  showRestockButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRestockButton: true
})

defineEmits<{
  restock: [supply: Supply]
}>()

const stockPercentage = computed(() => {
  const percentage = (props.supply.currentStock / props.supply.safeStock) * 100
  return Math.min(percentage, 100)
})

const stockStatus = computed(() => {
  if (props.supply.currentStock <= props.supply.warningStock) return 'critical'
  if (props.supply.currentStock <= props.supply.safeStock) return 'warning'
  return 'normal'
})

const statusText = computed(() => {
  if (stockStatus.value === 'critical') return '库存严重'
  if (stockStatus.value === 'warning') return '库存预警'
  return '库存正常'
})

const categoryIcon = computed(() => {
  const iconMap: Record<string, string> = {
    detergent: '🧴',
    tool: '🧹',
    disposable: '🧻',
    protective: '🧤'
  }
  return iconMap[props.supply.category] || '📦'
})

const categoryBg = computed(() => {
  const bgMap: Record<string, string> = {
    detergent: 'bg-blue-100',
    tool: 'bg-green-100',
    disposable: 'bg-purple-100',
    protective: 'bg-orange-100'
  }
  return bgMap[props.supply.category] || 'bg-gray-100'
})

const categoryBadgeClass = computed(() => {
  const classMap: Record<string, string> = {
    detergent: 'bg-blue-100 text-blue-700',
    tool: 'bg-green-100 text-green-700',
    disposable: 'bg-purple-100 text-purple-700',
    protective: 'bg-orange-100 text-orange-700'
  }
  return classMap[props.supply.category] || 'bg-gray-100 text-gray-700'
})

const statusBadgeClass = computed(() => {
  if (stockStatus.value === 'critical') return 'bg-red-100 text-red-700'
  if (stockStatus.value === 'warning') return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
})

const stockValueClass = computed(() => {
  if (stockStatus.value === 'critical') return 'text-red-600'
  if (stockStatus.value === 'warning') return 'text-yellow-600'
  return 'text-gray-900'
})

const progressBarClass = computed(() => {
  if (stockStatus.value === 'critical') return 'bg-red-500'
  if (stockStatus.value === 'warning') return 'bg-yellow-500'
  return 'bg-green-500'
})
</script>
