<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Wrench, Clock, AlertTriangle, CheckCircle2, User,
  RefreshCw, ArrowLeft, Eye, AlertCircle
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { REPAIR_STATUS_LABELS, LIABILITY_PARTY_LABELS } from '@/types'
import type { Order } from '@/types'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const activeTab = ref<'all' | 'pending' | 'in_progress' | 'review' | 'returned'>('all')
const selectedOrderId = ref<string | null>(null)
const returnReason = ref('')
const showReturnDialog = ref(false)

const repairOrders = computed(() => orderStore.orders.filter(o => o.repairTask))

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return repairOrders.value
  return repairOrders.value.filter(o => o.repairTask?.status === activeTab.value)
})

const stats = computed(() => ({
  pending: repairOrders.value.filter(o => o.repairTask?.status === 'pending').length,
  inProgress: repairOrders.value.filter(o => o.repairTask?.status === 'in_progress').length,
  review: repairOrders.value.filter(o => o.repairTask?.status === 'review').length,
  returned: repairOrders.value.filter(o => o.repairTask?.status === 'returned').length,
}))

function getInstrumentName(order: Order): string {
  return orderStore.getInstrumentById(order.instrumentId)?.name || '未知'
}

function getCustomerName(order: Order): string {
  return orderStore.getCustomerById(order.customerId)?.name || '未知'
}

function navigateToOrder(id: string) {
  router.push(`/orders/${id}`)
}

function takeTask(orderId: string) {
  orderStore.updateRepairTask(orderId, { status: 'in_progress' }, authStore.userName)
}

function retakeTask(orderId: string) {
  orderStore.updateRepairTask(orderId, { status: 'in_progress' }, authStore.userName)
}

function submitReview(orderId: string) {
  const order = orderStore.getOrderById(orderId)
  if (!order?.repairTask) return
  orderStore.updateRepairTask(orderId, { status: 'review', actualCost: order.repairTask.estimatedCost }, authStore.userName)
}

function openReturnDialog(orderId: string) {
  selectedOrderId.value = orderId
  returnReason.value = ''
  showReturnDialog.value = true
}

function confirmReturn() {
  if (!selectedOrderId.value || !returnReason.value) return
  orderStore.updateRepairTask(selectedOrderId.value, { status: 'returned', returnReason: returnReason.value }, authStore.userName)
  showReturnDialog.value = false
  selectedOrderId.value = null
}

function approveRepair(orderId: string) {
  orderStore.updateRepairTask(orderId, { status: 'completed' }, authStore.userName)
}

