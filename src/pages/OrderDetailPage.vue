<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Clock, User, Phone, Calendar, Package, AlertCircle,
  CheckCircle2, XCircle, MessageSquare, Camera, Wrench, Wallet,
  FileText, Send, AlertTriangle, BadgeCheck, RefreshCw, Gavel
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOrderStore } from '@/stores/order'
import {
  ORDER_STATUS_LABELS, DAMAGE_LEVEL_LABELS, LIABILITY_PARTY_LABELS,
  REPAIR_STATUS_LABELS, DEDUCTION_TYPE_LABELS
} from '@/types'
import type { Order, DamageLevel, LiabilityParty, DeductionItem } from '@/types'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const orderId = computed(() => route.params.id as string)
const order = computed(() => orderStore.getOrderById(orderId.value))

const instrument = computed(() => order.value ? orderStore.getInstrumentById(order.value.instrumentId) : undefined)
const customer = computed(() => order.value ? orderStore.getCustomerById(order.value.customerId) : undefined)

const activeTab = ref<'timeline' | 'inspection' | 'repair' | 'settlement'>('timeline')
const quickNote = ref('')

const showDisputeDialog = ref(false)
const disputeResolution = ref('')
const disputeLiability = ref<LiabilityParty>('undetermined')

const showRepairDialog = ref(false)
const repairDamageCause = ref('')
const repairEstimatedCost = ref(0)
const repairLiability = ref<LiabilityParty>('customer')

const showSettleDialog = ref(false)
const customDeductions = ref<Array<Omit<DeductionItem, 'id' | 'settlementId'>>>([])

const showReturnRepairDialog = ref(false)
const returnRepairReason = ref('')

function goBack() {
  router.push('/orders')
}

function addQuickNote() {
  if (!quickNote.value.trim() || !order.value) return
  orderStore.addOrderLog(orderId.value, '备注', authStore.userName, authStore.currentRole!, quickNote.value)
  quickNote.value = ''
}

function openDisputeDialog() {
  showDisputeDialog.value = true
}

function resolveDispute() {
  if (!order.value || !disputeResolution.value) return
  orderStore.resolveDispute(orderId.value, disputeResolution.value + ` (责任判定：${LIABILITY_PARTY_LABELS[disputeLiability.value]})`, authStore.userName)
  showDisputeDialog.value = false
  disputeResolution.value = ''
}

function openRepairDialog() {
  showRepairDialog.value = true
  if (order.value?.returnInspection) {
    repairDamageCause.value = order.value.returnInspection.damageDescription || ''
    repairLiability.value = order.value.returnInspection.liabilityParty
  }
}

function createRepairTask() {
  if (!repairDamageCause.value || repairEstimatedCost.value <= 0) return
  orderStore.createRepairTask(orderId.value, {
    assignedTo: '张师傅',
    damageCause: repairDamageCause.value,
    liabilityParty: repairLiability.value,
    estimatedCost: repairEstimatedCost.value,
  })
  showRepairDialog.value = false
  repairDamageCause.value = ''
  repairEstimatedCost.value = 0
}

function takeRepairTask() {
  if (!order.value?.repairTask) return
  orderStore.updateRepairTask(orderId.value, { status: 'in_progress' }, authStore.userName)
}

function submitRepairReview() {
  if (!order.value?.repairTask) return
  orderStore.updateRepairTask(orderId.value, { status: 'review', actualCost: order.value.repairTask.estimatedCost }, authStore.userName)
}

function approveRepair() {
  if (!order.value?.repairTask) return
  orderStore.updateRepairTask(orderId.value, { status: 'completed' }, authStore.userName)
}

function openReturnRepairDialog() {
  returnRepairReason.value = ''
  showReturnRepairDialog.value = true
}

function returnRepair() {
  if (!order.value?.repairTask || !returnRepairReason.value) return
  orderStore.updateRepairTask(orderId.value, { status: 'returned', returnReason: returnRepairReason.value }, authStore.userName)
  showReturnRepairDialog.value = false
}

