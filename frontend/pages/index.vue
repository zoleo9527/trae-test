<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">总览</h1>
      <p class="text-gray-500 mt-1">项目整体进度与异常概览</p>
    </div>

    <div class="grid grid-cols-6 gap-4 mb-6">
      <div class="card p-4">
        <div class="text-3xl font-bold text-gray-900">{{ stats.total_projects }}</div>
        <div class="text-sm text-gray-500 mt-1">项目总数</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-blue-600">{{ stats.in_progress_projects }}</div>
        <div class="text-sm text-gray-500 mt-1">进行中</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-amber-600">{{ stats.pending_inspections }}</div>
        <div class="text-sm text-gray-500 mt-1">待检查</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-red-600">{{ stats.exception_count }}</div>
        <div class="text-sm text-gray-500 mt-1">待处理异常</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-orange-600">{{ stats.pending_settlements }}</div>
        <div class="text-sm text-gray-500 mt-1">待结算</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-green-600">{{ formatArea(stats.total_completed_area) }}</div>
        <div class="text-sm text-gray-500 mt-1">累计完成</div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">项目进度</h2>
        <div class="space-y-4">
          <div v-for="project in projects" :key="project.id" class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-medium text-gray-900">{{ project.name }}</span>
              <span class="text-sm text-gray-500">{{ projectProgress[project.id]?.progress_percent || 0 }}%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-600 rounded-full transition-all"
                :style="{ width: `${projectProgress[project.id]?.progress_percent || 0}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>完成 {{ formatArea(projectProgress[project.id]?.completed_area || 0) }} / {{ formatArea(project.total_area) }}</span>
              <span>合格率 {{ projectProgress[project.id]?.pass_rate || 0 }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900">待处理异常</h2>
          <NuxtLink to="/progress" class="text-sm text-blue-600 hover:underline">查看全部</NuxtLink>
        </div>
        <div class="space-y-3 max-h-80 overflow-auto">
          <div
            v-for="item in exceptions"
            :key="item.id"
            class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            @click="goToException(item)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span :class="[getExceptionTypeBadge(item.type).class, 'badge']">
                    {{ getExceptionTypeBadge(item.type).text }}
                  </span>
                  <span class="text-sm font-medium text-gray-900">{{ item.project_name }}</span>
                </div>
                <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ item.description }}</p>
              </div>
              <span class="text-xs text-gray-400 whitespace-nowrap ml-2">
                {{ formatDateTime(item.created_at) }}
              </span>
            </div>
          </div>
          <div v-if="exceptions.length === 0" class="text-center py-8 text-gray-500">
            暂无待处理异常
          </div>
        </div>
      </div>
    </div>

    <div class="card p-6 mt-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">最近动态</h2>
      <div class="space-y-3">
        <div v-for="activity in activities" :key="activity.id" class="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
          <div class="w-2 h-2 rounded-full" :class="activity.type === '质量检查' ? 'bg-amber-500' : 'bg-blue-500'"></div>
          <span class="text-sm font-medium text-gray-900 w-20">{{ activity.type }}</span>
          <span class="text-sm text-gray-600 flex-1">{{ activity.title }}</span>
          <span class="text-xs text-gray-400">{{ formatDateTime(activity.time) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useAPI()
const stats = ref<any>({})
const projects = ref<any[]>([])
const exceptions = ref<any[]>([])
const activities = ref<any[]>([])
const projectProgress = ref<Record<number, any>>({})

const loadData = async () => {
  const [s, p, e, a] = await Promise.all([
    api.get('/dashboard/stats'),
    api.get('/projects'),
    api.get('/dashboard/exceptions'),
    api.get('/dashboard/recent-activities')
  ])
  stats.value = s
  projects.value = p as any[]
  exceptions.value = (e as any[]).filter((x: any) => x.status === '待处理' || x.status === '待整改' || x.status === '待解决')
  activities.value = a as any[]

  for (const project of projects.value) {
    try {
      const progress = await api.get(`/projects/${project.id}/progress`)
      projectProgress.value[project.id] = progress
    } catch (e) {
      console.error(e)
    }
  }
}

const goToException = (item: any) => {
  const router = useRouter()
  if (item.source === 'diary') {
    router.push(`/progress?diaryId=${item.source_id}`)
  } else if (item.source === 'inspection') {
    router.push(`/quality?inspectionId=${item.source_id}`)
  } else if (item.source === 'settlement') {
    router.push(`/settlement?settlementId=${item.source_id}`)
  } else if (item.source === 'delivery') {
    router.push(`/deliveries?deliveryId=${item.source_id}`)
  }
}

onMounted(() => {
  loadData()
})
</script>
