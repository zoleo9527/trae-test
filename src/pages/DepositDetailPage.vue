<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Wallet, CheckCircle2, AlertTriangle, Plus, XCircle
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import { DEDUCTION_TYPE_LABELS } from '@/types'
import type { DeductionItem } from '@/types'
import { cn } from '@/lib/utils'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const orderId = computed(() => route.params.id as string)
const order = computed(() => orderStore.getOrderById(orderId.value))
const instrument = computed(() => order.value ? orderStore.getInstrumentById(order.value.instrumentId) : undefined)
const customer = computed(() => order.value ? orderStore.getCustomerById(order.value.customerId) : undefined)

const showConfirmDialog = ref(false)
const customDeductions = ref<Array<Omit<DeductionItem, 'id' | 'settlementId'>>>([])

function initDeductions() {
  if (!order.value?.depositSettlement) return
  customDeductions.value = order.value.depositSettlement.deductions.map(d => ({
    type: d.type,
    amount: d.amount,
    description: d.description,
    isDisputed: d.isDisputed,
  }))
}

initDeductions()

const totalDeduction = computed(() => customDeductions.value.reduce((sum, d) => sum + d.amount, 0))
const refundAmount = computed(() => (order.value?.depositAmount || 0) - totalDeduction.value)

function goBack() {
  router.push('/deposit')
}

function addDeduction() {
  customDeductions.value.push({
    type: 'other',
    amount: 0,
    description: '',
    isDisputed: false,
  })
}

function removeDeduction(idx: number) {
  customDeductions.value.splice(idx, 1)
}

function openConfirmDialog() {
  showConfirmDialog.value = true
}

function confirmSettlement() {
  if (!order.value) return
  orderStore.settleDeposit(orderId.value, customDeductions.value, authStore.userName)
  showConfirmDialog.value = false
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <button
      @click="goBack"
      class="flex items-center gap-2 text-sm text-txt-muted hover:text-txt-primary transition-colors mb-6"
    >
      <ArrowLeft :size="16" />
      返回结算列表
    </button>

    <div v-if="order" class="space-y-6 animate-fade-in">
      <div class="bg-bg-secondary rounded-xl border border-border p-6">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h1 class="text-xl font-semibold text-txt-primary">{{ order.orderNo }}</h1>
            <p class="text-sm text-txt-muted mt-1">{{ instrument?.name }} · {{ customer?.name }}</p>
          </div>
          <div
            :class="cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              order.depositSettlement?.status === 'completed'
                ? 'bg-emerald-500/15 text-emerald-400'
                : order.status === 'disputed'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-cyan-500/15 text-cyan-400'
            )"
          >
            {{ order.depositSettlement?.status === 'completed' ? '已结算' : order.status === 'disputed' ? '争议待裁' : '待结算' }}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 p-4 bg-bg-tertiary rounded-xl">
          <div>
            <p class="text-xs text-txt-muted mb-1">原始押金</p>
            <p class="text-lg font-semibold text-txt-primary">
              ¥{{ order.depositAmount.toLocaleString() }}
            </p>
          </div>
          <div>
            <p class="text-xs text-txt-muted mb-1">总扣款</p>
            <p class="text-lg font-semibold text-amber-400">
              -¥{{ totalDeduction.toLocaleString() }}
            </p>
          </div>
          <div>
            <p class="text-xs text-txt-muted mb-1">应退还</p>
            <p class="text-lg font-semibold text-emerald-400">
              ¥{{ refundAmount.toLocaleString() }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="order.status === 'disputed' && order.returnInspection" class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <div class="flex items-start gap-3">
          <AlertTriangle :size="18" class="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm text-amber-400 font-medium">存在争议待裁定</p>
            <p class="text-xs text-txt-muted mt-1">
              损坏描述：{{ order.returnInspection.damageDescription }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-bg-secondary rounded-xl border border-border p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-txt-secondary">扣款明细</h3>
          <button
            v-if="order.depositSettlement?.status !== 'completed'"
            @click="addDeduction"
            class="flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
          >
            <Plus :size="12" />
            添加扣款
          </button>
        </div>

        <div class="space-y-2">
          <div
            v-for="(d, idx) in customDeductions"
            :key="idx"
            class="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl"
          >
            <select
              v-model="d.type"
              :disabled="order.depositSettlement?.status === 'completed'"
              class="w-24 px-2 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm text-txt-primary focus:outline-none focus:border-accent/50 disabled:opacity-50"
            >
              <option value="rental">租金</option>
              <option value="damage">损坏赔偿</option>
              <option value="repair">维修费</option>
              <option value="overdue">超时费</option>
              <option value="other">其他</option>
            </select>
            <input
              v-model="d.description"
              type="text"
              placeholder="说明"
              :disabled="order.depositSettlement?.status === 'completed'"
              class="flex-1 px-2 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 disabled:opacity-50"
            />
            <div class="relative w-24">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-txt-muted">¥</span>
              <input
                v-model.number="d.amount"
                type="number"
                placeholder="0"
                :disabled="order.depositSettlement?.status === 'completed'"
                class="w-full pl-6 pr-2 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 disabled:opacity-50"
              />
            </div>
            <button
              v-if="order.depositSettlement?.status !== 'completed'"
              @click="removeDeduction(idx)"
              class="p-1.5 text-txt-muted hover:text-red-400 transition-colors"
            >
              <XCircle :size="16" />
            </button>
          </div>

          <div v-if="customDeductions.length === 0" class="text-center py-8 text-txt-muted text-sm">
            暂无扣款项目
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
          <span class="text-sm font-medium text-txt-primary">应退还金额</span>
          <span class="text-xl font-semibold text-emerald-400">
            ¥{{ refundAmount.toLocaleString() }}
          </span>
        </div>
      </div>

      <div v-if="order.depositSettlement?.status === 'completed'" class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
        <div class="flex items-center gap-2">
          <CheckCircle2 :size="16" class="text-emerald-400" />
          <span class="text-sm text-emerald-400">
            已由 {{ order.depositSettlement.approvedBy }} 于 {{ new Date(order.depositSettlement.settledAt!).toLocaleDateString() }} 审批完成
          </span>
        </div>
      </div>

      <div v-else class="flex justify-end">
        <button
          @click="openConfirmDialog"
          class="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
        >
          确认结算
        </button>
      </div>
    </div>

    <ConfirmDialog
      :show="showConfirmDialog"
      title="确认押金结算"
      message="确认后将完成押金结算，退款金额将退还客户。此操作不可撤销。"
      confirmLabel="确认结算"
      @confirm="confirmSettlement"
      @cancel="showConfirmDialog = false"
    >
      <p class="text-sm text-txt-secondary">
        确认后将完成押金结算，退款金额将退还客户。此操作不可撤销。
      </p>
    </ConfirmDialog>
  </div>
</template>
