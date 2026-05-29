<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">异常申诉</h1>
      <p class="text-gray-500 mt-1">管理所有异常申诉和补贴申请</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm mb-6">
      <div class="p-4 border-b flex flex-wrap gap-4 items-center">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">状态筛选:</span>
          <select v-model="statusFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="need_review">需回查</option>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申诉原因</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申诉时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="appeal in filteredAppeals" :key="appeal.id" class="hover:bg-gray-50 cursor-pointer" @click="openAppealDrawer(appeal.id)">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-medium text-gray-900">{{ appeal.order_no }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-gray-700">{{ appeal.merchant_name }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-gray-700">{{ appeal.reason }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-gray-700">{{ getAppealTypeText(appeal.type) }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`status-badge status-${appeal.status}`">{{ getStatusText(appeal.status) }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                {{ formatDate(appeal.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  查看详情
                </button>
              </td>
            </tr>
            <tr v-if="filteredAppeals.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                暂无申诉数据
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

    <AppealDrawer 
      v-if="drawerVisible" 
      :appeal-id="selectedAppealId" 
      @close="drawerVisible = false"
      @processed="loadAppeals"
    />
  </div>
</template>

<script setup lang="ts">
import type { Appeal, PaginatedResponse } from '~/types'

const route = useRoute()

const loading = ref(false)
const appeals = ref<Appeal[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const statusFilter = ref('')
const searchQuery = ref('')
const drawerVisible = ref(false)
const selectedAppealId = ref('')

const { get } = useApi()

const filteredAppeals = computed(() => {
  if (!searchQuery.value) return appeals.value
  return appeals.value.filter(a => 
    a.order_no.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    a.merchant_name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const loadAppeals = async () => {
  loading.value = true
  try {
    const status = statusFilter.value || (route.query.status as string) || ''
    const response = await get<PaginatedResponse<Appeal>>(`/appeals?page=${page.value}&page_size=${pageSize.value}${status ? `&status=${status}` : ''}`)
    appeals.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('Failed to load appeals:', error)
  } finally {
    loading.value = false
  }
}

const openAppealDrawer = (appealId: string) => {
  selectedAppealId.value = appealId
  drawerVisible.value = true
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadAppeals()
  }
}

const nextPage = () => {
  if (page.value < Math.ceil(total.value / pageSize.value)) {
    page.value++
    loadAppeals()
  }
}

const getAppealTypeText = (type: string) => {
  const types: Record<string, string> = {
    subsidy: '补贴申请',
    refund: '退款申请',
    other: '其他'
  }
  return types[type] || type
}

const getStatusText = (status: string) => {
  const statuses: Record<string, string> = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已驳回',
    need_review: '需回查'
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

watch(statusFilter, () => {
  page.value = 1
  loadAppeals()
})

onMounted(() => {
  if (route.query.status) {
    statusFilter.value = route.query.status as string
  }
  loadAppeals()
})
</script>
