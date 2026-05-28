<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useOrderStore } from '@/stores/order'
import type { Exception, Order } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'
import { 
  TrendingUp, 
  Package, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  ChevronRight,
  Eye
} from 'lucide-vue-next'

const userStore = useUserStore()
const orderStore = useOrderStore()
const router = useRouter()

const drawerVisible = ref(false)
const selectedException = ref<Exception | null>(null)

const stats = computed(() => {
  const orders = orderStore.ordersForCurrentUser
  const role = userStore.currentUser.role
  
  if (role === 'business') {
    return [
      { label: '订单总数', value: orders.length, icon: Package, color: 'text-blue-500 bg-blue-50' },
      { label: '进行中', value: orders.filter(o => !['completed'].includes(o.status)).length, icon: Clock, color: 'text-amber-500 bg-amber-50' },
      { label: '异常待处理', value: orderStore.pendingExceptions.length, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
      { label: '本月完成', value: orders.filter(o => o.status === 'completed').length, icon: CheckCircle, color: 'text-green-500 bg-green-50' }
    ]
  } else if (role === 'sampling') {
    return [
      { label: '跟单总数', value: orders.length, icon: Package, color: 'text-blue-500 bg-blue-50' },
      { label: '打样中', value: orders.filter(o => ['sampling', 'sample_confirmed'].includes(o.status)).length, icon: Clock, color: 'text-amber-500 bg-amber-50' },
      { label: '版本锁定', value: orders.filter(o => o.status === 'version_locked').length, icon: CheckCircle, color: 'text-green-500 bg-green-50' },
      { label: '版本变更待处理', value: orderStore.pendingExceptions.filter(e => e.type === 'version_overwrite').length, icon: AlertTriangle, color: 'text-red-500 bg-red-50' }
    ]
  } else {
    return [
      { label: '仓配订单', value: orders.length, icon: Package, color: 'text-blue-500 bg-blue-50' },
      { label: '待排期', value: orders.filter(o => o.status === 'version_locked').length, icon: Clock, color: 'text-amber-500 bg-amber-50' },
      { label: '发货中', value: orders.filter(o => ['producing', 'qc_passed', 'shipping'].includes(o.status)).length, icon: TrendingUp, color: 'text-cyan-500 bg-cyan-50' },
      { label: '漏件待处理', value: orderStore.pendingExceptions.filter(e => e.type === 'shipment_missing').length, icon: AlertTriangle, color: 'text-red-500 bg-red-50' }
    ]
  }
})

const todoItems = computed(() => {
  const orders = orderStore.ordersForCurrentUser
  const role = userStore.currentUser.role
  const todos: Array<{ id: string; title: string; orderNo: string; orderId: string; type: string }> = []
  
  if (role === 'sampling') {
    orders.filter(o => o.status === 'sampling').forEach(o => {
      todos.push({
        id: `todo_${o.id}_sample`,
        title: '待确认样品',
        orderNo: o.orderNo,
        orderId: o.id,
        type: 'sample'
      })
    })
  }
  
  if (role === 'warehouse') {
    orders.filter(o => o.status === 'version_locked').forEach(o => {
      todos.push({
        id: `todo_${o.id}_schedule`,
        title: '待安排排期',
        orderNo: o.orderNo,
        orderId: o.id,
        type: 'schedule'
      })
    })
  }
  
  if (role === 'warehouse') {
    orders.filter(o => ['scheduled', 'producing', 'qc_passed'].includes(o.status)).forEach(o => {
      if (!o.shipments.length || o.shipments.every(s => s.status !== 'shipped')) {
        todos.push({
          id: `todo_${o.id}_ship`,
          title: '待发货操作',
          orderNo: o.orderNo,
          orderId: o.id,
          type: 'ship'
        })
      }
    })
  }
  
  if (role === 'business') {
    orderStore.pendingExceptions.filter(e => e.type === 'refund_required' && e.refundChain?.approvalStatus === 'pending').forEach(e => {
      const order = orderStore.getOrderById(e.orderId)
      if (order) {
        todos.push({
          id: `todo_${e.id}_refund`,
          title: '待审批退款',
          orderNo: order.orderNo,
          orderId: order.id,
          type: 'refund'
        })
      }
    })
  }
  
  return todos
})

const openException = (exception: Exception) => {
  selectedException.value = exception
  drawerVisible.value = true
}

const goToOrder = (orderId: string) => {
  router.push(`/order/${orderId}`)
}
</script>

<template>
  <div class="space-y-6 animate-fade-in-up">
    <div class="grid grid-cols-4 gap-4">
      <div 
        v-for="stat in stats" 
        :key="stat.label"
        class="card"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">{{ stat.label }}</p>
            <p class="text-3xl font-bold text-gray-800">{{ stat.value }}</p>
          </div>
          <div :class="['p-3 rounded-xl', stat.color]">
            <component :is="stat.icon" class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 space-y-4">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle class="w-5 h-5 text-accent" />
              异常预警
            </h2>
            <span class="text-sm text-gray-500">
              共 {{ orderStore.pendingExceptions.length }} 条待处理
            </span>
          </div>
          
          <div class="space-y-3" v-if="orderStore.pendingExceptions.length > 0">
            <div 
              v-for="exception in orderStore.pendingExceptions" 
              :key="exception.id"
              class="flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:bg-gray-50"
              :class="exception.severity === 'critical' ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'"
              @click="openException(exception)"
            >
              <div 
                class="w-1.5 h-12 rounded-full flex-shrink-0"
                :class="exception.severity === 'critical' ? 'bg-red-500 animate-pulse-slow' : 'bg-amber-500'"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <StatusBadge type="severity" :status="exception.severity" />
                  <span class="text-xs text-gray-500">
                    {{ orderStore.getOrderById(exception.orderId)?.orderNo }}
                  </span>
                </div>
                <p class="text-sm text-gray-700 truncate">{{ exception.description }}</p>
              </div>
              <ChevronRight class="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
          
          <div v-else class="text-center py-8 text-gray-500">
            <CheckCircle class="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>暂无异常，一切正常</p>
          </div>
        </div>

        <div class="card">
          <h2 class="font-semibold text-gray-800 mb-4">订单列表</h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th class="pb-3 font-medium">订单号</th>
                  <th class="pb-3 font-medium">客户</th>
                  <th class="pb-3 font-medium">产品</th>
                  <th class="pb-3 font-medium">状态</th>
                  <th class="pb-3 font-medium">负责人</th>
                  <th class="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="order in orderStore.ordersForCurrentUser" 
                  :key="order.id"
                  class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td class="py-3 text-sm font-medium text-gray-800">{{ order.orderNo }}</td>
                  <td class="py-3 text-sm text-gray-600">{{ order.clientName }}</td>
                  <td class="py-3 text-sm text-gray-600">{{ order.productName }}</td>
                  <td class="py-3">
                    <StatusBadge type="order" :status="order.status" />
                  </td>
                  <td class="py-3 text-sm text-gray-600">{{ order.assignee }}</td>
                  <td class="py-3 text-right">
                    <button 
                      @click="goToOrder(order.id)"
                      class="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-light transition-colors"
                    >
                      <Eye class="w-4 h-4" />
                      查看
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="card">
          <h2 class="font-semibold text-gray-800 mb-4">待办队列</h2>
          <div class="space-y-3" v-if="todoItems.length > 0">
            <div 
              v-for="item in todoItems" 
              :key="item.id"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all"
              @click="goToOrder(item.orderId)"
            >
              <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock class="w-4 h-4 text-amber-600" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">{{ item.title }}</p>
                <p class="text-xs text-gray-500">{{ item.orderNo }}</p>
              </div>
              <ChevronRight class="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div v-else class="text-center py-6 text-gray-500">
            <CheckCircle class="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p class="text-sm">暂无待办事项</p>
          </div>
        </div>

        <div class="card">
          <h2 class="font-semibold text-gray-800 mb-4">角色视角说明</h2>
          <div class="space-y-3">
            <div class="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p class="text-sm font-medium text-blue-700 mb-1">项目商务</p>
              <p class="text-xs text-blue-600">查看全部订单进度、处理退款审批、异常总览</p>
            </div>
            <div class="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <p class="text-sm font-medium text-amber-700 mb-1">打样跟单</p>
              <p class="text-xs text-amber-600">样品确认、版本锁定、处理版本变更异常</p>
            </div>
            <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <p class="text-sm font-medium text-emerald-700 mb-1">仓配协调</p>
              <p class="text-xs text-emerald-600">量产排期、发货管理、处理漏件异常</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ExceptionDrawer 
      :visible="drawerVisible" 
      :exception="selectedException"
      @close="drawerVisible = false"
    />
  </div>
</template>
