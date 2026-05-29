<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { MapPin, TreePine, ArrowRightLeft, ClipboardList, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const store = useDataStore()

onMounted(() => {
  store.fetchDashboard()
})

const stats = computed(() => store.dashboardStats)
const alerts = computed(() => store.dashboardAlerts)
const activities = computed(() => store.dashboardActivities)

const statCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: '地块总数', value: stats.value.total_plots, icon: MapPin, gradient: 'from-forest-700 to-forest-600' },
    { label: '在养地块', value: stats.value.active_plots, icon: TreePine, gradient: 'from-forest-600 to-forest-500' },
    { label: '待处理调拨', value: stats.value.pending_transfers, icon: ArrowRightLeft, gradient: 'from-accent-600 to-accent-500' },
    { label: '待处理任务', value: stats.value.pending_tasks, icon: ClipboardList, gradient: 'from-forest-500 to-forest-400' },
  ]
})

const alertBorderClass = (urgency: string) => {
  if (urgency === 'red') return 'border-l-danger-600'
  if (urgency === 'amber') return 'border-l-accent-600'
  return 'border-l-status-gray'
}

const activityColor = (type: string) => {
  const map: Record<string, string> = {
    transfer: 'bg-forest-500',
    task: 'bg-blue-500',
    disease: 'bg-danger-500',
    loading: 'bg-accent-500',
    followup: 'bg-purple-500',
  }
  return map[type] || 'bg-status-gray'
}

function getInitials(name: string) {
  return name ? name.charAt(0) : '?'
}

function navigateAlert(link: string) {
  router.push(link)
}
</script>

<template>
  <div>
    <h1 class="page-title mb-6">仪表盘</h1>

    <div v-if="store.loadingDashboard" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div v-for="i in 4" :key="i" class="h-24 rounded-lg bg-gray-100 animate-pulse" />
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div
        v-for="card in statCards"
        :key="card.label"
        :class="card.gradient"
        class="rounded-lg p-4 bg-gradient-to-br text-white"
      >
        <div class="flex items-center justify-between mb-2">
          <component :is="card.icon" class="w-5 h-5 opacity-80" />
        </div>
        <div class="text-2xl font-bold">{{ card.value }}</div>
        <div class="text-xs opacity-80 mt-1">{{ card.label }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-4">
        <h2 class="section-title">待办提醒</h2>
        <div v-if="alerts.length === 0" class="text-sm text-text-muted py-4 text-center">暂无待办</div>
        <div v-else class="space-y-2">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            :class="alertBorderClass(alert.urgency)"
            class="flex items-center justify-between p-3 rounded border-l-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
            @click="navigateAlert(alert.link)"
          >
            <div>
              <div class="text-sm font-medium text-text-primary">{{ alert.title }}</div>
              <div class="text-xs text-text-muted mt-0.5">{{ alert.type }}</div>
            </div>
            <ChevronRight class="w-4 h-4 text-text-muted" />
          </div>
        </div>
      </div>

      <div class="card p-4">
        <h2 class="section-title">近期动态</h2>
        <div v-if="activities.length === 0" class="text-sm text-text-muted py-4 text-center">暂无动态</div>
        <div v-else class="space-y-3">
          <div
            v-for="activity in activities.slice(0, 15)"
            :key="activity.id"
            class="flex items-start gap-3"
          >
            <div
              :class="activityColor(activity.type)"
              class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
            >
              {{ getInitials(activity.actor) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-text-primary">{{ activity.action }}</div>
              <div class="text-xs text-text-muted">{{ activity.timestamp }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