function openSettleDialog() {
  if (!order.value) return
  customDeductions.value = order.value.depositSettlement?.deductions.map(d => ({
    type: d.type,
    amount: d.amount,
    description: d.description,
    isDisputed: d.isDisputed,
  })) || []
  showSettleDialog.value = true
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

const totalDeduction = computed(() => customDeductions.value.reduce((sum, d) => sum + d.amount, 0))
const refundAmount = computed(() => (order.value?.depositAmount || 0) - totalDeduction.value)

function settleDeposit() {
  if (!order.value) return
  orderStore.settleDeposit(orderId.value, customDeductions.value, authStore.userName)
  showSettleDialog.value = false
}

function navigateTo(path: string) {
  router.push(path)
}

const sortedLogs = computed(() => {
  return [...(order.value?.logs || [])].sort((a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime())
})
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)]">
    <div class="flex-1 overflow-y-auto">
      <div class="p-6 max-w-4xl mx-auto">
        <button
          @click="goBack"
          class="flex items-center gap-2 text-sm text-txt-muted hover:text-txt-primary transition-colors mb-6"
        >
          <ArrowLeft :size="16" />
          返回订单列表
        </button>

        <div v-if="order" class="space-y-6 animate-fade-in">
          <div class="bg-bg-secondary rounded-xl border border-border p-6">
            <div class="flex items-start justify-between mb-6">
              <div>
                <div class="flex items-center gap-3">
                  <h1 class="text-xl font-semibold text-txt-primary">{{ order.orderNo }}</h1>
                  <StatusBadge :status="order.status" />
                  <span v-if="order.schoolCooperation" class="px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-xs">
                    学校合作
                  </span>
                </div>
                <p class="text-sm text-txt-muted mt-1">{{ instrument?.name }} · {{ instrument?.brand }}</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-semibold text-txt-primary">押金 ¥{{ order.depositAmount.toLocaleString() }}</p>
                <p class="text-xs text-txt-muted mt-0.5">
                  办理人：{{ order.checkoutBy }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-4">
                <h3 class="text-sm font-medium text-txt-secondary">客户信息</h3>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
                    <User :size="18" class="text-txt-muted" />
                  </div>
                  <div>
                    <p class="text-sm text-txt-primary font-medium">{{ customer?.name }}</p>
                    <p class="text-xs text-txt-muted flex items-center gap-1">
                      <Phone :size="12" />
                      {{ customer?.phone }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="space-y-4">
                <h3 class="text-sm font-medium text-txt-secondary">租赁周期</h3>
                <div class="space-y-2">
                  <div class="flex items-center gap-2 text-sm">
                    <Calendar :size="14" class="text-emerald-400" />
                    <span class="text-txt-muted">租出：</span>
                    <span class="text-txt-primary">{{ new Date(order.checkoutAt).toLocaleDateString() }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm">
                    <Clock :size="14" :class="order.status === 'overdue' ? 'text-red-400' : 'text-amber-400'" />
                    <span class="text-txt-muted">应还：</span>
                    <span :class="order.status === 'overdue' ? 'text-red-400' : 'text-txt-primary'">
                      {{ new Date(order.expectedReturnAt).toLocaleDateString() }}
                    </span>
                  </div>
                  <div v-if="order.actualReturnAt" class="flex items-center gap-2 text-sm">
                    <CheckCircle2 :size="14" class="text-blue-400" />
                    <span class="text-txt-muted">实还：</span>
                    <span class="text-txt-primary">{{ new Date(order.actualReturnAt).toLocaleDateString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border">
            <button
              @click="activeTab = 'timeline'"
              :class="cn(
                'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'timeline' ? 'bg-accent text-bg-primary' : 'text-txt-muted hover:text-txt-primary hover:bg-bg-tertiary'
              )"
            >
              <span class="flex items-center justify-center gap-2">
                <Clock :size="14" />
                时间线
              </span>
            </button>
            <button
              v-if="order.returnInspection"
              @click="activeTab = 'inspection'"
              :class="cn(
                'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'inspection' ? 'bg-accent text-bg-primary' : 'text-txt-muted hover:text-txt-primary hover:bg-bg-tertiary'
              )"
            >
              <span class="flex items-center justify-center gap-2">
                <FileText :size="14" />
                验收记录
              </span>
            </button>
            <button
              v-if="order.repairTask"
              @click="activeTab = 'repair'"
              :class="cn(
                'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'repair' ? 'bg-accent text-bg-primary' : 'text-txt-muted hover:text-txt-primary hover:bg-bg-tertiary'
              )"
            >
              <span class="flex items-center justify-center gap-2">
                <Wrench :size="14" />
                维修记录
              </span>
            </button>
            <button
              v-if="order.depositSettlement"
              @click="activeTab = 'settlement'"
              :class="cn(
                'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'settlement' ? 'bg-accent text-bg-primary' : 'text-txt-muted hover:text-txt-primary hover:bg-bg-tertiary'
              )"
            >
              <span class="flex items-center justify-center gap-2">
                <Wallet :size="14" />
                押金结算
              </span>
            </button>
          </div>

          <div v-if="activeTab === 'timeline'" class="bg-bg-secondary rounded-xl border border-border p-6">
            <div class="relative">
              <div class="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
              <div class="space-y-6">
                <div v-for="log in sortedLogs" :key="log.id" class="relative pl-10">
                  <div class="absolute left-0 w-7 h-7 rounded-full bg-bg-tertiary border-2 border-border flex items-center justify-center">
                    <component
                      :is="log.action.includes('损坏') || log.action.includes('争议') ? AlertCircle :
                           log.action.includes('完成') || log.action.includes('通过') ? CheckCircle2 :
                           log.action.includes('退回') ? XCircle :
                           log.action.includes('维修') ? Wrench :
                           log.action.includes('结算') ? Wallet : MessageSquare"
                      :size="12"
                      :class="log.action.includes('损坏') || log.action.includes('争议') || log.action.includes('退回') ? 'text-red-400' :
                              log.action.includes('完成') || log.action.includes('通过') ? 'text-emerald-400' :
                              log.action.includes('维修') ? 'text-purple-400' :
                              log.action.includes('结算') ? 'text-cyan-400' : 'text-txt-muted'"
                    />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-txt-primary">{{ log.action }}</span>
                      <span class="text-xs text-txt-muted">{{ log.operator }}</span>
                    </div>
                    <p v-if="log.note" class="text-sm text-txt-secondary mt-1">{{ log.note }}</p>
                    <p class="text-xs text-txt-muted mt-1">{{ new Date(log.operatedAt).toLocaleString() }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-border">
              <div class="flex gap-3">
                <input
                  v-model="quickNote"
                  type="text"
                  placeholder="添加备注..."
                  class="flex-1 px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 transition-colors"
                  @keyup.enter="addQuickNote"
                />
                <button
                  @click="addQuickNote"
                  class="px-4 py-2.5 rounded-xl bg-accent text-bg-primary text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  <Send :size="16" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'inspection' && order.returnInspection" class="bg-bg-secondary rounded-xl border border-border p-6 space-y-6">
            <div>
              <h3 class="text-sm font-medium text-txt-secondary mb-3">验收概况</h3>
              <div class="grid grid-cols-3 gap-4">
                <div class="p-4 bg-bg-tertiary rounded-xl">
                  <p class="text-xs text-txt-muted mb-1">损坏情况</p>
                  <p :class="cn(
                    'text-sm font-medium',
                    order.returnInspection.hasDamage ? 'text-red-400' : 'text-emerald-400'
                  )">
                    {{ order.returnInspection.hasDamage ? '存在损坏' : '无损坏' }}
                  </p>
                </div>
                <div class="p-4 bg-bg-tertiary rounded-xl">
                  <p class="text-xs text-txt-muted mb-1">损坏程度</p>
                  <p class="text-sm font-medium text-txt-primary">
                    {{ DAMAGE_LEVEL_LABELS[order.returnInspection.damageLevel] }}
                  </p>
                </div>
                <div class="p-4 bg-bg-tertiary rounded-xl">
                  <p class="text-xs text-txt-muted mb-1">责任判定</p>
                  <p :class="cn(
                    'text-sm font-medium',
                    order.returnInspection.liabilityParty === 'customer' ? 'text-amber-400' :
                    order.returnInspection.liabilityParty === 'undetermined' ? 'text-txt-muted' : 'text-emerald-400'
                  )">
                    {{ LIABILITY_PARTY_LABELS[order.returnInspection.liabilityParty] }}
                  </p>
                </div>
              </div>
            </div>
            <div v-if="order.returnInspection.damageDescription">
              <h3 class="text-sm font-medium text-txt-secondary mb-3">损坏描述</h3>
              <p class="text-sm text-txt-primary p-4 bg-bg-tertiary rounded-xl">
                {{ order.returnInspection.damageDescription }}
              </p>
            </div>
            <div v-if="order.returnInspection.isDisputed" class="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div class="flex items-center gap-2">
                <AlertTriangle :size="16" class="text-red-400" />
                <span class="text-sm text-red-400 font-medium">客户对损坏判定有异议</span>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'repair' && order.repairTask" class="bg-bg-secondary rounded-xl border border-border p-6 space-y-6">
            <div>
              <h3 class="text-sm font-medium text-txt-secondary mb-3">维修任务</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-bg-tertiary rounded-xl">
                  <p class="text-xs text-txt-muted mb-1">状态</p>
                  <p class="text-sm font-medium text-txt-primary">
                    {{ REPAIR_STATUS_LABELS[order.repairTask.status] }}
                  </p>
                </div>
                <div class="p-4 bg-bg-tertiary rounded-xl">
                  <p class="text-xs text-txt-muted mb-1">负责人</p>
                  <p class="text-sm font-medium text-txt-primary">{{ order.repairTask.assignedTo }}</p>
                </div>
                <div class="p-4 bg-bg-tertiary rounded-xl">
                  <p class="text-xs text-txt-muted mb-1">预估费用</p>
                  <p class="text-sm font-medium text-txt-primary">¥{{ order.repairTask.estimatedCost }}</p>
                </div>
                <div class="p-4 bg-bg-tertiary rounded-xl">
                  <p class="text-xs text-txt-muted mb-1">实际费用</p>
                  <p class="text-sm font-medium text-txt-primary">
                    {{ order.repairTask.actualCost ? `¥${order.repairTask.actualCost}` : '待确认' }}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-medium text-txt-secondary mb-3">损坏原因</h3>
              <p class="text-sm text-txt-primary p-4 bg-bg-tertiary rounded-xl">
                {{ order.repairTask.damageCause }}
              </p>
            </div>
            <div v-if="order.repairTask.returnedForRework" class="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <div class="flex items-center gap-2">
                <RefreshCw :size="16" class="text-orange-400" />
                <span class="text-sm text-orange-400 font-medium">退回原因：{{ order.repairTask.returnReason }}</span>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-medium text-txt-secondary mb-3">维修日志</h3>
              <div class="space-y-2">
                <div
                  v-for="log in order.repairTask.logs"
                  :key="log.id"
                  class="flex items-center justify-between px-4 py-3 bg-bg-tertiary rounded-xl"
                >
                  <div>
                    <p class="text-sm text-txt-primary">{{ log.action }}</p>
                    <p v-if="log.note" class="text-xs text-txt-muted mt-0.5">{{ log.note }}</p>
                  </div>
                  <span class="text-xs text-txt-muted">{{ new Date(log.operatedAt).toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'settlement' && order.depositSettlement" class="bg-bg-secondary rounded-xl border border-border p-6 space-y-6">
            <div class="grid grid-cols-3 gap-4">
              <div class="p-4 bg-bg-tertiary rounded-xl">
                <p class="text-xs text-txt-muted mb-1">原始押金</p>
                <p class="text-lg font-semibold text-txt-primary">¥{{ order.depositSettlement.originalAmount.toLocaleString() }}</p>
              </div>
              <div class="p-4 bg-bg-tertiary rounded-xl">
                <p class="text-xs text-txt-muted mb-1">总扣款</p>
                <p class="text-lg font-semibold text-amber-400">¥{{ order.depositSettlement.totalDeduction.toLocaleString() }}</p>
              </div>
              <div class="p-4 bg-bg-tertiary rounded-xl">
                <p class="text-xs text-txt-muted mb-1">应退还</p>
                <p class="text-lg font-semibold text-emerald-400">¥{{ order.depositSettlement.refundAmount.toLocaleString() }}</p>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-medium text-txt-secondary mb-3">扣款明细</h3>
              <div class="space-y-2">
                <div
                  v-for="deduction in order.depositSettlement.deductions"
                  :key="deduction.id"
                  class="flex items-center justify-between px-4 py-3 bg-bg-tertiary rounded-xl"
                >
                  <div>
                    <p class="text-sm text-txt-primary">{{ DEDUCTION_TYPE_LABELS[deduction.type] }}</p>
                    <p class="text-xs text-txt-muted">{{ deduction.description }}</p>
                  </div>
                  <span class="text-sm font-medium text-amber-400">-¥{{ deduction.amount }}</span>
                </div>
              </div>
            </div>
            <div v-if="order.depositSettlement.approvedBy" class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div class="flex items-center gap-2">
                <BadgeCheck :size="16" class="text-emerald-400" />
                <span class="text-sm text-emerald-400">
                  已由 {{ order.depositSettlement.approvedBy }} 于 {{ new Date(order.depositSettlement.settledAt!).toLocaleDateString() }} 审批完成
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-80 border-l border-border bg-bg-secondary p-6 overflow-y-auto">
      <h3 class="text-sm font-semibold text-txt-primary mb-4">快速操作</h3>

      <div v-if="order" class="space-y-3">
        <button
          v-if="(authStore.isConsultant || authStore.isBoss) && order.status === 'damage_assessing' && !order.repairTask"
          @click="openRepairDialog"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
        >
          <Wrench :size="16" />
          <span class="text-sm font-medium">创建维修任务</span>
        </button>

        <button
          v-if="authStore.isRepair && order.repairTask?.status === 'pending'"
          @click="takeRepairTask"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <CheckCircle2 :size="16" />
          <span class="text-sm font-medium">接单开始维修</span>
        </button>

        <button
          v-if="authStore.isRepair && order.repairTask?.status === 'in_progress'"
          @click="submitRepairReview"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
        >
          <CheckCircle2 :size="16" />
          <span class="text-sm font-medium">完成维修提交复检</span>
        </button>

        <button
          v-if="authStore.isRepair && order.repairTask?.status === 'returned'"
          @click="takeRepairTask"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
        >
          <RefreshCw :size="16" />
          <span class="text-sm font-medium">重新接回维修</span>
        </button>

        <button
          v-if="authStore.isConsultant && order.repairTask?.status === 'review'"
          @click="approveRepair"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <CheckCircle2 :size="16" />
          <span class="text-sm font-medium">复检通过</span>
        </button>

        <button
          v-if="authStore.isConsultant && order.repairTask?.status === 'review'"
          @click="openReturnRepairDialog"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <XCircle :size="16" />
          <span class="text-sm font-medium">退回重修</span>
        </button>

        <button
          v-if="authStore.isBoss && order.status === 'disputed'"
          @click="openDisputeDialog"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          <Gavel :size="16" />
          <span class="text-sm font-medium">裁定争议</span>
        </button>

        <button
          v-if="authStore.isBoss && order.status === 'settling'"
          @click="openSettleDialog"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          <Wallet :size="16" />
          <span class="text-sm font-medium">押金结算</span>
        </button>

        <button
          v-if="(authStore.isConsultant || authStore.isBoss) && order.status === 'checked_out'"
          @click="navigateTo(`/return/${order.id}`)"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          <CheckCircle2 :size="16" />
          <span class="text-sm font-medium">办理归还</span>
        </button>

        <div class="mt-6 pt-6 border-t border-border">
          <h4 class="text-xs font-medium text-txt-muted uppercase tracking-wider mb-3">状态流转</h4>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs">
              <div class="w-2 h-2 rounded-full bg-gray-400" />
              <span class="text-txt-muted">待租出 → 已租出</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <div class="w-2 h-2 rounded-full bg-blue-500" />
              <span class="text-txt-muted">已租出 → 验收中</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <div class="w-2 h-2 rounded-full bg-indigo-500" />
              <span class="text-txt-muted">验收中 → 损坏判定</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <div class="w-2 h-2 rounded-full bg-orange-500" />
              <span class="text-txt-muted">损坏判定 → 维修中</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <div class="w-2 h-2 rounded-full bg-purple-500" />
              <span class="text-txt-muted">维修中 → 结算中</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <div class="w-2 h-2 rounded-full bg-cyan-500" />
              <span class="text-txt-muted">结算中 → 已完成</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="showDisputeDialog"
      title="裁定争议"
      message="请确认争议裁定结果。此操作将更新订单状态并记录日志。"
      @confirm="resolveDispute"
      @cancel="showDisputeDialog = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-txt-secondary mb-2">责任判定</label>
          <select
            v-model="disputeLiability"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary focus:outline-none focus:border-accent/50"
          >
            <option value="customer">客户责任</option>
            <option value="natural_wear">自然损耗</option>
            <option value="quality_issue">质量问题</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-txt-secondary mb-2">裁定说明</label>
          <textarea
            v-model="disputeResolution"
            placeholder="请输入裁定说明..."
            rows="3"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 resize-none"
          />
        </div>
      </div>
    </ConfirmDialog>

    <ConfirmDialog
      :show="showRepairDialog"
      title="创建维修任务"
      message="确认创建维修任务后，订单将转入维修流程。"
      @confirm="createRepairTask"
      @cancel="showRepairDialog = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-txt-secondary mb-2">责任判定</label>
          <select
            v-model="repairLiability"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary focus:outline-none focus:border-accent/50"
          >
            <option value="customer">客户责任</option>
            <option value="natural_wear">自然损耗</option>
            <option value="quality_issue">质量问题</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-txt-secondary mb-2">损坏原因</label>
          <textarea
            v-model="repairDamageCause"
            placeholder="请描述损坏原因..."
            rows="3"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 resize-none"
          />
        </div>
        <div>
          <label class="block text-sm text-txt-secondary mb-2">预估费用</label>
          <input
            v-model.number="repairEstimatedCost"
            type="number"
            placeholder="0"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>
    </ConfirmDialog>

    <ConfirmDialog
      :show="showSettleDialog"
      title="押金结算"
      message="确认后将完成押金结算，退款金额将退还客户。此操作不可撤销。"
      confirmLabel="确认结算"
      @confirm="settleDeposit"
      @cancel="showSettleDialog = false"
    >
      <div class="space-y-4">
        <div class="p-4 bg-bg-tertiary rounded-xl">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-txt-muted">原始押金</span>
            <span class="text-txt-primary">¥{{ order?.depositAmount.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between text-sm mb-2">
            <span class="text-txt-muted">总扣款</span>
            <span class="text-amber-400">-¥{{ totalDeduction.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between text-sm font-medium pt-2 border-t border-border">
            <span class="text-txt-primary">应退还</span>
            <span class="text-emerald-400">¥{{ refundAmount.toLocaleString() }}</span>
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm text-txt-secondary">扣款明细</label>
            <button
              @click="addDeduction"
              class="text-xs text-accent hover:text-accent-hover"
            >
              + 添加
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(d, idx) in customDeductions" :key="idx" class="flex items-center gap-2">
              <select
                v-model="d.type"
                class="w-28 px-2 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-txt-primary focus:outline-none focus:border-accent/50"
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
                class="flex-1 px-2 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50"
              />
              <input
                v-model.number="d.amount"
                type="number"
                placeholder="0"
                class="w-20 px-2 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50"
              />
              <button
                @click="removeDeduction(idx)"
                class="p-2 text-txt-muted hover:text-red-400 transition-colors"
              >
                <XCircle :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </ConfirmDialog>

    <ConfirmDialog
      :show="showReturnRepairDialog"
      title="退回重修"
      message="退回后维修师傅需重新处理并再次提交复检。"
      variant="danger"
      confirmLabel="确认退回"
      @confirm="returnRepair"
      @cancel="showReturnRepairDialog = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-txt-secondary mb-2">退回原因</label>
          <textarea
            v-model="returnRepairReason"
            placeholder="请描述复检不合格的原因..."
            rows="3"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 resize-none"
          />
        </div>
      </div>
    </ConfirmDialog>
  </div>
</template>
