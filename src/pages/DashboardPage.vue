<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle, PackageCheck, Clock, Wallet, AlertCircle,
  ClipboardList, Eye, Guitar, Wrench, ArrowRight, ChevronDown,
  ChevronUp, School, PlusCircle, ListChecks
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { useNotificationStore } from '@/stores/notification'
import { ORDER_STATUS_LABELS, REPAIR_STATUS_LABELS } from '@/types'
import type { Order, UserRole } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import { cn } from '@/lib/utils'

const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const notificationStore = useNotificationStore()

const alertExpanded = ref(false)

const checkedOutOrders = computed(() => orderStore.filterOrdersByStatus('checked_out'))
const overdueOrders = computed(() => orderStore.overdueOrders)
const disputedOrders = computed(() => orderStore.disputedOrders)
const settlingOrders = computed(() => orderStore.settlingOrders)
const checkoutPendingOrders = computed(() => orderStore.filterOrdersByStatus('checkout_pending'))
const inspectingOrders = computed(() => orderStore.filterOrdersByStatus('inspecting'))
const returnPendingOrders = computed(() => orderStore.filterOrdersByStatus('return_pending'))

const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)
const todayEnd = new Date()
todayEnd.setHours(23, 59, 59, 999)

const todayDueOrders = computed(() =>
  orderStore.orders.filter(o => {
    const d = new Date(o.expectedReturnAt)
    return d >= todayStart && d <= todayEnd && o.status !== 'completed'
  })
)

const abnormalOrders = computed(() => orderStore.filterOrdersByStatus('abnormal'))

const schoolOrdersWithOverdue = computed(() =>
  orderStore.orders.filter(o => {
    if (!o.schoolCooperation) return false
    return o.schoolPaymentSchedule?.some(s => s.status === 'overdue')
  })
)

const repairOrders = computed(() =>
  orderStore.orders.filter(o => o.repairTask)
)

const repairPending = computed(() => repairOrders.value.filter(o => o.repairTask!.status === 'pending'))
const repairInProgress = computed(() => repairOrders.value.filter(o => o.repairTask!.status === 'in_progress'))
const repairReview = computed(() => repairOrders.value.filter(o => o.repairTask!.status === 'review'))
const repairReturned = computed(() => repairOrders.value.filter(o => o.repairTask!.status === 'returned'))

const consultantTodayTodos = computed(() => {
  const todos: Order[] = []
  todos.push(...checkoutPendingOrders.value)
  todos.push(...todayDueOrders.value)
  return todos
})

function getInstrumentName(order: Order): string {
  return orderStore.getInstrumentById(order.instrumentId)?.name || '未知'
}

function getCustomerName(order: Order): string {
  return orderStore.getCustomerById(order.customerId)?.name || '未知'
}

function getSchoolName(order: Order): string {
  return orderStore.getCustomerById(order.customerId)?.schoolName || getCustomerName(order)
}

function getOverdueAmount(order: Order): number {
  return order.schoolPaymentSchedule
    ?.filter(s => s.status === 'overdue')
    .reduce((sum, s) => sum + s.amount, 0) || 0
}

function getOverdueDays(order: Order): number {
  const overdueSchedule = order.schoolPaymentSchedule?.find(s => s.status === 'overdue')
  if (!overdueSchedule) return 0
  return Math.round((Date.now() - new Date(overdueSchedule.dueDate).getTime()) / (1000 * 60 * 60 * 24))
}

function navigateToOrder(id: string) {
  router.push(`/orders/${id}`)
}

function navigateTo(path: string) {
  router.push(path)
}

