<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <BaseCard hoverable class="animate-fade-in" style="animation-delay: 0.1s">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">今日订单</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">{{ dashboardStore.stats.todayOrders }}</p>
            <p class="text-xs text-forest-600 mt-2 flex items-center gap-1">
              <TrendingUp class="w-3 h-3" />
              较昨日 +2
            </p>
          </div>
          <div class="w-14 h-14 bg-gold-100 rounded-xl flex items-center justify-center">
            <ShoppingBag class="w-7 h-7 text-gold-600" />
          </div>
        </div>
      </BaseCard>

      <BaseCard hoverable class="animate-fade-in" style="animation-delay: 0.2s">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">进行中</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">{{ dashboardStore.stats.pendingOrders }}</p>
            <p class="text-xs text-gray-500 mt-2">订单正在处理</p>
          </div>
          <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock class="w-7 h-7 text-blue-600" />
          </div>
        </div>
      </BaseCard>

      <BaseCard hoverable class="animate-fade-in" style="animation-delay: 0.3s">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">异常订单</p>
            <p class="text-3xl font-bold text-coral-600 mt-1">{{ dashboardStore.stats.abnormalOrders }}</p>
            <p class="text-xs text-coral-600 mt-2 flex items-center gap-1 animate-breathe">
              <AlertTriangle class="w-3 h-3" />
              需要关注
            </p>
          </div>
          <div class="w-14 h-14 bg-coral-100 rounded-xl flex items-center justify-center">
            <AlertTriangle class="w-7 h-7 text-coral-600" />
          </div>
        </div>
      </BaseCard>

      <BaseCard gold hoverable class="animate-fade-in" style="animation-delay: 0.4s">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gold-600">完成率</p>
            <p class="text-3xl font-bold text-gold-700 mt-1">{{ dashboardStore.stats.completionRate }}%</p>
            <p class="text-xs text-gold-600 mt-2">本月累计</p>
          </div>
          <div class="w-14 h-14 bg-gold-200 rounded-xl flex items-center justify-center">
            <CheckCircle class="w-7 h-7 text-gold-600" />
          </div>
        </div>
      </BaseCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <BaseCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">订单趋势</h3>
            <div class="flex gap-4 text-sm">
              <span class="flex items-center gap-2">
                <span class="w-3 h-3 bg-gold-500 rounded-full"></span>
                新增订单
              </span>
              <span class="flex items-center gap-2">
                <span class="w-3 h-3 bg-forest-500 rounded-full"></span>
                完成订单
              </span>
            </div>
          </div>
        </template>
        <div class="h-64 flex items-end justify-between gap-2 px-4">
          <div
            v-for="(item, index) in dashboardStore.trendData"
            :key="item.date"
            class="flex-1 flex flex-col items-center gap-2"
          >
            <div class="w-full flex gap-1 items-end h-48">
              <div
                class="flex-1 bg-gradient-to-t from-gold-600 to-gold-400 rounded-t transition-all duration-500 hover:from-gold-700 hover:to-gold-500"
                :style="{ height: `${(item.orders / maxOrders) * 100}%` }"
              ></div>
              <div
                class="flex-1 bg-gradient-to-t from-forest-600 to-forest-400 rounded-t transition-all duration-500 hover:from-forest-700 hover:to-forest-500"
                :style="{ height: `${(item.completed / maxOrders) * 100}%` }"
              ></div>
            </div>
            <span class="text-xs text-gray-500">{{ item.date }}</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <h3 class="font-semibold text-gray-800">待办事项</h3>
        </template>
        <div class="space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
          <div
            v-for="todo in dashboardStore.allTodosSorted"
            :key="todo.id"
            class="flex items-start gap-3 p-3 rounded-lg hover:bg-gold-50 transition-colors cursor-pointer group"
            @click="handleTodoClick(todo)"
          >
            <div
              :class="[
                'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                todo.priority === 'high' ? 'bg-coral-500' :
                todo.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
              ]"
            ></div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 group-hover:text-gold-600 transition-colors">
                {{ todo.title }}
              </p>
              <p class="text-xs text-gray-500 mt-0.5 truncate">{{ todo.description }}</p>
              <p v-if="todo.deadline" class="text-xs text-gray-400 mt-1">
                截止: {{ formatDate(todo.deadline) }}
              </p>
            </div>
            <button
              @click.stop="completeTodo(todo.id)"
              class="opacity-0 group-hover:opacity-100 p-1 hover:bg-gold-100 rounded transition-all"
            >
              <Check class="w-4 h-4 text-forest-600" />
            </button>
          </div>
          <div v-if="dashboardStore.allTodosSorted.length === 0" class="text-center py-8 text-gray-400">
            <CheckCircle class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无待办事项</p>
          </div>
        </div>
      </BaseCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BaseCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">最近订单</h3>
            <NuxtLink to="/orders" class="text-sm text-gold-600 hover:text-gold-700">
              查看全部 →
            </NuxtLink>
          </div>
        </template>
        <div class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="flex items-center gap-4 p-3 rounded-lg hover:bg-gold-50 transition-colors cursor-pointer"
            @click="navigateTo(`/orders/${order.id}`)"
          >
            <div class="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
              <Diamond class="w-5 h-5 text-gold-600" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-800 truncate">{{ order.orderNo }}</p>
                <StatusBadge
                  :label="getOrderStatusLabel(order.status)"
                  :class="getOrderStatusClass(order.status)"
                />
              </div>
              <p class="text-xs text-gray-500">{{ order.customer.name }} · {{ getOrderTypeLabel(order.type) }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-800">{{ formatPrice(order.price.total) }}</p>
              <p class="text-xs text-gray-400">{{ formatDate(order.createdAt) }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">异常预警</h3>
            <NuxtLink to="/abnormal" class="text-sm text-gold-600 hover:text-gold-700">
              查看全部 →
            </NuxtLink>
          </div>
        </template>
        <div class="space-y-3">
          <div
            v-for="record in pendingAbnormalRecords"
            :key="record.id"
            class="flex items-start gap-3 p-3 rounded-lg border border-coral-100 bg-coral-50/50 hover:bg-coral-50 transition-colors cursor-pointer"
            @click="navigateTo('/abnormal')"
          >
            <div class="w-8 h-8 bg-coral-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle class="w-4 h-4 text-coral-600" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-800 truncate">{{ record.orderNo }}</p>
                <span :class="['status-badge text-xs', getAbnormalLevelClass(record.level)]">
                  {{ getAbnormalLevelLabel(record.level) }}
                </span>
              </div>
              <p class="text-xs text-gray-600 mt-1 line-clamp-2">{{ record.description }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ getAbnormalTypeLabel(record.type) }}</p>
            </div>
          </div>
          <div v-if="pendingAbnormalRecords.length === 0" class="text-center py-8 text-gray-400">
            <ShieldCheck class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无异常订单</p>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShoppingBag, Clock, AlertTriangle, CheckCircle, TrendingUp, Diamond, Check, ShieldCheck } from 'lucide-vue-next'
