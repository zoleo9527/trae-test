<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { X, Clock, User, CheckCircle2, XCircle } from 'lucide-vue-next'
import { useSidePanel } from '@/composables/useSidePanel'
import { useOrderStore } from '@/stores/order'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { ORDER_STATUS_LABELS, type OrderStatus, type LiabilityParty } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const { isOpen, currentOrderId, closePanel } = useSidePanel()
const orderStore = useOrderStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const showReturnDialog = ref(false)
const showRepairDialog = ref(false)
const showSettleDialog = ref(false)
const showDisputeDialog = ref(false)
const showReturnRepairDialog = ref(false)
const showSubmitReviewDialog = ref(false)

const repairDamageCause = ref('')
const repairEstimatedCost = ref(0)
const repairLiability = ref<LiabilityParty>('customer')
const returnRepairReason = ref('')
const disputeResolution = ref('')
const disputeLiability = ref<LiabilityParty>('undetermined')
const repairActualCost = ref(0)

const order = computed(() => {
  if (!currentOrderId.value) return null
  return orderStore.getOrderById(currentOrderId.value) ?? null
})

const instrument = computed(() => {
  if (!order.value) return null
  return orderStore.getInstrumentById(order.value.instrumentId) ?? null
})

const customer = computed(() => {
  if (!order.value) return null
  return orderStore.getCustomerById(order.value.customerId) ?? null
})

const isCompleted = computed(() => order.value?.status === 'completed')
const isSettlementCompleted = computed(() => order.value?.depositSettlement?.status === 'completed')
const isReadonly = computed(() => isCompleted.value || isSettlementCompleted.value)

interface ActionButton {
  label: string
  variant: 'primary' | 'secondary' | 'danger'
  action: () => void
}

const actionButtons = computed<ActionButton[]>(() => {
  if (!order.value || !authStore.currentRole || isReadonly.value) return []
  const status = order.value.status
  const role = authStore.currentRole
  const buttons: ActionButton[] = []

  if (status === 'checkout_pending' && (role === 'consultant' || role === 'boss')) {
    buttons.push({ label: '办理租出', variant: 'primary', action: () => handleAction('租出办理') })
  }

  if ((status === 'checked_out' || status === 'overdue') && (role === 'consultant' || role === 'boss')) {
    buttons.push({ label: '办理归还', variant: 'primary', action: () => handleAction('办理归还') })
  }

  if (status === 'damage_assessing' && role === 'boss') {
    buttons.push({ label: '创建维修任务', variant: 'primary', action: () => handleAction('创建维修任务') })
    buttons.push({ label: '直接结算', variant: 'secondary', action: () => handleAction('直接结算') })
  }

  if (status === 'repairing' && role === 'repair' && order.value.repairTask?.status === 'in_progress') {
    buttons.push({ label: '提交复检', variant: 'primary', action: () => handleAction('提交复检') })
  }

  if (status === 'repairing' && role === 'repair' && order.value.repairTask?.status === 'returned') {
    buttons.push({ label: '重新接回', variant: 'primary', action: () => handleAction('重新接回') })
  }

  if (status === 'repairing' && role === 'repair' && order.value.repairTask?.status === 'pending') {
    buttons.push({ label: '接单维修', variant: 'primary', action: () => handleAction('接单维修') })
  }

  if (status === 'repair_reviewing' && (role === 'consultant' || role === 'boss')) {
    buttons.push({ label: '复检通过', variant: 'primary', action: () => handleAction('复检通过') })
    buttons.push({ label: '退回重修', variant: 'danger', action: () => handleAction('退回重修') })
  }

  if (status === 'settling' && role === 'boss' && !isSettlementCompleted.value) {
    buttons.push({ label: '确认结算', variant: 'primary', action: () => handleAction('确认结算') })
  }

  if (status === 'disputed' && role === 'boss') {
    buttons.push({ label: '解决争议', variant: 'primary', action: () => handleAction('解决争议') })
  }

  return buttons
})

