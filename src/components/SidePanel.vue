<script setup lang="ts">
import { computed } from 'vue'
import { X, Clock, User } from 'lucide-vue-next'
import { useSidePanel } from '@/composables/useSidePanel'
import { useOrderStore } from '@/stores/order'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'

const { isOpen, currentOrderId, closePanel } = useSidePanel()
const orderStore = useOrderStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

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

interface ActionButton {
  label: string
  variant: 'primary' | 'secondary' | 'danger'
  action: () => void
}

const actionButtons = computed<ActionButton[]>(() => {
  if (!order.value || !authStore.currentRole) return []
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

  if (status === 'repairing' && role === 'repair') {
    buttons.push({ label: '提交复检', variant: 'primary', action: () => handleAction('提交复检') })
  }

  if (status === 'repair_reviewing' && (role === 'consultant' || role === 'boss')) {
    buttons.push({ label: '复检通过', variant: 'primary', action: () => handleAction('复检通过') })
    buttons.push({ label: '退回重修', variant: 'danger', action: () => handleAction('退回重修') })
  }

  if (status === 'settling' && role === 'boss') {
    buttons.push({ label: '确认结算', variant: 'primary', action: () => handleAction('确认结算') })
  }

  if (status === 'disputed' && role === 'boss') {
    buttons.push({ label: '解决争议', variant: 'primary', action: () => handleAction('解决争议') })
  }

  return buttons
})

function handleAction(action: string) {
  if (!order.value) return
  notificationStore.showToast(`${action} - ${order.value.orderNo}`, 'info')
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

          <div v-if="actionButtons.length > 0" class="space-y-2 pt-2 border-t border-border">
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