function goBack() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <button
      @click="goBack"
      class="flex items-center gap-2 text-sm text-txt-muted hover:text-txt-primary transition-colors mb-6"
    >
      <ArrowLeft :size="16" />
      返回工作台
    </button>

    <div class="flex items-center justify-between mb-6 animate-fade-in">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-semibold text-txt-primary">维修管理</h1>
        <span
          v-if="authStore.isRepair"
          class="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs"
        >
          维修师傅
        </span>
        <span
          v-else
          class="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs"
        >
          老板视角
        </span>
      </div>
      <div class="text-sm text-txt-muted">
        {{ repairOrders.length }} 台维修中
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4 mb-6 animate-fade-in">
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gray-500/15 flex items-center justify-center">
            <Clock :size="18" class="text-gray-400" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-txt-primary">{{ stats.pending }}</p>
            <p class="text-xs text-txt-muted">待接单</p>
          </div>
        </div>
      </div>
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <Wrench :size="18" class="text-purple-400" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-txt-primary">{{ stats.inProgress }}</p>
            <p class="text-xs text-txt-muted">维修中</p>
          </div>
        </div>
      </div>
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Eye :size="18" class="text-violet-400" />
          </div>
          <div>
            <p class="text-2xl font-semibold text-txt-primary">{{ stats.review }}</p>
            <p class="text-xs text-txt-muted">待复检</p>
          </div>
        </div>
      </div>
      <div class="bg-bg-secondary rounded-xl border border-border p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <RefreshCw :size="18" class="text-orange-400" />
          </div>
          <div>
            <p :class="cn('text-2xl font-semibold', stats.returned > 0 ? 'text-orange-400' : 'text-txt-primary')">
              {{ stats.returned }}
            </p>
            <p class="text-xs text-txt-muted">已退回</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border mb-6 animate-fade-in">
      <button
        v-for="tab in [
          { value: 'all', label: '全部' },
          { value: 'pending', label: '待接单' },
          { value: 'in_progress', label: '维修中' },
          { value: 'review', label: '待复检' },
          { value: 'returned', label: '已退回' },
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
        <Wrench :size="24" class="text-txt-muted" />
      </div>
      <p class="text-txt-muted">暂无维修任务</p>
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
                :class="cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  order.repairTask?.status === 'pending' ? 'bg-gray-500/15 text-gray-400' :
                  order.repairTask?.status === 'in_progress' ? 'bg-purple-500/15 text-purple-400' :
                  order.repairTask?.status === 'review' ? 'bg-violet-500/15 text-violet-400' :
                  'bg-orange-500/15 text-orange-400'
                )"
              >
                {{ REPAIR_STATUS_LABELS[order.repairTask?.status || 'pending'] }}
              </span>
            </div>
            <div class="flex items-center gap-4 text-sm text-txt-muted">
              <span>{{ getInstrumentName(order) }}</span>
              <span class="flex items-center gap-1">
                <User :size="12" />
                {{ getCustomerName(order) }}
              </span>
            </div>
            <div class="mt-3 p-3 bg-bg-tertiary rounded-lg">
              <div class="flex items-start gap-3">
                <AlertCircle :size="14" class="text-amber-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-txt-primary">{{ order.repairTask?.damageCause }}</p>
                  <p class="text-xs text-txt-muted mt-1">
                    责任判定：{{ LIABILITY_PARTY_LABELS[order.repairTask?.liabilityParty || 'undetermined'] }}
                    · 预估费用：¥{{ order.repairTask?.estimatedCost }}
                  </p>
                </div>
              </div>
            </div>
            <div v-if="order.repairTask?.returnedForRework" class="mt-3 flex items-center gap-2 text-orange-400">
              <RefreshCw :size="14" />
              <span class="text-xs">退回原因：{{ order.repairTask?.returnReason }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-2 ml-6">
            <button
              @click="navigateToOrder(order.id)"
              class="px-4 py-2 rounded-lg border border-border text-sm text-txt-secondary hover:border-accent/30 hover:text-txt-primary transition-colors"
            >
              查看详情
            </button>

            <button
              v-if="authStore.isRepair && order.repairTask?.status === 'pending'"
              @click="takeTask(order.id)"
              class="px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors"
            >
              接单
            </button>

            <button
              v-if="authStore.isRepair && order.repairTask?.status === 'in_progress'"
              @click="submitReview(order.id)"
              class="px-4 py-2 rounded-lg bg-blue-500/15 text-blue-400 text-sm font-medium hover:bg-blue-500/25 transition-colors"
            >
              提交复检
            </button>

            <button
              v-if="authStore.isRepair && order.repairTask?.status === 'returned'"
              @click="retakeTask(order.id)"
              class="px-4 py-2 rounded-lg bg-orange-500/15 text-orange-400 text-sm font-medium hover:bg-orange-500/25 transition-colors"
            >
              重新接回
            </button>

            <button
              v-if="authStore.isConsultant && order.repairTask?.status === 'review'"
              @click="openReturnDialog(order.id)"
              class="px-4 py-2 rounded-lg bg-orange-500/15 text-orange-400 text-sm font-medium hover:bg-orange-500/25 transition-colors"
            >
              退回重修
            </button>

            <button
              v-if="(authStore.isConsultant || authStore.isBoss) && order.repairTask?.status === 'review'"
              @click="approveRepair(order.id)"
              class="px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors"
            >
              复检通过
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="showReturnDialog"
      title="退回重修"
      message="退回后维修师傅需重新处理并再次提交复检。"
      @confirm="confirmReturn"
      @cancel="showReturnDialog = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-txt-secondary mb-2">退回原因</label>
          <textarea
            v-model="returnReason"
            placeholder="请描述复检不合格的原因..."
            rows="3"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 resize-none"
          />
        </div>
        <p class="text-xs text-txt-muted">
          退回后维修师傅需重新处理并再次提交复检
        </p>
      </div>
    </ConfirmDialog>
  </div>
</template>
