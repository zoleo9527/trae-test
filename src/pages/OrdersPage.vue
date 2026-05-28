<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, Filter, ChevronDown, Clock, AlertTriangle, Package,
  GitBranch, Circle, CheckCircle2, AlertCircle, Wrench, Wallet, User
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { ORDER_STATUS_LABELS, ORDER_STATUS_DOT_COLORS } from '@/types'
import type { Order, OrderStatus, UserRole } from '@/types'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const searchQuery = ref('')
const statusFilter = ref<OrderStatus | 'all'>('all')
const filterExpanded = ref(false)

const statusFilters: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部订单' },
  { value: 'checkout_pending', label: '待租出' },
  { value: 'checked_out', label: '已租出' },
  { value: 'overdue', label: '超时未还' },
  { value: 'return_pending', label: '待归还' },
  { value: 'inspecting', label: '验收中' },
  { value: 'damage_assessing', label: '损坏判定中' },
  { value: 'repairing', label: '维修中' },
  { value: 'repair_reviewing', label: '维修复检中' },
  { value: 'settling', label: '结算中' },
  { value: 'disputed', label: '争议中' },
  { value: 'completed', label: '已完成' },
]

const filteredOrders = computed(() => {
  let orders = orderStore.orders
  if (searchQuery.value) {
    orders = orderStore.searchOrders(searchQuery.value)
  }
  if (statusFilter.value !== 'all') {
    orders = orders.filter(o => o.status === statusFilter.value)
  }
  return orders.sort((a, b) => new Date(b.checkoutAt).getTime() - new Date(a.checkoutAt).getTime())
})

const orderStats = computed(() => ({
  total: orderStore.orders.length,
  active: orderStore.activeOrders.length,
  overdue: orderStore.overdueOrders.length,
  disputed: orderStore.disputedOrders.length,
}))

function getInstrumentName(order: Order): string {
  return orderStore.getInstrumentById(order.instrumentId)?.name || '未知'
}

function getCustomerName(order: Order): string {
  return orderStore.getCustomerById(order.customerId)?.name || '未知'
}

