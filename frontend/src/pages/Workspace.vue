<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ListChecks,
  Play,
  AlertTriangle,
  Edit3,
  RotateCcw,
  Undo2,
  ChevronRight,
  Clock,
  User,
  Phone,
  Calendar,
  Eye,
  Filter,
  Sparkles,
} from 'lucide-vue-next'
import { useOrderStore } from '@/stores/order'
import { useReviewStore } from '@/stores/review'
import { useRole } from '@/composables/useRole'
import RoleHeader from '@/components/RoleHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import FlowTimeline from '@/components/FlowTimeline.vue'
import BatchReviewPanel from '@/components/BatchReviewPanel.vue'
import { scenarios } from '@/data/scenarios'
import {
  formatDateTime,
  formatDate,
  formatPrice,
  formatPhone,
  changeTypeLabels,
} from '@/lib/utils'
import type { Order } from '@/types'

const orderStore = useOrderStore()
const reviewStore = useReviewStore()
const { currentRole } = useRole()

const showReviewPanel = ref(false)
const selectedOrderId = ref<string | null>(null)
const activeScenario = ref<string | null>(null)
const orderFilter = ref<'all' | 'pending' | 'processing' | 'exception'>('all')

const filteredOrders = computed(() => {
  let orders = [...orderStore.orders]

  if (activeScenario.value) {
    const scenario = scenarios.find(s => s.id === activeScenario.value)
    if (scenario) {
      orders = orders.filter(o => scenario.orderIds.includes(o.id))
    }
  }

  if (orderFilter.value === 'pending') {
    orders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed')
  } else if (orderFilter.value === 'processing') {
    orders = orders.filter(o => o.status === 'scheduled' || o.status === 'producing')
  } else if (orderFilter.value === 'exception') {
    orders = orders.filter(o => o.status === 'exception')
  }

  return orders.sort((a, b) => {
    const statusOrder = { exception: 0, refunded: 1, pending: 2, confirmed: 3, scheduled: 4, producing: 5, completed: 6 }
    const diff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
    if (diff !== 0) return diff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const selectedOrder = computed(() => {
  if (!selectedOrderId.value) return null
  return orderStore.getOrderById(selectedOrderId.value)
})

const orderChanges = computed(() => {
  if (!selectedOrderId.value) return []
  return orderStore.getChangesByOrderId(selectedOrderId.value)
})

const pendingReviewCount = computed(() => reviewStore.pendingReviews.length)

const scenarioColors: Record<string, string> = {
  normal: 'bg-green-100 text-green-700 border-green-200',
  change: 'bg-purple-100 text-purple-700 border-purple-200',
  exception: 'bg-orange-100 text-orange-700 border-orange-200',
  refund: 'bg-red-100 text-red-700 border-red-200',
}

function selectOrder(orderId: string) {
  selectedOrderId.value = selectedOrderId.value === orderId ? null : orderId
}

function selectScenario(scenarioId: string | null) {
  activeScenario.value = activeScenario.value === scenarioId ? null : scenarioId
  selectedOrderId.value = null
}

function getOrderTags(order: Order) {
  const tags: { label: string; type: string }[] = []
  const changes = orderStore.getChangesByOrderId(order.id)
  if (changes.length > 0) {
    tags.push({ label: '已改单', type: 'change' })
  }
  if (order.status === 'exception') {
    tags.push({ label: '异常', type: 'exception' })
  }
  if (order.status === 'refunded') {
    tags.push({ label: '已退款', type: 'refund' })
  }
  return tags
}
</script>

<template>
  <div class="workspace-page">
    <RoleHeader />

    <div class="flex gap-6">
      <div class="flex-1 min-w-0">
        <div class="card p-4 mb-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-bakery-500" />
              <span class="font-medium text-bakery-800">样例场景</span>
              <span class="text-xs text-bakery-500">点击切换查看不同流程</span>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-3">
            <div
              v-for="scenario in scenarios"
              :key="scenario.id"
              class="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md"
              :class="[
                activeScenario === scenario.id
                  ? 'border-bakery-500 bg-bakery-50 shadow-md'
                  : 'border-bakery-200 bg-white hover:border-bakery-300'
              ]"
              @click="selectScenario(scenario.id)"
            >
              <div class="flex items-center gap-2 mb-1.5">
                <span
                  class="text-xs px-2 py-0.5 rounded-full border font-medium"
                  :class="scenarioColors[scenario.flowType]"
                >
                  {{ scenario.name }}
                </span>
              </div>
              <p class="text-xs text-bakery-600 line-clamp-2">
                {{ scenario.description }}
              </p>
              <div class="flex items-center gap-1 mt-2 text-xs text-bakery-400">
                <span>{{ scenario.orderIds.length }} 个订单</span>
                <ChevronRight class="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between px-5 py-4 border-b border-bakery-100">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-bakery-100 flex items-center justify-center">
                <ListChecks class="w-4 h-4 text-bakery-600" />
              </div>
              <div>
                <h3 class="font-semibold text-bakery-800">订单处理列表</h3>
                <p class="text-xs text-bakery-500">共 {{ filteredOrders.length }} 个订单</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1 bg-bakery-50 rounded-lg p-1">
                <button
                  v-for="filter in [
                    { value: 'all', label: '全部' },
                    { value: 'pending', label: '待处理' },
                    { value: 'processing', label: '进行中' },
                    { value: 'exception', label: '异常' },
                  ]"
                  :key="filter.value"
                  class="px-3 py-1.5 text-sm rounded-md transition-colors"
                  :class="orderFilter === filter.value ? 'bg-white text-bakery-800 shadow-sm font-medium' : 'text-bakery-500 hover:text-bakery-700'"
                  @click="orderFilter = filter.value as any"
                >
                  {{ filter.label }}
                </button>
              </div>

              <button
                class="btn-primary flex items-center gap-2 relative"
                @click="showReviewPanel = true"
              >
                <ListChecks class="w-4 h-4" />
                批量复核
                <span
                  v-if="pendingReviewCount > 0"
                  class="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-accent text-white text-xs rounded-full flex items-center justify-center font-medium"
                >
                  {{ pendingReviewCount }}
                </span>
              </button>
            </div>
          </div>

          <div class="divide-y divide-bakery-100">
            <div
              v-for="order in filteredOrders"
              :key="order.id"
              class="hover:bg-bakery-50/50 transition-colors cursor-pointer"
              :class="{ 'bg-bakery-50': selectedOrderId === order.id }"
              @click="selectOrder(order.id)"
            >
              <div class="px-5 py-4">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="font-mono text-sm text-bakery-500">{{ order.id }}</span>
                      <StatusBadge :status="order.status" type="order" />
                      <span
                        v-for="tag in getOrderTags(order)"
                        :key="tag.type"
                        class="text-xs px-2 py-0.5 rounded-full"
                        :class="tag.type === 'change' ? 'bg-purple-100 text-purple-700' : tag.type === 'refund' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'"
                      >
                        {{ tag.label }}
                      </span>
                    </div>

                    <div class="flex items-center gap-4 text-sm text-bakery-700">
                      <div class="flex items-center gap-1.5">
                        <User class="w-4 h-4 text-bakery-400" />
                        <span class="font-medium">{{ order.customerName }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <Phone class="w-4 h-4 text-bakery-400" />
                        <span class="font-mono">{{ formatPhone(order.phone) }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <Calendar class="w-4 h-4 text-bakery-400" />
                        <span>{{ order.pickupDate }} {{ order.pickupTime }}</span>
                      </div>
                    </div>

                    <div class="mt-2 flex items-center gap-3">
                      <div class="text-sm text-bakery-600">
                        {{ order.items.map(i => `${i.name}×${i.quantity}`).join('、') }}
                      </div>
                      <div class="text-sm font-mono font-medium text-bakery-800">
                        {{ formatPrice(order.totalPrice) }}
                      </div>
                    </div>

                    <div v-if="order.remark" class="mt-2 text-xs text-bakery-500 bg-bakery-50 px-2.5 py-1.5 rounded inline-block">
                      备注：{{ order.remark }}
                    </div>

                    <div v-if="orderChanges.length > 0 && selectedOrderId !== order.id" class="mt-2">
                      <div
                        v-for="change in orderChanges.slice(0, 1)"
                        :key="change.id"
                        class="text-xs text-purple-600 flex items-center gap-1"
                      >
                        <Edit3 class="w-3 h-3" />
                        {{ changeTypeLabels[change.changeType] }}：{{ change.oldValue }} → {{ change.newValue }}
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                    <div class="text-xs text-bakery-400 flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      {{ formatDateTime(order.createdAt) }}
                    </div>
                    <button
                      class="btn-ghost text-xs flex items-center gap-1"
                      @click.stop="selectOrder(order.id)"
                    >
                      <Eye class="w-3.5 h-3.5" />
                      {{ selectedOrderId === order.id ? '收起' : '查看流程' }}
                    </button>
                  </div>
                </div>

                <Transition name="slide-down">
                  <div v-if="selectedOrderId === order.id" class="mt-4 pt-4 border-t border-bakery-200">
                    <div class="grid grid-cols-3 gap-6">
                      <div class="col-span-2">
                        <FlowTimeline :order-id="order.id" />
                      </div>
                      <div class="space-y-3">
                        <div class="p-3 bg-bakery-50 rounded-lg border border-bakery-100">
                          <div class="text-xs text-bakery-500 mb-1.5">订单商品</div>
                          <div class="space-y-1">
                            <div
                              v-for="(item, idx) in order.items"
                              :key="idx"
                              class="flex justify-between text-sm"
                            >
                              <span class="text-bakery-700">{{ item.name }}</span>
                              <span class="text-bakery-800 font-mono">×{{ item.quantity }}</span>
                            </div>
                          </div>
                          <div class="flex justify-between text-sm font-medium pt-2 mt-2 border-t border-bakery-200">
                            <span class="text-bakery-800">合计</span>
                            <span class="text-bakery-800 font-mono">{{ formatPrice(order.totalPrice) }}</span>
                          </div>
                        </div>

                        <div v-if="orderChanges.length > 0" class="p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div class="text-xs text-purple-600 mb-1.5 font-medium">改单记录</div>
                          <div class="space-y-2">
                            <div
                              v-for="change in orderChanges"
                              :key="change.id"
                              class="text-sm text-bakery-700"
                            >
                              <div class="flex items-center gap-1 text-xs text-purple-600 mb-0.5">
                                <Edit3 class="w-3 h-3" />
                                {{ changeTypeLabels[change.changeType] }}
                              </div>
                              <div class="text-xs">
                                <span class="text-bakery-500">{{ change.oldValue }}</span>
                                <span class="mx-1">→</span>
                                <span class="text-bakery-800 font-medium">{{ change.newValue }}</span>
                              </div>
                              <div class="text-xs text-bakery-500 mt-0.5">
                                原因：{{ change.reason }}
                              </div>
                              <div class="flex items-center gap-1 mt-0.5">
                                <span
                                  class="text-xs px-1.5 py-0.5 rounded"
                                  :class="change.pushedToSchedule ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
                                >
                                  {{ change.pushedToSchedule ? '已推送排产' : '待推送排产' }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="flex gap-2">
                          <button
                            class="btn-secondary flex-1 text-xs py-1.5"
                            @click.stop
                          >
                            <RotateCcw class="w-3.5 h-3.5 inline mr-1" />
                            登记异常
                          </button>
                          <button
                            class="btn-primary flex-1 text-xs py-1.5"
                            @click.stop="showReviewPanel = true"
                          >
                            <ListChecks class="w-3.5 h-3.5 inline mr-1" />
                            去复核
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BatchReviewPanel
      :visible="showReviewPanel"
      @close="showReviewPanel = false"
      @processed="() => {}"
    />
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 800px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

