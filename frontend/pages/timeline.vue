<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">状态时间轴</h1>
      <p class="text-gray-500">查看所有状态变更历史记录</p>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div v-if="timeline.length === 0" class="text-center text-gray-500 py-12">
        <div class="text-5xl mb-4">📊</div>
        <p>暂无状态变更记录</p>
      </div>
      <div v-else class="relative">
        <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div v-for="(item, index) in timeline" :key="item.id" class="relative pl-16 pb-8 last:pb-0">
          <div class="absolute left-6 w-5 h-5 rounded-full border-4 border-white"
            :class="getTimelineColor(item.new_status)">
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center space-x-2">
                <span class="text-2xl">{{ getEntityIcon(item.entity_type) }}</span>
                <span class="font-semibold text-gray-900">{{ item.title }}</span>
              </div>
              <span class="text-sm text-gray-500">{{ formatDate(item.created_at) }}</span>
            </div>
            
            <div class="flex items-center space-x-2 mb-2">
              <span :class="getStatusClass(item.old_status)" class="status-badge">{{ getStatusText(item.old_status) }}</span>
              <span class="text-gray-400">→</span>
              <span :class="getStatusClass(item.new_status)" class="status-badge">{{ getStatusText(item.new_status) }}</span>
            </div>
            
            <div class="text-sm text-gray-600 space-y-1">
              <p v-if="item.changed_by">操作人: {{ item.changed_by }}</p>
              <p v-if="item.change_reason">变更原因: {{ item.change_reason }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TimelineItem {
  id: number
  entity_type: string
  entity_id: int
  title: string
  old_status: string
  new_status: string
  changed_by: string
  change_reason: string
  created_at: string
}

const timeline = ref<TimelineItem[]>([])

const { get } = useApi()

const loadTimeline = async () => {
  timeline.value = await get<TimelineItem[]>('/timeline')
}

const getTimelineColor = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500',
    reviewing: 'bg-blue-500',
    approved: 'bg-green-500',
    completed: 'bg-green-500',
    rejected: 'bg-red-500'
  }
  return map[status] || 'bg-gray-500'
}

const getEntityIcon = (type: string) => {
  const map: Record<string, string> = {
    reception: '📋',
    settlement: '💰',
    performance: '🎭'
  }
  return map[type] || '📝'
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
    reviewing: 'status-reviewing',
    completed: 'status-completed',
    scheduled: 'status-scheduled'
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
    scheduled: '已排期'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  loadTimeline()
})
</script>