function getOrderTimeline(order: Order): Array<{ status: string; label: string; active: boolean; current: boolean; special?: string }> {
  const fullTimeline = [
    { status: 'checkout_pending', label: '待租出' },
    { status: 'checked_out', label: '已租出' },
    { status: 'inspecting', label: '验收中' },
    { status: 'damage_assessing', label: '损坏判定' },
    { status: 'repairing', label: '维修中' },
    { status: 'settling', label: '结算中' },
    { status: 'completed', label: '已完成' },
  ]

  const statusToTimelineStage: Record<string, number> = {
    'checkout_pending': 0,
    'checked_out': 1,
    'overdue': 1,
    'return_pending': 1,
    'inspecting': 2,
    'damage_assessing': 3,
    'repairing': 4,
    'repair_reviewing': 4,
    'disputed': 3,
    'settling': 5,
    'completed': 6,
  }

  const currentStage = statusToTimelineStage[order.status] ?? 6

  return fullTimeline.map((t, idx) => {
    let special: string | undefined
    if (t.status === 'checked_out' && order.status === 'overdue') {
      special = 'overdue'
    } else if (t.status === 'damage_assessing' && order.status === 'disputed') {
      special = 'disputed'
    } else if (t.status === 'repairing' && order.status === 'repair_reviewing') {
      special = 'reviewing'
    }

    return {
      ...t,
      active: idx <= currentStage,
      current: t.status === order.status ||
        (t.status === 'checked_out' && ['overdue', 'return_pending'].includes(order.status)) ||
        (t.status === 'repairing' && ['repairing', 'repair_reviewing'].includes(order.status)) ||
        (t.status === 'damage_assessing' && order.status === 'disputed'),
      special,
    }
  })
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
    <div class="flex items-center justify-between animate-fade-in">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold text-txt-primary">订单链路</h1>
        <span
          v-if="authStore.currentRole"
          :class="cn('px-2.5 py-0.5 rounded-full text-xs font-medium', roleBadgeMap[authStore.currentRole].class)"
        >
          {{ roleBadgeMap[authStore.currentRole].label }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="authStore.isConsultant || authStore.isBoss"
          @click="navigateTo('/checkout')"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-primary font-medium text-sm hover:bg-accent-hover transition-colors"
        >
          <Package :size="16" />
          新建租出
        </button>
        <button
          v-if="authStore.isConsultant || authStore.isBoss"
          @click="navigateTo('/return')"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-tertiary border border-border text-txt-secondary text-sm hover:border-accent/30 hover:text-txt-primary transition-colors"
        >
          <CheckCircle2 :size="16" />
          归还验收
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4 animate-fade-in">
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gray-500/15 flex items-center justify-center">
            <GitBranch :size="18" class="text-gray-400" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-txt-primary">{{ orderStats.total }}</p>
            <p class="text-xs text-txt-muted">全部订单</p>
          </div>
        </div>
      </div>
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Package :size="18" class="text-blue-400" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-txt-primary">{{ orderStats.active }}</p>
            <p class="text-xs text-txt-muted">进行中</p>
          </div>
        </div>
      </div>
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center">
            <Clock :size="18" class="text-red-400" />
          </div>
          <div>
            <p :class="cn('text-2xl font-semibold', orderStats.overdue > 0 ? 'text-red-400' : 'text-txt-primary')">
              {{ orderStats.overdue }}
            </p>
            <p class="text-xs text-txt-muted">超时未还</p>
          </div>
        </div>
      </div>
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle :size="18" class="text-amber-400" />
          </div>
          <div>
            <p :class="cn('text-2xl font-semibold', orderStats.disputed > 0 ? 'text-amber-400' : 'text-txt-primary')">
              {{ orderStats.disputed }}
            </p>
            <p class="text-xs text-txt-muted">争议订单</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-4 animate-fade-in">
      <div class="relative flex-1">
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索订单号、乐器、客户..."
          class="w-full pl-9 pr-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>
      <div class="relative">
        <button
          @click="filterExpanded = !filterExpanded"
          class="flex items-center gap-2 px-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-txt-secondary hover:border-accent/30 hover:text-txt-primary transition-colors"
        >
          <Filter :size="16" />
          {{ statusFilters.find(f => f.value === statusFilter)?.label }}
          <ChevronDown :size="14" :class="cn('transition-transform', filterExpanded && 'rotate-180')" />
        </button>
        <div
          v-if="filterExpanded"
          class="absolute top-full mt-2 right-0 w-48 bg-bg-secondary border border-border rounded-xl shadow-lg overflow-hidden z-10 animate-fade-in"
        >
          <div
            v-for="filter in statusFilters"
            :key="filter.value"
            @click="statusFilter = filter.value; filterExpanded = false"
            :class="cn(
              'px-4 py-2.5 text-sm cursor-pointer transition-colors',
              statusFilter === filter.value ? 'bg-accent/10 text-accent' : 'text-txt-secondary hover:bg-bg-tertiary hover:text-txt-primary'
            )"
          >
            {{ filter.label }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredOrders.length === 0" class="text-center py-16 animate-fade-in">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-tertiary flex items-center justify-center">
        <Package :size="24" class="text-txt-muted" />
      </div>
      <p class="text-txt-muted">暂无订单</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        @click="navigateToOrder(order.id)"
        class="bg-bg-secondary rounded-xl border border-border p-5 cursor-pointer hover:border-accent/30 transition-all animate-fade-in"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-txt-primary">{{ order.orderNo }}</span>
                <StatusBadge :status="order.status" />
                <span v-if="order.schoolCooperation" class="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-xs">
                  学校合作
                </span>
              </div>
              <div class="flex items-center gap-4 mt-1.5 text-sm text-txt-muted">
                <span>{{ getInstrumentName(order) }}</span>
                <span class="flex items-center gap-1">
                  <User :size="12" />
                  {{ getCustomerName(order) }}
                </span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-txt-primary">押金 ¥{{ order.depositAmount.toLocaleString() }}</p>
            <p class="text-xs text-txt-muted mt-0.5">
              {{ new Date(order.checkoutAt).toLocaleDateString() }} → {{ new Date(order.expectedReturnAt).toLocaleDateString() }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div
            v-for="(step, idx) in getOrderTimeline(order)"
            :key="step.status"
            class="flex items-center relative"
          >
            <div
              :class="cn(
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                step.special === 'overdue'
                  ? 'bg-red-500 ring-4 ring-red-500/20'
                  : step.special === 'disputed'
                    ? 'bg-amber-500 ring-4 ring-amber-500/20'
                    : step.special === 'reviewing'
                      ? 'bg-violet-500 ring-4 ring-violet-500/20'
                      : step.current
                        ? 'bg-accent ring-4 ring-accent/20'
                        : step.active
                          ? 'bg-emerald-500'
                          : 'bg-bg-tertiary'
              )"
            >
              <component
                :is="step.active ? CheckCircle2 : Circle"
                :size="12"
                :class="step.active ? 'text-white' : 'text-txt-muted'"
              />
            </div>
            <div class="flex flex-col items-start ml-1.5">
              <span
                :class="cn(
                  'text-xs whitespace-nowrap',
                  step.special === 'overdue'
                    ? 'text-red-400 font-medium'
                    : step.special === 'disputed'
                      ? 'text-amber-400 font-medium'
                      : step.special === 'reviewing'
                        ? 'text-violet-400 font-medium'
                        : step.current
                          ? 'text-accent font-medium'
                          : step.active
                            ? 'text-txt-secondary'
                            : 'text-txt-muted'
                )"
              >
                {{ step.special === 'overdue' ? '超时' : step.special === 'disputed' ? '争议中' : step.special === 'reviewing' ? '复检中' : step.label }}
              </span>
              <span v-if="step.special" class="text-[10px] text-txt-muted">
                {{ step.label }}
              </span>
            </div>
            <div
              v-if="idx < getOrderTimeline(order).length - 1"
              :class="cn(
                'w-8 h-0.5 mx-2',
                step.active ? 'bg-emerald-500/50' : 'bg-bg-tertiary'
              )"
            />
          </div>
        </div>

        <div v-if="order.status === 'overdue' || order.status === 'disputed' || order.repairTask?.status === 'returned'" class="mt-4 flex items-center gap-2">
          <AlertCircle :size="14" class="text-red-400 flex-shrink-0" />
          <span class="text-xs text-red-400">
            {{ order.status === 'overdue' ? '已超期未归还，请及时跟进' : order.status === 'disputed' ? '订单存在争议，需老板裁定' : '维修被退回，需重新处理' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
