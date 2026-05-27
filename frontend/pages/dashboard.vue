<template>
  <div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🗺️</div>
        <div class="stat-value">{{ stats.today_routes }}</div>
        <div class="stat-label">今日路线</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🚚</div>
        <div class="stat-value">{{ stats.in_progress_routes }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-value">{{ stats.today_orders }}</div>
        <div class="stat-label">今日订单</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{ stats.delivered_orders }}</div>
        <div class="stat-label">已签收</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-value">{{ stats.pending_orders }}</div>
        <div class="stat-label">待配送</div>
      </div>
      <div class="stat-card" style="cursor: pointer;" @click="navigateTo('/exceptions')">
        <div class="stat-icon">⚠️</div>
        <div class="stat-value" style="color: var(--danger);">{{ stats.pending_exceptions }}</div>
        <div class="stat-label">待处理异常</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-value" style="color: var(--info);">{{ stats.rescheduled_orders || 0 }}</div>
        <div class="stat-label">已改约订单</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💧</div>
        <div class="stat-value">{{ stats.total_buckets_delivered }}</div>
        <div class="stat-label">今日送水桶数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🪣</div>
        <div class="stat-value">{{ stats.total_buckets_returned }}</div>
        <div class="stat-label">今日回收空桶</div>
      </div>
    </div>

    <div class="two-column" style="height: auto; min-height: 500px;">
      <div class="list-panel">
        <div class="list-header">
          <div class="card-title">今日配送路线</div>
          <button class="btn btn-primary btn-sm" @click="navigateTo('/routes')">
            查看全部
          </button>
        </div>
        <div class="list-items">
          <div
            v-for="route in todayRoutes"
            :key="route.id"
            class="list-item"
            @click="navigateTo(`/routes/${route.id}`)"
          >
            <div class="list-item-title">
              <span>{{ route.name }}</span>
              <span :class="['badge', `badge-${STATUS_COLORS[route.status]}`]">
                {{ STATUS_LABELS[route.status] }}
              </span>
            </div>
            <div class="list-item-subtitle">
              司机：{{ route.driver_name }} · 车辆：{{ route.vehicle_no }}
            </div>
            <div class="list-item-meta">
              <span class="list-item-meta-item">
                📦 {{ route.total_orders }} 单
              </span>
              <span class="list-item-meta-item">
                ✅ {{ route.delivered_orders }} 已送
              </span>
              <span class="list-item-meta-item">
                ⏳ {{ route.pending_orders }} 待送
              </span>
              <span class="list-item-meta-item" v-if="route.exception_orders > 0" style="color: var(--danger);">
                ⚠️ {{ route.exception_orders }} 异常
              </span>
            </div>
            <div style="margin-top: 10px;">
              <div class="progress-bar">
                <div
                  class="progress-bar-fill"
                  :class="{ success: route.status === 'completed' }"
                  :style="{ width: `${(route.delivered_orders / route.total_orders) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
          <div v-if="todayRoutes.length === 0" class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-text">今日暂无配送路线</div>
          </div>
        </div>
      </div>

      <div class="list-panel">
        <div class="list-header">
          <div class="card-title">待处理异常</div>
          <button class="btn btn-primary btn-sm" @click="navigateTo('/exceptions')">
            处理异常
          </button>
        </div>
        <div class="list-items">
          <div
            v-for="exc in pendingExceptions"
            :key="exc.id"
            class="list-item"
            @click="navigateTo('/exceptions')"
          >
            <div class="list-item-title">
              <span>{{ exc.title }}</span>
              <span class="badge badge-danger">{{ EXCEPTION_TYPES[exc.type] || exc.type }}</span>
            </div>
            <div class="list-item-subtitle">
              订单：{{ exc.order_id }} · 上报：{{ exc.reported_by }}
            </div>
            <div class="list-item-subtitle" style="color: var(--gray-600);">
              {{ exc.description }}
            </div>
            <div class="list-item-meta">
              <span class="list-item-meta-item">
                🕐 {{ formatTime(exc.reported_at) }}
              </span>
            </div>
          </div>
          <div v-if="pendingExceptions.length === 0" class="empty-state">
            <div class="empty-state-icon">✨</div>
            <div class="empty-state-text">暂无待处理异常</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Route, ExceptionReport, DashboardStats } from '~/types'
import { STATUS_LABELS, STATUS_COLORS, EXCEPTION_TYPES } from '~/types'

definePageMeta({
  layout: 'default'
})

const config = useRuntimeConfig()

const stats = ref<DashboardStats>({
  today_routes: 0,
  in_progress_routes: 0,
  today_orders: 0,
  delivered_orders: 0,
  pending_orders: 0,
  exception_orders: 0,
  rescheduled_orders: 0,
  total_buckets_delivered: 0,
  total_buckets_returned: 0,
  pending_exceptions: 0
})

const todayRoutes = ref<Route[]>([])
const pendingExceptions = ref<ExceptionReport[]>([])

const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return timeStr
  }
}

const loadData = async () => {
  try {
    const [statsData, routesData, exceptionsData] = await Promise.all([
      $fetch<DashboardStats>(`${config.public.apiBase}/dashboard/stats`),
      $fetch<Route[]>(`${config.public.apiBase}/routes?date=${new Date().toISOString().split('T')[0]}`),
      $fetch<ExceptionReport[]>(`${config.public.apiBase}/exceptions?status=pending`)
    ])
    stats.value = statsData
    todayRoutes.value = routesData
    pendingExceptions.value = exceptionsData
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>
