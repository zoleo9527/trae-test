<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  Check,
  XCircle,
  CheckCircle2,
  Square,
  CheckSquare,
  Filter,
  ChevronDown,
  ChevronRight,
  Edit,
  RotateCcw,
  Undo2,
  AlertCircle,
  Eye,
} from 'lucide-vue-next'
import { useReviewStore } from '@/stores/review'
import { useOrderStore } from '@/stores/order'
import { useRefundStore } from '@/stores/refund'
import { useRemakeStore } from '@/stores/remake'
import { useRole } from '@/composables/useRole'
import StatusBadge from '@/components/StatusBadge.vue'
import FlowTimeline from '@/components/FlowTimeline.vue'
import {
  reviewTypeLabels,
  formatDateTime,
  formatPrice,
  changeTypeLabels,
  remakeCategoryLabels,
} from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ReviewItem } from '@/types'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'processed'): void
}>()

const reviewStore = useReviewStore()
const orderStore = useOrderStore()
const refundStore = useRefundStore()
const { roleName } = useRole()

const selectedIds = ref<Set<string>>(new Set())
const activeFilter = ref<'all' | 'change' | 'remake' | 'refund'>('all')
const expandedId = ref<string | null>(null)
const processing = ref(false)
const showSuccessToast = ref(false)
const toastMessage = ref('')

const pendingItems = computed(() => {
  let items = reviewStore.pendingReviews
  if (activeFilter.value !== 'all') {
    items = items.filter(i => i.type === activeFilter.value)
  }
  return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})

const allSelected = computed(() => {
  return pendingItems.value.length > 0 && pendingItems.value.every(i => selectedIds.value.has(i.id))
})

const selectedCount = computed(() => selectedIds.value.size)

const typeIcon: Record<string, any> = {
  change: Edit,
  remake: RotateCcw,
  refund: Undo2,
}

const typeColor: Record<string, string> = {
  change: 'text-purple-600 bg-purple-50',
  remake: 'text-orange-600 bg-orange-50',
  refund: 'text-red-600 bg-red-50',
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    selectedIds.value = new Set(pendingItems.value.map(i => i.id))
  }
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function getItemDetail(item: ReviewItem) {
  const order = orderStore.getOrderById(item.orderId)
  if (!order) return null

  if (item.type === 'change') {
    const change = orderStore.getChangesByOrderId(item.orderId).find(c => c.id === item.targetId)
    return {
      order,
      change,
      typeLabel: change ? changeTypeLabels[change.changeType] : '改单',
      content: change ? `${change.oldValue} → ${change.newValue}` : item.summary,
      reason: change?.reason,
    }
  }
  if (item.type === 'remake') {
    return {
      order,
      typeLabel: remakeCategoryLabels.quality,
      content: item.summary,
    }
  }
  if (item.type === 'refund') {
    const refund = refundStore.refunds.find(r => r.id === item.targetId)
    return {
      order,
      refund,
      typeLabel: '退款申请',
      content: refund?.reason || item.summary,
      amount: refund?.amount,
    }
  }
  return { order, content: item.summary }
}

async function batchApprove() {
  if (selectedCount.value === 0) return
  processing.value = true

  await new Promise(resolve => setTimeout(resolve, 500))

  for (const id of selectedIds.value) {
    const item = reviewStore.reviewItems.find(i => i.id === id)
    if (!item) continue

    reviewStore.approveItem(id, roleName.value)

    if (item.type === 'change') {
      orderStore.pushChangeToSchedule(item.targetId)
    } else if (item.type === 'remake') {
      const remakeStore = useRemakeStore()
      const ticket = remakeStore.tickets.find(t => t.id === item.targetId)
      if (ticket && ticket.status === 'open') {
        remakeStore.updateTicketStatus(item.targetId, 'scheduled')
      }
    } else if (item.type === 'refund') {
      refundStore.approveRefund(item.targetId, roleName.value)
      orderStore.updateOrderStatus(item.orderId, 'refunded')
    }
  }

  toastMessage.value = `已批量通过 ${selectedCount.value} 项复核`
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 2000)

  selectedIds.value.clear()
  processing.value = false
  emit('processed')
}