function handleAction(action: string) {
  if (!order.value) return
  const orderId = order.value.id

  switch (action) {
    case '租出办理':
      closePanel()
      router.push('/checkout')
      break
    case '办理归还':
      closePanel()
      router.push(`/return/${orderId}`)
      break
    case '创建维修任务':
      repairDamageCause.value = ''
      repairEstimatedCost.value = 0
      repairLiability.value = 'customer'
      showRepairDialog.value = true
      break
    case '直接结算':
      showSettleDialog.value = true
      break
    case '接单维修':
    case '重新接回':
      orderStore.updateRepairTask(orderId, { status: 'in_progress' }, authStore.userName)
      notificationStore.showToast(action + '成功', 'success')
      break
    case '提交复检':
      repairActualCost.value = order.value.repairTask?.actualCost || order.value.repairTask?.estimatedCost || 0
      showSubmitReviewDialog.value = true
      break
    case '复检通过':
      orderStore.updateRepairTask(orderId, { status: 'completed' }, authStore.userName)
      notificationStore.showToast('复检通过', 'success')
      break
    case '退回重修':
      returnRepairReason.value = ''
      showReturnRepairDialog.value = true
      break
    case '确认结算':
      showSettleDialog.value = true
      break
    case '解决争议':
      disputeResolution.value = ''
      disputeLiability.value = 'undetermined'
      showDisputeDialog.value = true
      break
  }
}

function createRepairTask() {
  if (!order.value) return
  orderStore.createRepairTask(
    order.value.id,
    {
      assignedTo: authStore.userName,
      damageCause: repairDamageCause.value,
      estimatedCost: repairEstimatedCost.value,
      liabilityParty: repairLiability.value,
    }
  )
  showRepairDialog.value = false
  notificationStore.showToast('维修任务已创建', 'success')
}

function submitRepairReview() {
  if (!order.value) return
  orderStore.updateRepairTask(order.value.id, { status: 'review', actualCost: repairActualCost.value }, authStore.userName)
  showSubmitReviewDialog.value = false
  notificationStore.showToast('已提交复检', 'success')
}

function returnRepair() {
  if (!order.value || !returnRepairReason.value) return
  orderStore.updateRepairTask(order.value.id, { status: 'returned', returnReason: returnRepairReason.value }, authStore.userName)
  showReturnRepairDialog.value = false
  notificationStore.showToast('已退回重修', 'info')
}

function resolveDispute() {
  if (!order.value || !disputeResolution.value) return
  orderStore.resolveDispute(order.value.id, disputeResolution.value, authStore.userName)
  showDisputeDialog.value = false
  notificationStore.showToast('争议已解决', 'success')
}

