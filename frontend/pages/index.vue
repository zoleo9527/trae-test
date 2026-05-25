<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
      <p class="text-gray-500">欢迎使用地方剧院管理系统 - 实时查看业务状态</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500 hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/receptions?status=pending')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">待处理接待</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.pending_receptions || 0 }}</p>
          </div>
          <div class="text-4xl">📋</div>
        </div>
        <p class="text-xs text-gray-400 mt-2">点击查看详情</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/settlements?status=pending')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">待结算审批</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.pending_settlements || 0 }}</p>
          </div>
          <div class="text-4xl">💰</div>
        </div>
        <p class="text-xs text-gray-400 mt-2">点击查看详情</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/settlements?status=rejected')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">已驳回结算</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.rejected_settlements || 0 }}</p>
          </div>
          <div class="text-4xl">❌</div>
        </div>
        <p class="text-xs text-gray-400 mt-2">需回查处理</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500 hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/settlements?status=reviewing')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">需回查结算</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.need_review || 0 }}</p>
          </div>
          <div class="text-4xl">🔍</div>
        </div>
        <p class="text-xs text-gray-400 mt-2">审核中待处理</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">今日演出</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.today_performances || 0 }}</p>
          </div>
          <div class="text-3xl">🎭</div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">本月票房</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">¥{{ (stats?.this_month_revenue || 0).toLocaleString() }}</p>
          </div>
          <div class="text-3xl">📈</div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-cyan-500 hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/tickets?status=refund_pending')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">待退改审批</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.pending_refunds || 0 }}</p>
          </div>
          <div class="text-3xl">🎫</div>
        </div>
        <p class="text-xs text-gray-400 mt-2">点击查看详情</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-rose-500 hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/tickets?status=refund_rejected')">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">已驳回退票</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats?.rejected_refunds || 0 }}</p>
          </div>
          <div class="text-3xl">🚫</div>
        </div>
        <p class="text-xs text-gray-400 mt-2">需回查处理</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">状态时间轴</h3>
          <button @click="navigateTo('/timeline')" class="text-sm text-indigo-600 hover:text-indigo-800">查看全部 →</button>
        </div>
        <div class="p-6">
          <div v-if="recentHistory.length === 0" class="text-center text-gray-500 py-8">
            <div class="text-5xl mb-4">📊</div>
            <p>暂无状态变更记录</p>
          </div>
          <div v-else class="relative">
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div v-for="item in recentHistory.slice(0, 8)" :key="item.id" class="relative pl-12 pb-6 last:pb-0">
              <div class="absolute left-2 w-5 h-5 rounded-full border-4 border-white shadow"
                :class="getTimelineColor(item.new_status, item.entity_type)">
              </div>
              <div class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div class="flex justify-between items-start">
                  <div class="flex items-center space-x-2">
                    <span>{{ getEntityIcon(item.entity_type) }}</span>
                    <span class="font-medium text-gray-900 text-sm">{{ item.title }}</span>
                  </div>
                  <span class="text-xs text-gray-400">{{ formatDate(item.created_at) }}</span>
                </div>
                <div class="flex items-center space-x-2 mt-2">
                  <template v-if="item.entity_type === 'performance' && (item.title === '演出时间变更' || item.title === '演出场地变更')">
                    <span class="text-xs text-gray-600">{{ item.title === '演出时间变更' ? '原时间' : '原场地' }}:</span>
                    <span class="text-xs font-medium text-gray-900 bg-gray-200 px-2 py-0.5 rounded">{{ item.old_status }}</span>
                    <span class="text-gray-400">→</span>
                    <span class="text-xs font-medium text-gray-900 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{{ item.new_status }}</span>
                  </template>
                  <template v-else-if="item.entity_type === 'reception_field' || item.entity_type === 'settlement_field'">
                    <span class="text-xs text-gray-600">原值:</span>
                    <span class="text-xs font-medium text-gray-900 bg-gray-200 px-2 py-0.5 rounded">{{ item.old_status }}</span>
                    <span class="text-gray-400">→</span>
                    <span class="text-xs font-medium text-gray-900 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{{ item.new_status }}</span>
                  </template>
                  <template v-else>
                    <span :class="getStatusClass(item.old_status)" class="status-badge text-xs">{{ getStatusText(item.old_status) }}</span>
                    <span class="text-gray-400">→</span>
                    <span :class="getStatusClass(item.new_status)" class="status-badge text-xs">{{ getStatusText(item.new_status) }}</span>
                  </template>
                </div>
                <p v-if="item.change_reason" class="text-xs text-gray-500 mt-2">{{ item.change_reason }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">即将上演</h3>
          <button @click="navigateTo('/performances')" class="text-sm text-indigo-600 hover:text-indigo-800">管理演出 →</button>
        </div>
        <div class="p-6">
          <div v-if="upcomingPerformances.length === 0" class="text-center text-gray-500 py-8">
            <div class="text-5xl mb-4">🎭</div>
            <p>暂无即将上演的演出</p>
            <button @click="navigateTo('/performances')" class="mt-4 text-indigo-600 hover:text-indigo-800 text-sm">+ 添加演出</button>
          </div>
          <div v-else class="space-y-3">
            <div v-for="perf in upcomingPerformances.slice(0, 5)" :key="perf.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div class="flex-1">
                <p class="font-medium text-gray-900">{{ perf.name }}</p>
                <p class="text-sm text-gray-500">{{ perf.troupe }} · {{ perf.venue }}</p>
              </div>
              <div class="text-right ml-4">
                <p class="text-sm font-medium text-gray-900">{{ formatDateTime(perf.start_time) }}</p>
                <span :class="getStatusClass(perf.status)" class="status-badge inline-block mt-1">{{ getStatusText(perf.status) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">快捷操作</h3>
      </div>
      <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button @click="navigateTo('/performances')" class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center">
          <div class="text-3xl mb-2">➕</div>
          <p class="text-sm font-medium text-gray-700">新增演出</p>
        </button>
        <button @click="navigateTo('/receptions')" class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center">
          <div class="text-3xl mb-2">📋</div>
          <p class="text-sm font-medium text-gray-700">管理接待</p>
        </button>
        <button @click="navigateTo('/settlements')" class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center">
          <div class="text-3xl mb-2">💰</div>
          <p class="text-sm font-medium text-gray-700">费用结算</p>
        </button>
        <button @click="navigateTo('/tickets')" class="p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center">
          <div class="text-3xl mb-2">🎫</div>
          <p class="text-sm font-medium text-gray-700">票务管理</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Stats {
  pending_receptions: number
  pending_settlements: number
  rejected_settlements: number
  need_review: number
  today_performances: number
  this_month_revenue: number
  pending_refunds: number
  rejected_refunds: number
}

interface Performance {
  id: number
  name: string
  troupe: string
  venue: string
  start_time: string
  status: string
}

interface TimelineItem {
  id: number
  entity_type: string
  title: string
  old_status: string
  new_status: string
  changed_by?: string
  change_reason?: string
  created_at: string
}

const stats = ref<Stats | null>(null)
const upcomingPerformances = ref<Performance[]>([])
const recentHistory = ref<TimelineItem[]>([])

const { get } = useApi()
const router = useRouter()

const loadData = async () => {
  try {
    const [statsData, perfData, historyData] = await Promise.all([
      get<Stats>('/dashboard/stats'),
      get<Performance[]>('/performances'),
      get<TimelineItem[]>('/timeline')
    ])
    stats.value = statsData
    upcomingPerformances.value = perfData
    recentHistory.value = historyData
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

const navigateTo = (path: string) => {
  router.push(path)
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
    reviewing: 'status-reviewing',
    completed: 'status-completed',
    scheduled: 'status-scheduled',
    refund_pending: 'status-pending',
    refund_rejected: 'status-rejected',
    refunded: 'status-completed',
    confirmed: 'status-approved',
    none: 'status-completed',
    deleted: 'status-rejected'
  }
  return `status-badge ${map[status] || 'status-pending'}`
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已驳回',
    reviewing: '审核中',
    completed: '已完成',
    scheduled: '已排期',
    refund_pending: '待退票',
    refund_rejected: '退票驳回',
    refunded: '已退票',
    confirmed: '已确认',
    none: '无',
    deleted: '已删除'
  }
  return map[status] || status
}

const getTimelineColor = (status: string, entity_type?: string) => {
  if (entity_type === 'reception_field' || entity_type === 'settlement_field') {
    return 'bg-indigo-500'
  }
  const map: Record<string, string> = {
    pending: 'bg-yellow-500',
    reviewing: 'bg-blue-500',
    approved: 'bg-green-500',
    completed: 'bg-green-500',
    scheduled: 'bg-purple-500',
    rejected: 'bg-red-500',
    refund_pending: 'bg-yellow-500',
    refund_rejected: 'bg-red-500',
    refunded: 'bg-gray-500',
    confirmed: 'bg-green-500',
    deleted: 'bg-gray-500'
  }
  return map[status] || 'bg-gray-400'
}

const getEntityIcon = (type: string) => {
  const map: Record<string, string> = {
    reception: '📋',
    reception_field: '✏️',
    settlement: '💰',
    settlement_field: '✏️',
    performance: '🎭',
    ticket: '🎫'
  }
  return map[type] || '📝'
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

const formatDateTime = (dateStr: string) => {
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
