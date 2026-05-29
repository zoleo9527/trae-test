<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">订单查询</h1>
      <p class="text-gray-500 mt-1">查看所有订单及异常订单</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm mb-6">
      <div class="p-4 border-b flex flex-wrap gap-4 items-center">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">异常状态:</span>
          <select v-model="abnormalFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">全部</option>
            <option value="true">仅异常订单</option>
            <option value="false">仅正常订单</option>
          </select>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">订单状态:</span>
          <select v-model="statusFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">全部</option>
            <option value="pending">待配送</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
            <option value="abnormal">异常</option>
          </select>
        </div>
        <div class="flex-1"></div>
        <div class="relative">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索订单号、商家名称..."
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
          >
          <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p class="text-gray-500 mt-2">加载中...</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单号</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商家名称</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">异常</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-medium text-gray-900">{{ order.order_no }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-gray-700">{{ order.merchant_name }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-gray-700">{{ order.goods_desc }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-medium text-gray-900">¥{{ order.total_amount.toFixed(2) }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`status-badge status-${order.status}`">{{ getStatusText(order.status) }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="order.is_abnormal" class="status-badge status-abnormal">{{ order.abnormal_reason }}</span>
                <span v-else class="text-gray-400 text-sm">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                {{ formatDate(order.created_at) }}
              </td>
            </tr>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                暂无订单数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="total > 0" class="px-6 py-4 border-t flex items-center justify-between">
        <div class="text-sm text-gray-500">
          共 {{ total }} 条记录
        </div>
        <div class="flex items-center space-x-2">
          <button 
            @click="prevPage" 
            :disabled="page <= 1"
            class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一页
          </button>
          <span class="text-sm text-gray-700">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
          <button 
            @click="nextPage" 
            :disabled="page >= Math.ceil(total / pageSize)"
            class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order, PaginatedResponse } from '~/types'

const route = useRoute()

const loading = ref(false)
const orders = ref<Order[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const abnormalFilter = ref('')
const statusFilter = ref('')
const searchQuery = ref('')

const { get } = useApi()

const filteredOrders = computed(() => {
  if (!searchQuery.value) return orders.value
  return orders.value.filter(o => 
    o.order_no.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    o.merchant_name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const loadOrders = async () => {
  loading.value = true
  try {
    let url = `/orders?page=${page.value}&page_size=${pageSize.value}`
    
    const abnormal = abnormalFilter.value || (route.query.is_abnormal as string) || ''
    const status = statusFilter.value || ''
    
    if (abnormal) url += `&is_abnormal=${abnormal}`
    if (status) url += `&status=${status}`
    
    const response = await get<PaginatedResponse<Order>>(url)
    orders.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadOrders()
  }
}

const nextPage = () => {
  if (page.value < Math.ceil(total.value / pageSize.value)) {
    page.value++
    loadOrders()
  }
}

const getStatusText = (status: string) => {
  const statuses: Record<string, string> = {
    pending: '待配送',
    completed: '已完成',
    cancelled: '已取消',
    abnormal: '异常'
  }
  return statuses[status] || status
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch([abnormalFilter, statusFilter], () => {
  page.value = 1
  loadOrders()
})

onMounted(() => {
  if (route.query.is_abnormal) {
    abnormalFilter.value = route.query.is_abnormal as string
  }
  loadOrders()
})
</script>
