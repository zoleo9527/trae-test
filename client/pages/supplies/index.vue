<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">耗材库存管理</h1>
        <p class="text-gray-500 mt-1">
          共 {{ supplies.length }} 种耗材 · 
          <span class="text-yellow-600">{{ warningCount }} 种预警</span> · 
          <span class="text-red-600">{{ criticalCount }} 种严重不足</span>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/supplies/requisitions"
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          申领单管理
        </NuxtLink>
        <NuxtLink
          to="/supplies/requisition/new"
          class="px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建申领
        </NuxtLink>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500">类别:</label>
          <select
            v-model="selectedCategory"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部</option>
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500">库存状态:</label>
          <select
            v-model="selectedStockStatus"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部</option>
            <option value="normal">正常</option>
            <option value="warning">预警</option>
            <option value="critical">严重不足</option>
          </select>
        </div>

        <div class="flex items-center gap-2 flex-1 min-w-[200px]">
          <label class="text-sm text-gray-500">搜索:</label>
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索耗材名称..."
            class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          @click="resetFilters"
          class="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors"
        >
          重置筛选
        </button>
      </div>
    </div>

    <div v-if="filteredSupplies.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
      <span class="text-5xl mb-4 block">📦</span>
      <p class="text-gray-500 text-lg">暂无符合条件的耗材</p>
      <p class="text-gray-400 text-sm mt-2">请尝试调整筛选条件</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <SupplyStockCard
        v-for="supply in filteredSupplies"
        :key="supply.id"
        :supply="supply"
        @restock="handleQuickRestock"
      />
    </div>

    <Teleport to="body">
      <div
        v-if="showToast"
        class="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"
      >
        <span v-if="toastType === 'success'" class="text-green-400">✓</span>
        <span v-else class="text-red-400">✕</span>
        <span>{{ toastMessage }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import { getCategoryText } from '~/utils/formatters'
import type { Supply } from '~/types'

const dataStore = useDataStore()
const authStore = useAuthStore()
const router = useRouter()

const selectedCategory = ref('')
const selectedStockStatus = ref('')
const searchText = ref('')

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

const categories = [
  { value: 'detergent', label: '清洁剂' },
  { value: 'tool', label: '清洁工具' },
  { value: 'disposable', label: '一次性用品' },
  { value: 'protective', label: '防护用品' }
]

const supplies = computed(() => dataStore.supplies)

const warningCount = computed(() => {
  return supplies.value.filter(s => 
    s.currentStock <= s.warningStock && s.currentStock > 2
  ).length
})

const criticalCount = computed(() => {
  return supplies.value.filter(s => s.currentStock <= 2).length
})

const filteredSupplies = computed(() => {
  let result = [...supplies.value]

  if (selectedCategory.value) {
    result = result.filter(s => s.category === selectedCategory.value)
  }

  if (selectedStockStatus.value) {
    result = result.filter(s => {
      const status = getStockStatus(s)
      return status === selectedStockStatus.value
    })
  }

  if (searchText.value.trim()) {
    const search = searchText.value.toLowerCase().trim()
    result = result.filter(s => 
      s.name.toLowerCase().includes(search) ||
      getCategoryText(s.category).toLowerCase().includes(search)
    )
  }

  result.sort((a, b) => {
    const statusA = getStockStatus(a)
    const statusB = getStockStatus(b)
    const priority = { critical: 0, warning: 1, normal: 2 }
    return priority[statusA] - priority[statusB]
  })

  return result
})

function getStockStatus(supply: Supply): 'normal' | 'warning' | 'critical' {
  if (supply.currentStock <= supply.warningStock) return 'critical'
  if (supply.currentStock <= supply.safeStock) return 'warning'
  return 'normal'
}

function resetFilters() {
  selectedCategory.value = ''
  selectedStockStatus.value = ''
  searchText.value = ''
}

function handleQuickRestock(supply: Supply) {
  router.push({
    path: '/supplies/requisition/new',
    query: { supplyId: supply.id }
  })
}

function showToastMessage(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
</script>

<style scoped>
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
