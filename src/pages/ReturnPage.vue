<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Search, Clock, AlertTriangle, User } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import type { Order } from '@/types'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const searchQuery = ref('')

const returnableOrders = computed(() => {
  let orders = orderStore.orders.filter(o =>
    o.status === 'checked_out' || o.status === 'overdue' || o.status === 'return_pending'
  )
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    orders = orders.filter(o => {
      const inst = orderStore.getInstrumentById(o.instrumentId)
      const cust = orderStore.getCustomerById(o.customerId)
      return o.orderNo.toLowerCase().includes(q)
        || inst?.name.toLowerCase().includes(q)
        || cust?.name.toLowerCase().includes(q)
    })
  }
  return orders.sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1
    if (b.status === 'overdue' && a.status !== 'overdue') return 1
    return new Date(a.expectedReturnAt).getTime() - new Date(b.expectedReturnAt).getTime()
  })
})

const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)
const todayEnd = new Date()
todayEnd.setHours(23, 59, 59, 999)

function getInstrumentName(order: Order): string {
  return orderStore.getInstrumentById(order.instrumentId)?.name || '未知'
}

function getCustomerName(order: Order): string {
  return orderStore.getCustomerById(order.customerId)?.name || '未知'
}

function getDaysOverdue(order: Order): number {
  if (order.status !== 'overdue') return 0
  return Math.round((Date.now() - new Date(order.expectedReturnAt).getTime()) / (1000 * 60 * 60 * 24))
}

function isDueToday(order: Order): boolean {
  const due = new Date(order.expectedReturnAt)
  return due >= todayStart && due <= todayEnd
}

function navigateToReturnDetail(orderId: string) {
  router.push(`/return/${orderId}`)
}

function goBack() {
  router.push('/orders')
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <button
      @click="goBack"
      class="flex items-center gap-2 text-sm text-txt-muted hover:text-txt-primary transition-colors mb-6"
    >
      <ArrowLeft :size="16" />
      返回订单列表
    </button>

    <div class="flex items-center justify-between mb-6 animate-fade-in">
      <h1 class="text-xl font-semibold text-txt-primary">归还验收</h1>
      <div class="text-sm text-txt-muted">
        {{ returnableOrders.length }} 台待归还
      </div>
    </div>

    <div class="relative mb-6 animate-fade-in">
      <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索订单号、乐器、客户..."
        class="w-full pl-9 pr-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 transition-colors"
      />
    </div>

    <div v-if="returnableOrders.length === 0" class="text-center py-16 animate-fade-in">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-tertiary flex items-center justify-center">
        <Clock :size="24" class="text-txt-muted" />
      </div>
      <p class="text-txt-muted">暂无待归还订单</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="order in returnableOrders"
        :key="order.id"
        @click="navigateToReturnDetail(order.id)"
        :class="cn(
          'bg-bg-secondary rounded-xl border p-5 cursor-pointer transition-all animate-fade-in',
          order.status === 'overdue'
            ? 'border-red-500/30 hover:border-red-500/50'
            : isDueToday(order)
              ? 'border-amber-500/30 hover:border-amber-500/50'
              : 'border-border hover:border-accent/30'
        )"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-txt-primary">{{ order.orderNo }}</span>
                <StatusBadge :status="order.status" />
                <span
                  v-if="order.status === 'overdue'"
                  class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs"
                >
                  <AlertTriangle :size="10" />
                  超期{{ getDaysOverdue(order) }}天
                </span>
                <span
                  v-else-if="isDueToday(order)"
                  class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs"
                >
                  <Clock :size="10" />
                  今日到期
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
            <p class="text-sm text-txt-primary">
              应还：{{ new Date(order.expectedReturnAt).toLocaleDateString() }}
            </p>
            <p class="text-xs text-txt-muted mt-0.5">
              押金 ¥{{ order.depositAmount.toLocaleString() }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