async function batchReject() {
  if (selectedCount.value === 0) return
  processing.value = true

  await new Promise(resolve => setTimeout(resolve, 500))

  for (const id of selectedIds.value) {
    const item = reviewStore.reviewItems.find(i => i.id === id)
    if (!item) continue

    reviewStore.rejectItem(id, roleName.value)

    if (item.type === 'refund') {
      refundStore.rejectRefund(item.targetId, roleName.value)
    } else if (item.type === 'remake') {
      const remakeStore = useRemakeStore()
      const ticket = remakeStore.tickets.find(t => t.id === item.targetId)
      if (ticket && ticket.status === 'open') {
        remakeStore.updateTicketStatus(item.targetId, 'closed')
      }
    } else if (item.type === 'change') {
      const change = orderStore.changes.find(c => c.id === item.targetId)
      if (change) {
        change.pushedToSchedule = false
      }
    }
  }

  toastMessage.value = `已批量拒绝 ${selectedCount.value} 项复核`
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 2000)

  selectedIds.value.clear()
  processing.value = false
  emit('processed')
}

function handleApproveSingle(id: string) {
  selectedIds.value = new Set([id])
  batchApprove()
}

function handleRejectSingle(id: string) {
  selectedIds.value = new Set([id])
  batchReject()
}

watch(
  () => props.visible,
  (val) => {
    if (!val) {
      selectedIds.value.clear()
      expandedId.value = null
    }
  },
)
</script>

