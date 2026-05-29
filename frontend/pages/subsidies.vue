<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">补贴管理</h1>
      <p class="text-gray-500 mt-1">查看和管理所有补贴记录</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-500">累计补贴总额</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">¥{{ totalSubsidy.toFixed(2) }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-500">已结算补贴</p>
        <p class="text-2xl font-bold text-green-600 mt-1">¥{{ settledSubsidy.toFixed(2) }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-5">
        <p class="text-sm text-gray-500">待结算补贴</p>
        <p class="text-2xl font-bold text-orange-600 mt-1">¥{{ unsettledSubsidy.toFixed(2) }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm">
      <div class="p-4 border-b flex flex-wrap gap-4 items-center">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">结算状态:</span>
          <select v-model="settledFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">全部</option>
            <option value="false">待结算</option>
            <option value="true">已结算</option>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">补贴类型</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">补贴原因</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="subsidy in filteredSubsidies" :key="subsidy.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-medium text-gray-900">{{ subsidy.order_no }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-gray-700">{{ subsidy.merchant_name }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-gray-700">{{ getSubsidyTypeText(subsidy.type) }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-gray-700">{{ subsidy.reason }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-medium text-green-600">+¥{{ subsidy.amount.toFixed(2) }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="['status-badge', subsidy.is_settled ? 'status-approved' : 'status-pending']">
                  {{ subsidy.is_settled ? '已结算' : '待结算' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                {{ formatDate(subsidy.created_at) }}
              </td>
            </tr>
            <tr v-if="filteredSubsidies.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                暂无补贴记录
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Subsidy } from '~/types'

const loading = ref(false)
const subsidies = ref<Subsidy[]>([])
const settledFilter = ref('')
const searchQuery = ref('')

const { get } = useApi()

const filteredSubsidies = computed(() => {
  let result = subsidies.value
  if (settledFilter.value !== '') {
    const isSettled = settledFilter.value === 'true'
    result = result.filter(s => s.is_settled === isSettled)
  }
  if (searchQuery.value) {
    result = result.filter(s => 
      s.order_no.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.merchant_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  return result
})

const totalSubsidy = computed(() => subsidies.value.reduce((sum, s) => sum + s.amount, 0))
const settledSubsidy = computed(() => subsidies.value.filter(s => s.is_settled).reduce((sum, s) => sum + s.amount, 0))
const unsettledSubsidy = computed(() => subsidies.value.filter(s => !s.is_settled).reduce((sum, s) => sum + s.amount, 0))

const loadSubsidies = async () => {
  loading.value = true
  try {
    const response = await get<any>('/subsidies?page_size=100')
    subsidies.value = response.data
  } catch (error) {
    console.error('Failed to load subsidies:', error)
  } finally {
    loading.value = false
  }
}

const getSubsidyTypeText = (type: string) => {
  const types: Record<string, string> = {
    overtime: '超时补贴',
    weather: '天气补贴',
    distance: '距离补贴',
    weight: '重量补贴',
    other: '其他补贴'
  }
  return types[type] || type
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

onMounted(() => {
  loadSubsidies()
})
</script>