import { useDashboardStore } from '~/stores/dashboard'
import { useOrdersStore } from '~/stores/orders'
import { useAbnormalStore } from '~/stores/abnormal'
import { useFormat } from '~/composables/useFormat'
import type { TodoItem } from '~/types'

const dashboardStore = useDashboardStore()
const ordersStore = useOrdersStore()
const abnormalStore = useAbnormalStore()

const { formatDate, formatPrice, getOrderTypeLabel, getOrderStatusLabel, getOrderStatusClass, getAbnormalTypeLabel, getAbnormalLevelLabel, getAbnormalLevelClass } = useFormat()

const recentOrders = computed(() => {
  return [...ordersStore.orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
})

const pendingAbnormalRecords = computed(() => {
  return abnormalStore.pendingRecords.slice(0, 4)
})

const maxOrders = computed(() => {
  return Math.max(...dashboardStore.trendData.map(d => Math.max(d.orders, d.completed)), 1)
})

const completeTodo = (todoId: string) => {
  dashboardStore.completeTodo(todoId)
}

const handleTodoClick = (todo: TodoItem) => {
  if (todo.type === 'abnormal') {
    navigateTo('/abnormal')
  } else if (todo.relatedId) {
    navigateTo(`/orders/${todo.relatedId}`)
  }
}

onMounted(async () => {
  await ordersStore.fetchOrders()
  await abnormalStore.fetchRecords()
  await dashboardStore.fetchData(ordersStore.orders)
})
</script>