function confirmSettleDeposit() {
  if (!order.value) return
  const deductions = order.value.depositSettlement?.deductions.map(d => ({
    type: d.type,
    amount: d.amount,
    description: d.description,
    isDisputed: d.isDisputed,
  })) || []
  orderStore.settleDeposit(order.value.id, deductions, authStore.userName)
  showSettleDialog.value = false
  notificationStore.showToast('结算已完成', 'success')
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 z-40"
        @click="closePanel"
      />
    </Transition>

    <Transition name="panel">
      <div
        v-if="isOpen && order"
        class="fixed top-0 right-0 w-[400px] h-screen bg-bg-secondary border-l border-border z-50 flex flex-col shadow-2xl"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 class="text-base font-semibold text-txt-primary">订单详情</h2>
          <button
            @click="closePanel"
            class="p-1.5 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-bg-tertiary transition-colors"
          >
            <X :size="18" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-5">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-txt-muted">订单编号</span>
              <span class="text-sm font-medium text-txt-primary font-mono">{{ order.orderNo }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-txt-muted">乐器名称</span>
              <span class="text-sm text-txt-primary">{{ instrument?.name ?? '-' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-txt-muted">客户名称</span>
              <span class="text-sm text-txt-primary">{{ customer?.name ?? '-' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-txt-muted">订单状态</span>
              <StatusBadge :status="order.status" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-txt-muted">押金金额</span>
              <span class="text-sm font-medium text-accent">{{ formatAmount(order.depositAmount) }}</span>
            </div>
          </div>

          <div v-if="isReadonly" class="space-y-2 pt-2 border-t border-border">
            <p class="text-xs text-txt-muted uppercase tracking-wider">状态</p>
            <div class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div class="flex items-center gap-2">
                <CheckCircle2 :size="16" class="text-emerald-400" />
                <span class="text-sm text-emerald-400">
                  {{ isCompleted ? '订单已完成' : '押金已结算' }}
                </span>
              </div>
            </div>
          </div>

          <div v-else-if="actionButtons.length > 0" class="space-y-2 pt-2 border-t border-border">
            <p class="text-xs text-txt-muted uppercase tracking-wider">操作</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(btn, idx) in actionButtons"
                :key="idx"
                @click="btn.action"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                  btn.variant === 'primary' && 'bg-accent hover:bg-accent-hover text-bg-primary',
                  btn.variant === 'secondary' && 'bg-bg-tertiary hover:bg-border text-txt-primary',
                  btn.variant === 'danger' && 'bg-red-500/15 hover:bg-red-500/25 text-red-400',
                ]"
              >
                {{ btn.label }}
              </button>
            </div>
          </div>

          <div class="pt-2 border-t border-border">
            <p class="text-xs text-txt-muted uppercase tracking-wider mb-3">操作记录</p>
            <div class="space-y-0">
              <div
                v-for="(log, idx) in [...order.logs].reverse()"
                :key="log.id"
                class="relative flex gap-3 pb-4"
              >
                <div class="flex flex-col items-center">
                  <div class="w-2 h-2 rounded-full bg-accent/60 mt-1.5 shrink-0" />
                  <div
                    v-if="idx < order.logs.length - 1"
                    class="w-px flex-1 bg-border mt-1"
                  />
                </div>
                <div class="min-w-0 flex-1 -mt-0.5">
                  <p class="text-sm text-txt-primary">{{ log.action }}</p>
                  <p v-if="log.note" class="text-xs text-txt-secondary mt-0.5 truncate">{{ log.note }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="inline-flex items-center gap-1 text-xs text-txt-muted">
                      <User :size="10" />
                      {{ log.operator }}
                    </span>
                    <span class="inline-flex items-center gap-1 text-xs text-txt-muted">
                      <Clock :size="10" />
                      {{ formatDateTime(log.operatedAt) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <ConfirmDialog
      :show="showReturnDialog"
      title="办理归还"
      message="确定要为该订单办理归还吗？"
      confirmLabel="确认办理"
      @confirm="() => { order && router.push(`/return/${order.id}`); closePanel() }"
      @cancel="showReturnDialog = false"
    />

    <ConfirmDialog
      :show="showRepairDialog"
      title="创建维修任务"
      message="请填写维修相关信息。"
      confirmLabel="创建任务"
      @confirm="createRepairTask"
      @cancel="showRepairDialog = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-txt-secondary mb-2">损坏原因</label>
          <textarea
            v-model="repairDamageCause"
            placeholder="请描述损坏情况..."
            rows="2"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 resize-none"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-txt-secondary mb-2">预估费用</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted">¥</span>
              <input
                v-model.number="repairEstimatedCost"
                type="number"
                placeholder="0"
                class="w-full pl-7 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm text-txt-secondary mb-2">责任判定</label>
            <select
              v-model="repairLiability"
              class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary focus:outline-none focus:border-accent/50"
            >
              <option value="customer">客户责任</option>
              <option value="natural">自然损耗</option>
              <option value="quality">质量问题</option>
              <option value="undetermined">待判定</option>
            </select>
          </div>
        </div>
      </div>
    </ConfirmDialog>

    <ConfirmDialog
      :show="showSubmitReviewDialog"
      title="提交复检"
      message="维修完成，提交复检。"
      confirmLabel="提交"
      @confirm="submitRepairReview"
      @cancel="showSubmitReviewDialog = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-txt-secondary mb-2">实际维修费用</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted">¥</span>
            <input
              v-model.number="repairActualCost"
              type="number"
              placeholder="0"
              class="w-full pl-7 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50"
            />
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

    <ConfirmDialog
      :show="showDisputeDialog"
      title="裁定争议"
      message="请确认争议裁定结果。"
      confirmLabel="确认裁定"
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
            <option value="natural">自然损耗</option>
            <option value="quality">质量问题</option>
            <option value="undetermined">待判定</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-txt-secondary mb-2">裁定说明</label>
          <textarea
            v-model="disputeResolution"
            placeholder="请描述裁定理由..."
            rows="3"
            class="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent/50 resize-none"
          />
        </div>
      </div>
    </ConfirmDialog>

    <ConfirmDialog
      :show="showSettleDialog"
      title="押金结算"
      message="确认后将完成押金结算，退款金额将退还客户。此操作不可撤销。"
      confirmLabel="确认结算"
      @confirm="confirmSettleDeposit"
      @cancel="showSettleDialog = false"
    />
  </Teleport>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.panel-enter-active {
  animation: slide-in-right 0.3s ease-out;
}
.panel-leave-active {
  animation: slide-in-right 0.2s ease-in reverse;
}
</style>
