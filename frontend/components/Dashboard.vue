<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">仪表总览</h2>
      <p class="text-gray-500">欢迎回来，今天也要加油哦！</p>
    </div>
    
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">今日新增</p>
            <p class="text-3xl font-bold text-gray-800">{{ stats?.today_new || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📦</div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">进行中</p>
            <p class="text-3xl font-bold text-gray-800">{{ (stats?.by_step?.developing || 0) + (stats?.by_step?.scanning || 0) }}</p>
          </div>
          <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">⚙️</div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">待处理异常</p>
            <p class="text-3xl font-bold text-red-500">{{ stats?.pending_exceptions || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">⚠️</div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">返工中</p>
            <p class="text-3xl font-bold text-orange-500">{{ stats?.pending_rework || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">🔄</div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-5 shadow-sm">
        <h3 class="font-bold text-gray-800 mb-4">工序进度</h3>
        <div class="space-y-4">
          <div v-for="(item, index) in steps" :key="index" class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="item.bg">
              <span>{{ item.icon }}</span>
            </div>
            <div class="flex-1">
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-700">{{ item.name }}</span>
                <span class="text-sm text-gray-500">{{ item.count }} 卷</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="h-2 rounded-full transition-all" :class="item.color" :style="{ width: `${item.percent }%" }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 shadow-sm">
        <h3 class="font-bold text-gray-800 mb-4">最近动态</h3>
        <div class="space-y-3 max-h-64 overflow-auto">
          <div v-for="event in recentEvents" :key="event.timestamp" class="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
            <div class="w-2 h-2 mt-2 rounded-full" :class="getEventColor(event.action)"></div>
            <div class="flex-1">
              <div class="flex justify-between">
                <span class="text-sm font-medium text-gray-700">{{ event.action }}</span>
                <span class="text-xs text-gray-400">{{ formatTime(event.timestamp) }}</span>
              </div>
              <p class="text-xs text-gray-500">{{ event.registration_number }} - {{ event.description }}</p>
            </div>
          </div>
          <div v-if="recentEvents.length === 0" class="text-center text-gray-400 py-4">暂无动态</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { token } = useAuth()
const config = useRuntimeConfig()

const stats = ref<any>(null)
const recentEvents = ref<any[]>([])

const steps = computed(() => {
  if (!stats.value) return []
  const total = stats.value.by_step || {}
  const all = [
    { name: '已登记', count: total.registered || 0, color: 'bg-gray-400', bg: 'bg-gray-100', icon: '📝' },
    { name: '冲洗中', count: total.developing || 0, color: 'bg-blue-500', bg: 'bg-blue-100', icon: '🧪' },
    { name: '扫描中', count: total.scanning || 0, color: 'bg-amber-500', bg: 'bg-amber-100', icon: '📸' },
    { name: '质检中', count: total.quality_check || 0, color: 'bg-purple-500', bg: 'bg-purple-100', icon: '✅' },
    { name: '已完成', count: total.completed || 0, color: 'bg-green-500', bg: 'bg-green-100', icon: '🎉' }
  ]
  const maxCount = Math.max(...all.map(s => s.count), 1)
  return all.map(s => ({ ...s, percent: (s.count / maxCount * 100) }))
})

const getEventColor = (action: string) => {
  if (action.includes('异常')) return 'bg-red-500'
  if (action.includes('返工')) return 'bg-orange-500'
  if (action.includes('完成')) return 'bg-green-500'
  return 'bg-blue-500'
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

const loadData = async () => {
  try {
    const [statsData, timelineData] = await Promise.all([
      $fetch(`${config.public.apiBase}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token.value}` }
      }),
      $fetch(`${config.public.apiBase}/api/dashboard/timeline`, {
        headers: { Authorization: `Bearer ${token.value}` }
      })
    ])
    stats.value = statsData
    recentEvents.value = (timelineData as any).events || []
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

onMounted(() => {
  loadData()
})
</script>
