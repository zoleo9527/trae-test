<template>
  <div>
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title">配送路线列表</div>
        <div class="list-filters">
          <select v-model="statusFilter" class="input" style="width: 140px;">
            <option value="">全部状态</option>
            <option value="pending">待出发</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
          <input
            v-model="searchQuery"
            type="text"
            class="input"
            placeholder="搜索路线..."
            style="width: 200px;"
          />
        </div>
      </div>
    </div>

    <div class="two-column">
      <div class="list-panel">
        <div class="list-header">
          <div class="card-title">路线列表</div>
          <span style="font-size: 13px; color: var(--gray-500);">
            共 {{ filteredRoutes.length }} 条路线
          </span>
        </div>
        <div class="list-items">
          <div
            v-for="route in filteredRoutes"
            :key="route.id"
            class="list-item"
            :class="{ selected: selectedRoute?.id === route.id }"
            @click="selectRoute(route)"
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
              <span class="list-item-meta-item">📦 {{ route.total_orders }} 单</span>
              <span class="list-item-meta-item">✅ {{ route.delivered_orders }}</span>
              <span class="list-item-meta-item">⏳ {{ route.pending_orders }}</span>
              <span class="list-item-meta-item" v-if="route.exception_orders > 0" style="color: var(--danger);">
                ⚠️ {{ route.exception_orders }}
              </span>
            </div>
            <div style="margin-top: 8px;">
              <div class="progress-bar">
                <div
                  class="progress-bar-fill"
                  :class="{ success: route.status === 'completed' }"
                  :style="{ width: `${route.total_orders > 0 ? (route.delivered_orders / route.total_orders) * 100 : 0}%` }"
                ></div>
              </div>
            </div>
          </div>
          <div v-if="filteredRoutes.length === 0" class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-text">暂无符合条件的路线</div>
          </div>
        </div>
      </div>

      <div class="detail-panel">
        <div v-if="selectedRoute" class="detail-header">
          <div class="detail-title">{{ selectedRoute.name }}</div>
          <div class="detail-subtitle">
            {{ selectedRoute.date }} · {{ STATUS_LABELS[selectedRoute.status] }}
          </div>
        </div>
        <div v-else class="detail-header">
          <div class="detail-title">请选择一条路线</div>
          <div class="detail-subtitle">从左侧列表选择查看详情</div>
        </div>

        <div class="detail-body">
          <div v-if="selectedRoute && routeDetail">
            <div class="detail-section">
              <div class="detail-section-title">路线信息</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-item-label">司机</div>
                  <div class="detail-item-value">{{ selectedRoute.driver_name }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">车牌号</div>
                  <div class="detail-item-value">{{ selectedRoute.vehicle_no }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">出发时间</div>
                  <div class="detail-item-value">{{ selectedRoute.start_time ? formatTime(selectedRoute.start_time) : '-' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">预计返回</div>
                  <div class="detail-item-value">{{ selectedRoute.estimated_return_time ? formatTime(selectedRoute.estimated_return_time) : '-' }}</div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">配送统计</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-item-label">订单总数</div>
                  <div class="detail-item-value">{{ selectedRoute.total_orders }} 单</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">已完成</div>
                  <div class="detail-item-value" style="color: var(--success);">{{ selectedRoute.delivered_orders }} 单</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">待配送</div>
                  <div class="detail-item-value" style="color: var(--warning);">{{ selectedRoute.pending_orders }} 单</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">异常单</div>
                  <div class="detail-item-value" style="color: var(--danger);">{{ selectedRoute.exception_orders }} 单</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">已送水桶数</div>
                  <div class="detail-item-value">{{ selectedRoute.delivered_buckets }} 桶</div>
                </div>
                <div class="detail-item">
                  <div class="detail-item-label">回收空桶</div>
                  <div class="detail-item-value">{{ selectedRoute.returned_buckets }} 个</div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">配送顺序</div>
              <div class="order-route-list">
                <div
                  v-for="(order, index) in routeDetail.orders"
                  :key="order.id"
                  class="order-route-item"
                  :style="{ opacity: order.status === 'pending' ? 0.6 : 1 }"
                >
                  <div
                    class="order-route-number"
                    :class="{
                      completed: order.status === 'delivered',
                      exception: order.status === 'exception'
                    }"
                  >
                    {{ index + 1 }}
                  </div>
                  <div class="order-route-info">
                    <div class="order-route-customer">{{ order.customer_name }}</div>
                    <div class="order-route-address">{{ order.note || '无备注' }}</div>
                  </div>
                  <div class="order-route-quantity">
                    <div class="order-route-quantity-value">{{ order.quantity }} 桶</div>
                    <div class="order-route-quantity-label">
                      <span :class="['badge', `badge-${order.is_rescheduled ? 'info' : STATUS_COLORS[order.status]}`]">
                        {{ order.is_rescheduled ? '已改约' : STATUS_LABELS[order.status] }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="height: 100%;">
            <div class="empty-state-icon">👈</div>
            <div class="empty-state-text">选择左侧路线查看详情</div>
          </div>
        </div>

        <div v-if="selectedRoute" class="detail-actions">
          <button
            v-if="selectedRoute.status === 'pending'"
            class="btn btn-success"
            @click="startRoute"
          >
            🚀 开始配送
          </button>
          <button
            v-if="selectedRoute.status === 'in_progress'"
            class="btn btn-primary"
            @click="navigateTo(`/routes/${selectedRoute.id}`)"
          >
            📋 处理订单
          </button>
          <button
            v-if="selectedRoute.status === 'in_progress' && selectedRoute.pending_orders === 0 && selectedRoute.exception_orders === 0"
            class="btn btn-success"
            @click="completeRoute"
          >
            ✅ 完成路线
          </button>
          <div
            v-else-if="selectedRoute.status === 'in_progress' && (selectedRoute.pending_orders > 0 || selectedRoute.exception_orders > 0)"
            style="font-size: 12px; color: var(--warning);"
          >
            <template v-if="selectedRoute.pending_orders > 0">⏳ 有待配送订单</template>
            <template v-if="selectedRoute.pending_orders > 0 && selectedRoute.exception_orders > 0">、</template>
            <template v-if="selectedRoute.exception_orders > 0">⚠️ 有未处理异常</template>
            ，无法完成路线
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Route, Route as RouteDetailType } from '~/types'
import { STATUS_LABELS, STATUS_COLORS } from '~/types'

definePageMeta({
  layout: 'default'
})

const config = useRuntimeConfig()

const routes = ref<Route[]>([])
const selectedRoute = ref<Route | null>(null)
const routeDetail = ref<RouteDetailType | null>(null)
const statusFilter = ref('')
const searchQuery = ref('')

const filteredRoutes = computed(() => {
  let result = [...routes.value]
  if (statusFilter.value) {
    result = result.filter(r => r.status === statusFilter.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.driver_name.toLowerCase().includes(query)
    )
  }
  return result.sort((a, b) => {
    const statusOrder = { in_progress: 0, pending: 1, completed: 2 }
    return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
  })
})

const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return timeStr
  }
}

const selectRoute = async (route: Route) => {
  selectedRoute.value = route
  try {
    routeDetail.value = await $fetch<RouteDetailType>(`${config.public.apiBase}/routes/${route.id}`)
  } catch (error) {
    console.error('加载路线详情失败:', error)
  }
}

const loadRoutes = async () => {
  try {
    routes.value = await $fetch<Route[]>(`${config.public.apiBase}/routes`)
  } catch (error) {
    console.error('加载路线列表失败:', error)
  }
}

const startRoute = async () => {
  if (!selectedRoute.value) return
  try {
    await $fetch(`${config.public.apiBase}/routes/${selectedRoute.value.id}/start`, {
      method: 'POST'
    })
    await loadRoutes()
    if (selectedRoute.value) {
      selectRoute(routes.value.find(r => r.id === selectedRoute.value!.id)!)
    }
  } catch (error) {
    console.error('开始路线失败:', error)
  }
}

const completeRoute = async () => {
  if (!selectedRoute.value) return
  if (!confirm('确定要完成这条路线吗？')) return
  try {
    await $fetch(`${config.public.apiBase}/routes/${selectedRoute.value.id}/complete`, {
      method: 'POST'
    })
    await loadRoutes()
    if (selectedRoute.value) {
      selectRoute(routes.value.find(r => r.id === selectedRoute.value!.id)!)
    }
  } catch (error: any) {
    console.error('完成路线失败:', error)
    const message = error?.data?.detail || '完成路线失败，请重试'
    alert(message)
  }
}

onMounted(() => {
  loadRoutes()
})
</script>
