<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Wallet, Clock, AlertTriangle, CheckCircle2, User,
  ArrowLeft, AlertCircle, XCircle
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { DEDUCTION_TYPE_LABELS } from '@/types'
import type { Order } from '@/types'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const activeTab = ref<'pending' | 'disputed' | 'completed'>('pending')
const selectedOrderId = ref<string | null>(null)
const showApproveDialog = ref(false)

const settlingOrders = computed(() => orderStore.orders.filter(o => o.status === 'settling' || o.status === 'disputed' || o.depositSettlement?.status === 'completed'))

const filteredOrders = computed(() => {
  if (activeTab.value === 'pending') return settlingOrders.value.filter(o => o.status === 'settling')
  if (activeTab.value === 'disputed') return settlingOrders.value.filter(o => o.status === 'disputed')
  return settlingOrders.value.filter(o => o.depositSettlement?.status === 'completed')
})

const stats = computed(() => ({
  pending: settlingOrders.value.filter(o => o.status === 'settling').length,
  disputed: settlingOrders.value.filter(o => o.status === 'disputed').length,
  completed: settlingOrders.value.filter(o => o.depositSettlement?.status === 'completed').length,
}))

function getInstrumentName(order: Order): string {
  return orderStore.getInstrumentById(order.instrumentId)?.name || '未知'
}

function getCustomerName(order: Order): string {
  return orderStore.getCustomerById(order.customerId)?.name || '未知'
}

function navigateToDetail(orderId: string) {
  router.push(`/deposit/${orderId}`)
}

function openApproveDialog(orderId: string) {
  selectedOrderId.value = orderId
  showApproveDialog.value = true
}

function approveSettlement() {
  if (!selectedOrderId.value) return
  const order = orderStore.getOrderById(selectedOrderId.value)
  if (!order?.depositSettlement) return

  orderStore.settleDeposit(
    selectedOrderId.value,
    order.depositSettlement.deductions.map(d => ({
      type: d.type,
      amount: d.amount,
      description: d.description,
      isDisputed: d.isDisputed,
    })),
    authStore.userName
  )
  showApproveDialog.value = false
  selectedOrderId.value = null
}

function goBack() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <button
      @click="goBack"
      class="flex items-center gap-2 text-sm text-txt-muted hover:text-txt-primary transition-colors mb-6"
    >
      <ArrowLeft :size="16" />
      返回工作台
    </button>

    <div class="flex items-center justify-between mb-6 animate-fade-in">
      <h1 class="text-xl font-semibold text-txt-primary">押金结算</h1>
      <div class="text-sm text-txt-muted">
        {{ settlingOrders.length }} 笔结算
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6 animate-fade-in">
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Clock :size="18" class="text-cyan-400" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-txt-primary">{{ stats.pending }}</p>
            <p class="text-xs text-txt-muted">待结算</p>
          </div>
        </div>
      </div>
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle :size="18" class="text-amber-400" />
          </div>
          <div>
            <p :class="cn('text-2xl font-semibold', stats.disputed > 0 ? 'text-amber-400' : 'text-txt-primary')">
              {{ stats.disputed }}
            </p>
            <p class="text-xs text-txt-muted">争议待裁</p>
          </div>
        </div>
      </div>
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 :size="18" class="text-emerald-400" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-txt-primary">{{ stats.completed }}</p>
            <p class="text-xs text-txt-muted">已完成</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border mb-6 animate-fade-in">
      <button
        v-for="tab in [
          { value: 'pending', label: '待结算' },
          { value: 'disputed', label: '争议待裁' },
          { value: 'completed', label: '已完成' },
        ]"
        :key="tab.value"
        @click="activeTab = tab.value as typeof activeTab"
        :class="cn(
          'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === tab.value
            ? 'bg-accent text-bg-primary'
            : 'text-txt-muted hover:text-txt-primary hover:bg-bg-tertiary'
        )"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="filteredOrders.length === 0" class="text-center py-16 animate-fade-in">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-tertiary flex items-center justify-center">
        <Wallet :size="24" class="text-txt-muted" />
      </div>
      <p class="text-txt-muted">暂无结算记录</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="bg-bg-secondary rounded-xl border border-border p-5 animate-fade-in"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-sm font-medium text-txt-primary">{{ order.orderNo }}</span>
              <StatusBadge :status="order.status" />
              <span
                v-if="order.depositSettlement?.status === 'completed'"
                class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs"
              >
                已结算
              </span>
            </div>
            <div class="flex items-center gap-4 text-sm text-txt-muted">
              <span>{{ getInstrumentName(order) }}</span>
              <span class="flex items-center gap-1">
                <User :size="12" />
                {{ getCustomerName(order) }}
              </span>
            </div>

            <div v-if="order.depositSettlement" class="mt-3 p-3 bg-bg-tertiary rounded-lg">
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <p class="text-xs text-txt-muted mb-1">原始押金</p>
                  <p class="text-sm font-medium text-txt-primary">
                    ¥{{ order.depositSettlement.originalAmount.toLocaleString() }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-txt-muted mb-1">总扣款</p>
                  <p class="text-sm font-medium text-amber-400">
                    -¥{{ order.depositSettlement.totalDeduction.toLocaleString() }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-txt-muted mb-1">应退还</p>
                  <p class="text-sm font-medium text-emerald-400">
                    ¥{{ order.depositSettlement.refundAmount.toLocaleString() }}
                  </p>
                </div>
              </div>
              <div class="mt-3 pt-3 border-t border-border">
                <p class="text-xs text-txt-muted mb-2">扣款明细</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="d in order.depositSettlement.deductions"
                    :key="d.id"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-secondary text-xs"
                  >
                    <span class="text-txt-secondary">{{ DEDUCTION_TYPE_LABELS[d.type] }}</span>
                    <span class="text-amber-400">-¥{{ d.amount }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div v-if="order.status === 'disputed' && order.returnInspection" class="mt-3 flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle :size="14" class="text-amber-400 flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm text-amber-400 font-medium">存在争议待裁定</p>
                <p class="text-xs text-txt-muted mt-0.5">
                  损坏描述：{{ order.returnInspection.damageDescription }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2 ml-6">
            <button
              @click="navigateToDetail(order.id)"
              class="px-4 py-2 rounded-lg border border-border text-sm text-txt-secondary hover:border-accent/30 hover:text-txt-primary transition-colors"
            >
              查看详情
            </button>

            <button
              v-if="order.status === 'settling'"
              @click="openApproveDialog(order.id)"
              class="px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors"
            >
              确认结算
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="showApproveDialog"
      title="确认押金结算"
      message="确认后将完成押金结算，退款金额将退还客户。此操作不可撤销。"
      confirmLabel="确认结算"
      @confirm="approveSettlement"
      @cancel="showApproveDialog = false"
    >
      <p class="text-sm text-txt-secondary">
        确认后将完成押金结算，退款金额将退还客户。此操作不可撤销。
      </p>
    </ConfirmDialog>
  </div>
</template>