<template>
  <Transition name="slide">
    <div
      v-if="visible"
      class="fixed inset-y-0 right-0 w-[700px] bg-white shadow-2xl border-l border-bakery-200 flex flex-col z-50"
    >
      <div class="flex items-center justify-between px-5 py-4 border-b border-bakery-200 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-bakery-100 flex items-center justify-center">
            <Filter class="w-4 h-4 text-bakery-600" />
          </div>
          <div>
            <h3 class="font-semibold text-bakery-800">批量复核面板</h3>
            <p class="text-xs text-bakery-500">{{ pendingItems.length }} 项待处理，勾选后可批量操作</p>
          </div>
        </div>
        <button
          class="p-2 rounded-lg hover:bg-bakery-100 transition-colors"
          @click="emit('close')"
        >
          <X class="w-5 h-5 text-bakery-500" />
        </button>
      </div>

      <div class="flex items-center gap-2 px-5 py-3 border-b border-bakery-100 bg-bakery-50 flex-shrink-0">
        <button
          v-for="filter in [
            { value: 'all', label: '全部' },
            { value: 'change', label: '改单' },
            { value: 'remake', label: '补做' },
            { value: 'refund', label: '退款' },
          ]"
          :key="filter.value"
          class="px-3 py-1.5 text-sm rounded-lg transition-colors"
          :class="activeFilter === filter.value ? 'bg-bakery-500 text-white' : 'bg-white text-bakery-600 hover:bg-bakery-100 border border-bakery-200'"
          @click="activeFilter = filter.value as any"
        >
          {{ filter.label }}
        </button>

        <div class="flex-1" />

        <button
          class="flex items-center gap-1.5 text-sm text-bakery-600 hover:text-bakery-800"
          @click="toggleSelectAll"
        >
          <component :is="allSelected ? CheckSquare : Square" class="w-4 h-4" />
          {{ allSelected ? '取消全选' : '全选' }}
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="pendingItems.length === 0" class="flex flex-col items-center justify-center py-16 text-bakery-400">
          <CheckCircle2 class="w-12 h-12 mb-3 text-green-500" />
          <p class="text-sm">暂无待复核项</p>
        </div>

        <div v-else class="divide-y divide-bakery-100">
          <div
            v-for="item in pendingItems"
            :key="item.id"
            class="group"
            :class="selectedIds.has(item.id) ? 'bg-bakery-50' : 'hover:bg-bakery-50/50'"
          >
            <div class="flex items-start gap-3 px-5 py-4">
              <button
                class="mt-1 flex-shrink-0"
                @click="toggleSelect(item.id)"
              >
                <component
                  :is="selectedIds.has(item.id) ? CheckSquare : Square"
                  class="w-5 h-5"
                  :class="selectedIds.has(item.id) ? 'text-bakery-500' : 'text-bakery-300 group-hover:text-bakery-500'"
                />
              </button>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-7 h-7 rounded flex items-center justify-center"
                      :class="typeColor[item.type]"
                    >
                      <component :is="typeIcon[item.type]" class="w-4 h-4" />
                    </div>
                    <span class="text-xs font-medium" :class="typeColor[item.type].split(' ')[0]">
                      {{ reviewTypeLabels[item.type] }}
                    </span>
                    <span class="text-xs text-bakery-400 font-mono">{{ item.id }}</span>
                  </div>
                  <span class="text-xs text-bakery-400 flex-shrink-0">
                    {{ formatDateTime(item.createdAt) }}
                  </span>
                </div>

                <div class="mt-2 flex items-center gap-2">
                  <span class="text-sm font-medium text-bakery-800">
                    {{ item.summary }}
                  </span>
                </div>

                <div class="mt-1.5 flex items-center gap-3 text-xs text-bakery-500">
                  <span>订单：{{ item.orderId }}</span>
                  <span v-if="getItemDetail(item)?.order">
                    客户：{{ getItemDetail(item)?.order?.customerName }}
                  </span>
                  <span v-if="getItemDetail(item)?.amount" class="text-accent font-mono">
                    金额：{{ formatPrice(getItemDetail(item)?.amount || 0) }}
                  </span>
                </div>

                <div class="mt-3 flex items-center gap-2">
                  <button
                    class="flex items-center gap-1 text-xs text-bakery-500 hover:text-bakery-700"
                    @click="toggleExpand(item.id)"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    查看详情
                    <component :is="expandedId === item.id ? ChevronDown : ChevronRight" class="w-3.5 h-3.5" />
                  </button>

                  <div class="flex-1" />

                  <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      class="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      :disabled="processing"
                      @click="handleApproveSingle(item.id)"
                    >
                      通过
                    </button>
                    <button
                      class="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      :disabled="processing"
                      @click="handleRejectSingle(item.id)"
                    >
                      拒绝
                    </button>
                  </div>
                </div>

                <Transition name="expand">
                  <div v-if="expandedId === item.id" class="mt-3 border border-bakery-200 rounded-lg overflow-hidden">
                    <div class="grid grid-cols-2 gap-4 p-4 bg-bakery-50">
                      <div>
                        <div class="text-xs text-bakery-500 mb-1">订单详情</div>
                        <div v-if="getItemDetail(item)?.order" class="text-sm text-bakery-800">
                          <p class="font-medium">{{ getItemDetail(item)?.order?.customerName }}</p>
                          <p class="text-bakery-600 mt-0.5">
                            {{ getItemDetail(item)?.order?.items?.map((i: any) => `${i.name}×${i.quantity}`).join('、') }}
                          </p>
                          <p class="text-bakery-600 font-mono mt-0.5">
                            {{ formatPrice(getItemDetail(item)?.order?.totalPrice || 0) }}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div class="text-xs text-bakery-500 mb-1">申请内容</div>
                        <div class="text-sm text-bakery-800">
                          <p class="font-medium">{{ reviewTypeLabels[item.type] }}</p>
                          <p class="text-bakery-600 mt-0.5">{{ getItemDetail(item)?.content }}</p>
                          <p v-if="getItemDetail(item)?.reason" class="text-bakery-500 text-xs mt-1">
                            原因：{{ getItemDetail(item)?.reason }}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div class="p-4 border-t border-bakery-200 bg-white">
                      <FlowTimeline :order-id="item.orderId" />
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-bakery-200 px-5 py-4 bg-bakery-50 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="text-sm text-bakery-600">
            <span v-if="selectedCount > 0" class="font-medium text-bakery-800">
              已选择 {{ selectedCount }} 项
            </span>
            <span v-else class="text-bakery-400">
              勾选待处理项进行批量操作
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="btn-secondary"
              :disabled="selectedCount === 0 || processing"
              :class="{ 'opacity-50 cursor-not-allowed': selectedCount === 0 || processing }"
              @click="batchReject"
            >
              <XCircle class="w-4 h-4 inline mr-1.5" />
              批量拒绝
            </button>
            <button
              class="btn-primary"
              :disabled="selectedCount === 0 || processing"
              :class="{ 'opacity-50 cursor-not-allowed': selectedCount === 0 || processing }"
              @click="batchApprove"
            >
              <Check class="w-4 h-4 inline mr-1.5" />
              批量通过
            </button>
          </div>
        </div>
      </div>

      <Transition name="toast">
        <div
          v-if="showSuccessToast"
          class="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 z-[100]"
        >
          <CheckCircle2 class="w-5 h-5" />
          <span class="text-sm font-medium">{{ toastMessage }}</span>
        </div>
      </Transition>
    </div>
  </Transition>

  <Transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/20 z-40"
      @click="emit('close')"
    />
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 600px;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
