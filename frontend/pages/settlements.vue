<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">商家结算</h1>
      <p class="text-gray-500 mt-1">管理商家周期结算</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm">
      <div class="p-4 border-b flex flex-wrap gap-4 items-center">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">状态筛选:</span>
          <select v-model="statusFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p class="text-gray-500 mt-2">加载中...</p>
      </div>

      <div v-else class="divide-y">
        <div v-for="settlement in filteredSettlements" :key="settlement.id" class="p-6 hover:bg-gray-50">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="font-semibold text-gray-900">{{ settlement.merchant_name }}</h3>
                <span :class="`status-badge status-${settlement.status}`">{{ getStatusText(settlement.status) }}</span>
              </div>
              <p class="text-sm text-gray-500">
                结算周期: {{ formatDate(settlement.period_start) }} - {{ formatDate(settlement.period_end) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">结算金额</p>
              <p class="text-xl font-bold text-primary-600">¥{{ settlement.net_amount.toFixed(2) }}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p class="text-xs text-gray-500">订单数量</p>
              <p class="font-medium text-gray-900">{{ settlement.total_orders }} 单</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">商品总额</p>
              <p class="font-medium text-gray-900">¥{{ settlement.total_goods_amount.toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">配送费</p>
              <p class="font-medium text-gray-900">-¥{{ settlement.total_delivery_fee.toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">补贴合计</p>
              <p class="font-medium text-green-600">+¥{{ settlement.total_subsidy.toFixed(2) }}</p>
            </div>
          </div>
        </div>
        
        <div v-if="filteredSettlements.length === 0" class="p-8 text-center text-gray-500">
          暂无结算记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Settlement } from '~/types'

const route = useRoute()

const loading = ref(false)
const settlements = ref<Settlement[]>([])
const statusFilter = ref('')

const { get } = useApi()

const filteredSettlements = computed(() => {
  if (!statusFilter.value) return settlements.value
  return settlements.value.filter(s => s.status === statusFilter.value)
})

const loadSettlements = async () => {
  loading.value = true
  try {
    const status = statusFilter.value || (route.query.status as string) || ''
    const response = await get<any>(`/settlements${status ? `?status=${status}` : ''}`)
    settlements.value = response.data
  } catch (error) {
    console.error('Failed to load settlements:', error)
  } finally {
    loading.value = false
  }
}

const getStatusText = (status: string) => {
  const statuses: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成'
  }
  return statuses[status] || status
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  if (route.query.status) {
    statusFilter.value = route.query.status as string
  }
  loadSettlements()
})
</script>