const roleBadgeMap: Record<UserRole, { label: string; class: string }> = {
  boss: { label: '门店老板', class: 'bg-amber-500/15 text-amber-400' },
  consultant: { label: '租赁顾问', class: 'bg-blue-500/15 text-blue-400' },
  repair: { label: '维修师傅', class: 'bg-emerald-500/15 text-emerald-400' },
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <div class="flex items-center gap-3 animate-fade-in">
      <h1 class="text-2xl font-semibold text-txt-primary">工作台</h1>
      <span
        v-if="authStore.currentRole"
        :class="cn('px-2.5 py-0.5 rounded-full text-xs font-medium', roleBadgeMap[authStore.currentRole].class)"
      >
        {{ roleBadgeMap[authStore.currentRole].label }}
      </span>
    </div>

    <!-- ==================== BOSS ==================== -->
    <template v-if="authStore.isBoss">
      <div
        v-if="notificationStore.highSeverityAlerts.length > 0"
        class="animate-fade-in"
      >
        <button
          @click="alertExpanded = !alertExpanded"
          class="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-left transition-colors hover:bg-red-500/15"
        >
          <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
            <AlertTriangle :size="16" class="text-red-400" />
          </div>
          <span class="text-sm font-medium text-red-300 flex-1">
            {{ notificationStore.highSeverityAlerts.length }} 条高优先级告警
          </span>
          <component :is="alertExpanded ? ChevronUp : ChevronDown" :size="18" class="text-red-400" />
        </button>
        <div v-if="alertExpanded" class="mt-2 space-y-2 animate-fade-in">
          <div
            v-for="alert in notificationStore.activeAlerts"
            :key="alert.id"
            @click="navigateToOrder(alert.orderId)"
            class="flex items-start gap-3 px-4 py-3 bg-bg-secondary rounded-lg border border-border cursor-pointer hover:border-accent/30 transition-colors"
          >
            <AlertCircle
              :size="16"
              :class="alert.severity === 'high' ? 'text-red-400 mt-0.5' : alert.severity === 'medium' ? 'text-amber-400 mt-0.5' : 'text-blue-400 mt-0.5'"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-txt-primary">{{ alert.message }}</p>
              <p class="text-xs text-txt-muted mt-1">{{ alert.orderNo }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4 animate-fade-in">
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <PackageCheck :size="18" class="text-blue-400" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-txt-primary">{{ checkedOutOrders.length }}</p>
              <p class="text-xs text-txt-muted">本月租出</p>
            </div>
          </div>
        </div>
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
              <Clock :size="18" class="text-red-400" />
            </div>
            <div>
              <p :class="cn('text-2xl font-semibold', overdueOrders.length > 0 ? 'text-red-400' : 'text-txt-primary')">
                {{ overdueOrders.length }}
              </p>
              <p class="text-xs text-txt-muted">超时未还</p>
            </div>
          </div>
        </div>
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle :size="18" class="text-amber-400" />
            </div>
            <div>
              <p :class="cn('text-2xl font-semibold', disputedOrders.length > 0 ? 'text-amber-400' : 'text-txt-primary')">
                {{ disputedOrders.length }}
              </p>
              <p class="text-xs text-txt-muted">争议订单</p>
            </div>
          </div>
        </div>
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Wallet :size="18" class="text-cyan-400" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-txt-primary">{{ settlingOrders.length }}</p>
              <p class="text-xs text-txt-muted">待结算</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-bg-secondary rounded-xl border border-border p-5 animate-fade-in">
          <h2 class="text-base font-medium text-txt-primary mb-4 flex items-center gap-2">
            <AlertCircle :size="16" class="text-red-400" />
            异常订单
          </h2>
          <div v-if="abnormalOrders.length === 0" class="text-sm text-txt-muted py-4 text-center">暂无异常订单</div>
          <div v-else class="space-y-2">
            <div
              v-for="order in abnormalOrders"
              :key="order.id"
              @click="navigateToOrder(order.id)"
              class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-tertiary/50 cursor-pointer hover:bg-bg-tertiary transition-colors"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm text-txt-primary truncate">{{ getInstrumentName(order) }}</p>
                <p class="text-xs text-txt-muted mt-0.5">{{ getCustomerName(order) }}</p>
              </div>
              <StatusBadge :status="order.status" />
            </div>
          </div>
        </div>

        <div class="bg-bg-secondary rounded-xl border border-border p-5 animate-fade-in">
          <h2 class="text-base font-medium text-txt-primary mb-4 flex items-center gap-2">
            <School :size="16" class="text-amber-400" />
            学校回款
          </h2>
          <div v-if="schoolOrdersWithOverdue.length === 0" class="text-sm text-txt-muted py-4 text-center">暂无逾期回款</div>
          <div v-else class="space-y-2">
            <div
              v-for="order in schoolOrdersWithOverdue"
              :key="order.id"
              @click="navigateToOrder(order.id)"
              class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-tertiary/50 cursor-pointer hover:bg-bg-tertiary transition-colors"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm text-txt-primary truncate">{{ getSchoolName(order) }}</p>
                <p class="text-xs text-txt-muted mt-0.5">{{ order.orderNo }}</p>
              </div>
              <div class="text-right flex-shrink-0 ml-3">
                <p class="text-sm font-medium text-red-400">¥{{ getOverdueAmount(order).toLocaleString() }}</p>
                <p class="text-xs text-txt-muted">逾期{{ getOverdueDays(order) }}天</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== CONSULTANT ==================== -->
    <template v-if="authStore.isConsultant">
      <div class="grid grid-cols-4 gap-4 animate-fade-in">
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-gray-500/15 flex items-center justify-center">
              <ClipboardList :size="18" class="text-gray-400" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-txt-primary">{{ checkoutPendingOrders.length }}</p>
              <p class="text-xs text-txt-muted">待租出</p>
            </div>
          </div>
        </div>
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <Eye :size="18" class="text-indigo-400" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-txt-primary">{{ inspectingOrders.length + returnPendingOrders.length }}</p>
              <p class="text-xs text-txt-muted">待验收</p>
            </div>
          </div>
        </div>
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Guitar :size="18" class="text-blue-400" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-txt-primary">{{ checkedOutOrders.length }}</p>
              <p class="text-xs text-txt-muted">使用中</p>
            </div>
          </div>
        </div>
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Clock :size="18" class="text-amber-400" />
            </div>
            <div>
              <p :class="cn('text-2xl font-semibold', todayDueOrders.length > 0 ? 'text-amber-400' : 'text-txt-primary')">
                {{ todayDueOrders.length }}
              </p>
              <p class="text-xs text-txt-muted">今日到期</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-bg-secondary rounded-xl border border-border p-5 animate-fade-in">
          <h2 class="text-base font-medium text-txt-primary mb-4 flex items-center gap-2">
            <ClipboardList :size="16" class="text-blue-400" />
            今日待办
          </h2>
          <div v-if="consultantTodayTodos.length === 0" class="text-sm text-txt-muted py-4 text-center">今日无待办事项</div>
          <div v-else class="space-y-2">
            <div
              v-for="order in consultantTodayTodos"
              :key="order.id"
              @click="navigateToOrder(order.id)"
              class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-tertiary/50 cursor-pointer hover:bg-bg-tertiary transition-colors"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm text-txt-primary truncate">{{ getInstrumentName(order) }}</p>
                <p class="text-xs text-txt-muted mt-0.5">{{ getCustomerName(order) }}</p>
              </div>
              <StatusBadge :status="order.status" />
            </div>
          </div>
        </div>

        <div class="bg-bg-secondary rounded-xl border border-border p-5 animate-fade-in">
          <h2 class="text-base font-medium text-txt-primary mb-4 flex items-center gap-2">
            <AlertCircle :size="16" class="text-red-400" />
            超时提醒
          </h2>
          <div v-if="overdueOrders.length === 0" class="text-sm text-txt-muted py-4 text-center">暂无超时订单</div>
          <div v-else class="space-y-2">
            <div
              v-for="order in overdueOrders"
              :key="order.id"
              class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-tertiary/50"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm text-txt-primary truncate">{{ getInstrumentName(order) }}</p>
                <p class="text-xs text-txt-muted mt-0.5">{{ getCustomerName(order) }}</p>
              </div>
              <button
                @click.stop="navigateToOrder(order.id)"
                class="flex-shrink-0 ml-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
              >
                跟进
                <ArrowRight :size="12" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3 animate-fade-in">
        <button
          @click="navigateTo('/checkout')"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-bg-primary font-medium text-sm hover:bg-accent-hover transition-colors"
        >
          <PlusCircle :size="16" />
          新建租出
        </button>
        <button
          @click="navigateTo('/return')"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-tertiary border border-border text-txt-secondary text-sm hover:border-accent/30 hover:text-txt-primary transition-colors"
        >
          <ListChecks :size="16" />
          查看待验收
        </button>
      </div>
    </template>

    <!-- ==================== REPAIR ==================== -->
    <template v-if="authStore.isRepair">
      <div class="grid grid-cols-4 gap-4 animate-fade-in">
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-gray-500/15 flex items-center justify-center">
              <ClipboardList :size="18" class="text-gray-400" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-txt-primary">{{ repairPending.length }}</p>
              <p class="text-xs text-txt-muted">待接单</p>
            </div>
          </div>
        </div>
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Wrench :size="18" class="text-purple-400" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-txt-primary">{{ repairInProgress.length }}</p>
              <p class="text-xs text-txt-muted">维修中</p>
            </div>
          </div>
        </div>
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <Eye :size="18" class="text-violet-400" />
            </div>
            <div>
              <p class="text-2xl font-semibold text-txt-primary">{{ repairReview.length }}</p>
              <p class="text-xs text-txt-muted">待复检</p>
            </div>
          </div>
        </div>
        <div class="bg-bg-secondary rounded-xl border border-border p-4 hover:border-accent/30 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <AlertCircle :size="18" class="text-orange-400" />
            </div>
            <div>
              <p :class="cn('text-2xl font-semibold', repairReturned.length > 0 ? 'text-orange-400' : 'text-txt-primary')">
                {{ repairReturned.length }}
              </p>
              <p class="text-xs text-txt-muted">已退回</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-bg-secondary rounded-xl border border-border p-5 animate-fade-in">
        <h2 class="text-base font-medium text-txt-primary mb-4 flex items-center gap-2">
          <Wrench :size="16" class="text-purple-400" />
          维修任务
        </h2>
        <div class="grid grid-cols-4 gap-4">
          <div>
            <h3 class="text-xs font-medium text-txt-muted uppercase tracking-wider mb-3">待接单</h3>
            <div v-if="repairPending.length === 0" class="text-xs text-txt-muted text-center py-4">暂无</div>
            <div v-else class="space-y-2">
              <div
                v-for="order in repairPending"
                :key="order.id"
                @click="navigateToOrder(order.id)"
                class="p-3 rounded-lg bg-bg-tertiary border border-border cursor-pointer hover:border-accent/30 transition-colors"
              >
                <p class="text-sm text-txt-primary">{{ getInstrumentName(order) }}</p>
                <p class="text-xs text-txt-muted mt-1">{{ order.repairTask!.damageCause }}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-xs font-medium text-txt-muted uppercase tracking-wider mb-3">维修中</h3>
            <div v-if="repairInProgress.length === 0" class="text-xs text-txt-muted text-center py-4">暂无</div>
            <div v-else class="space-y-2">
              <div
                v-for="order in repairInProgress"
                :key="order.id"
                @click="navigateToOrder(order.id)"
                class="p-3 rounded-lg bg-bg-tertiary border border-purple-500/20 cursor-pointer hover:border-purple-500/40 transition-colors"
              >
                <p class="text-sm text-txt-primary">{{ getInstrumentName(order) }}</p>
                <p class="text-xs text-txt-muted mt-1">{{ order.repairTask!.damageCause }}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-xs font-medium text-txt-muted uppercase tracking-wider mb-3">待复检</h3>
            <div v-if="repairReview.length === 0" class="text-xs text-txt-muted text-center py-4">暂无</div>
            <div v-else class="space-y-2">
              <div
                v-for="order in repairReview"
                :key="order.id"
                @click="navigateToOrder(order.id)"
                class="p-3 rounded-lg bg-bg-tertiary border border-violet-500/20 cursor-pointer hover:border-violet-500/40 transition-colors"
              >
                <p class="text-sm text-txt-primary">{{ getInstrumentName(order) }}</p>
                <p class="text-xs text-txt-muted mt-1">{{ order.repairTask!.damageCause }}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-xs font-medium text-txt-muted uppercase tracking-wider mb-3">已退回</h3>
            <div v-if="repairReturned.length === 0" class="text-xs text-txt-muted text-center py-4">暂无</div>
            <div v-else class="space-y-2">
              <div
                v-for="order in repairReturned"
                :key="order.id"
                @click="navigateToOrder(order.id)"
                class="p-3 rounded-lg bg-bg-tertiary border border-orange-500/20 cursor-pointer hover:border-orange-500/40 transition-colors"
              >
                <p class="text-sm text-txt-primary">{{ getInstrumentName(order) }}</p>
                <p class="text-xs text-txt-muted mt-1">{{ order.repairTask!.returnReason || order.repairTask!.damageCause }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
