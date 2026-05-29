<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">首页看板</h1>
      <p class="text-gray-500 mt-1">实时掌握异常申诉和结算状态</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-400">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待处理申诉</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.pending_appeals || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <NuxtLink to="/appeals?status=pending" class="text-sm text-yellow-600 hover:text-yellow-700 mt-3 inline-block">
          查看全部 →
        </NuxtLink>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-400">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已驳回申诉</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.rejected_appeals || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <NuxtLink to="/appeals?status=rejected" class="text-sm text-red-600 hover:text-red-700 mt-3 inline-block">
          查看全部 →
        </NuxtLink>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-400">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">需回查申诉</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.need_review || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
        <NuxtLink to="/appeals?status=need_review" class="text-sm text-orange-600 hover:text-orange-700 mt-3 inline-block">
          查看全部 →
        </NuxtLink>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">异常订单</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.abnormal_orders || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <NuxtLink to="/orders?is_abnormal=true" class="text-sm text-red-600 hover:text-red-700 mt-3 inline-block">
          查看全部 →
        </NuxtLink>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-400">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待处理结算</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.pending_settlements || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <NuxtLink to="/settlements?status=pending" class="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-block">
          查看全部 →
        </NuxtLink>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-400">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">累计补贴</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">¥{{ stats?.total_subsidy || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <NuxtLink to="/subsidies" class="text-sm text-green-600 hover:text-green-700 mt-3 inline-block">
          查看全部 →
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm">
        <div class="p-6 border-b">
          <h2 class="text-lg font-semibold text-gray-900">待处理申诉列表</h2>
          <p class="text-sm text-gray-500 mt-1">需要尽快处理的申诉事项</p>
        </div>
        <div class="divide-y">
          <div 
            v-for="appeal in pendingAppeals" 
            :key="appeal.id"
            class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            @click="openAppealDrawer(appeal.id)"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900">{{ appeal.order_no }}</span>
                  <span class="status-badge status-pending">待处理</span>
                </div>
                <p class="text-sm text-gray-500 mt-1">{{ appeal.merchant_name }} - {{ appeal.reason }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatDate(appeal.created_at) }}</p>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div v-if="pendingAppeals.length === 0" class="p-8 text-center text-gray-500">
            暂无待处理申诉
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm">
        <div class="p-6 border-b">
          <h2 class="text-lg font-semibold text-gray-900">需回查申诉列表</h2>
          <p class="text-sm text-gray-500 mt-1">需要进一步核实的申诉事项</p>
        </div>
        <div class="divide-y">
          <div 
            v-for="appeal in needReviewAppeals" 
            :key="appeal.id"
            class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            @click="openAppealDrawer(appeal.id)"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900">{{ appeal.order_no }}</span>
                  <span class="status-badge status-need_review">需回查</span>
                </div>
                <p class="text-sm text-gray-500 mt-1">{{ appeal.merchant_name }} - {{ appeal.reason }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatDate(appeal.created_at) }}</p>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div v-if="needReviewAppeals.length === 0" class="p-8 text-center text-gray-500">
            暂无需回查申诉
          </div>
        </div>
      </div>
    </div>

    <AppealDrawer 
      v-if="drawerVisible" 
      :appeal-id="selectedAppealId" 
      @close="drawerVisible = false"
      @processed="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import type { DashboardStats, Appeal } from '~/types'

const stats = ref<DashboardStats | null>(null)
const pendingAppeals = ref<Appeal[]>([])
const needReviewAppeals = ref<Appeal[]>([])
const drawerVisible = ref(false)
const selectedAppealId = ref('')

const { get } = useApi()

const loadData = async () => {
  try {
    stats.value = await get<DashboardStats>('/dashboard/stats')
    const pendingData = await get<any>('/appeals?status=pending&page_size=5')
    pendingAppeals.value = pendingData.data
    const reviewData = await get<any>('/appeals?status=need_review&page_size=5')
    needReviewAppeals.value = reviewData.data
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

const openAppealDrawer = (appealId: string) => {
  selectedAppealId.value = appealId
  drawerVisible.value = true
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
  loadData()
})
</script>
