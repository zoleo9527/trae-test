<template>
  <div class="h-full flex flex-col -m-8">
    <div class="bg-white border-b border-gold-100 p-6 flex-shrink-0">
      <div class="flex flex-col lg:flex-row lg:items-center gap-4">
        <div class="flex-1">
          <BaseInput
            v-model="searchQuery"
            placeholder="搜索订单号、客户姓名、电话..."
            :icon="Search"
            class="max-w-lg"
          />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex gap-2">
            <button
              v-for="statusFilter in statusFilters"
              :key="statusFilter.value"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                activeStatus.includes(statusFilter.value as any)
                  ? 'bg-gold-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
              @click="toggleStatusFilter(statusFilter.value as any)"
            >
              {{ statusFilter.label }}
              <span class="ml-1 opacity-75">({{ statusFilter.count }})</span>
            </button>
          </div>
          <div class="h-6 w-px bg-gray-200"></div>
          <select
            v-model="selectedType"
            class="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none"
          >
            <option value="">全部类型</option>
            <option value="custom">定制</option>
            <option value="repair">返修</option>
            <option value="remodel">改款</option>
            <option value="transfer">调货</option>
          </select>
        </div>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div :class="['overflow-auto transition-all duration-300', selectedOrder ? 'lg:w-1/2' : 'w-full']">
        <div class="p-6 space-y-4">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            :class="[
              'card p-4 cursor-pointer transition-all duration-200',
              selectedOrder?.id === order.id ? 'ring-2 ring-gold-400 bg-gold-50/50' : ''
            ]"
            @click="selectOrder(order)"
          >
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-gold-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Diamond class="w-6 h-6 text-gold-600" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-semibold text-gray-800">{{ order.orderNo }}</span>
                  <span :class="['status-badge', getOrderStatusClass(order.status)]">
                    {{ getOrderStatusLabel(order.status) }}
                  </span>
                  <span v-if="order.abnormalRecords.length > 0" class="status-badge bg-coral-100 text-coral-700 animate-breathe">
                    异常
                  </span>
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-500 mb-2">
                  <span>{{ order.customer.name }}</span>
                  <span>·</span>
                  <span>{{ getOrderTypeLabel(order.type) }}</span>
                  <span>·</span>
                  <span>{{ getJewelryCategoryLabel(order.jewelry.category) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-1">
                      <span class="text-xs text-gray-400">进度:</span>
                      <div class="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-gold-500 rounded-full transition-all"
                          :style="{ width: `${getProgressPercent(order)}%` }"
                        ></div>
                      </div>
                      <span class="text-xs text-gray-500">{{ getProgressPercent(order) }}%</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="font-semibold text-gold-600">{{ formatPrice(order.price.total) }}</span>
                  </div>
                </div>
              </div>
              <ChevronRight class="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>

          <div v-if="filteredOrders.length === 0" class="text-center py-16">
            <SearchX class="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p class="text-gray-500">没有找到匹配的订单</p>
          </div>
        </div>
      </div>

      <Transition name="slide">
        <div v-if="selectedOrder" class="lg:w-1/2 bg-white border-l border-gold-100 overflow-hidden flex flex-col">
          <div class="p-4 border-b border-gold-100 flex items-center justify-between flex-shrink-0">
            <h3 class="font-semibold text-gray-800">订单详情</h3>
            <div class="flex items-center gap-2">
              <BaseButton size="sm" variant="ghost" @click="viewDetail">
                <ExternalLink class="w-4 h-4" />
              </BaseButton>
              <button @click="closeDetail" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X class="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold text-gray-800">基本信息</h4>
                <span :class="['status-badge text-xs', getOrderStatusClass(selectedOrder.status)]">
                  {{ getOrderStatusLabel(selectedOrder.status) }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">订单号</span>
                  <p class="font-medium text-gray-800 mt-0.5">{{ selectedOrder.orderNo }}</p>
                </div>
                <div>
                  <span class="text-gray-500">订单类型</span>
                  <p class="font-medium text-gray-800 mt-0.5">{{ getOrderTypeLabel(selectedOrder.type) }}</p>
                </div>
                <div>
                  <span class="text-gray-500">创建时间</span>
                  <p class="font-medium text-gray-800 mt-0.5">{{ formatDateTime(selectedOrder.createdAt) }}</p>
                </div>
                <div>
                  <span class="text-gray-500">预计交付</span>
                  <p class="font-medium text-gray-800 mt-0.5">{{ formatDate(selectedOrder.estimatedDelivery) }}</p>
                </div>
              </div>
            </div>

            <div class="gold-divider"></div>

            <div>
              <h4 class="font-semibold text-gray-800 mb-3">客户信息</h4>
              <div class="bg-gold-50 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-gold-200 rounded-full flex items-center justify-center">
                    <User class="w-5 h-5 text-gold-700" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-800">{{ selectedOrder.customer.name }}</p>
                    <p class="text-xs text-gray-500">{{ selectedOrder.customer.memberLevel || '普通会员' }}</p>
                  </div>
                </div>
                <div class="flex gap-4 text-sm">
                  <div class="flex items-center gap-1.5 text-gray-600">
                    <Phone class="w-4 h-4" />
                    {{ selectedOrder.customer.phone }}
                  </div>
                  <div v-if="selectedOrder.customer.wechat" class="flex items-center gap-1.5 text-gray-600">
                    <MessageCircle class="w-4 h-4" />
                    {{ selectedOrder.customer.wechat }}
                  </div>
                </div>
              </div>
            </div>

            <div class="gold-divider"></div>

            <div>
              <h4 class="font-semibold text-gray-800 mb-3">加工进度</h4>
              <ProgressTimeline :nodes="selectedOrder.progress" />
            </div>

            <div v-if="selectedOrder.notes.length > 0" class="gold-divider"></div>

            <div v-if="selectedOrder.notes.length > 0">
              <h4 class="font-semibold text-gray-800 mb-3">备注</h4>
              <div class="space-y-2">
                <div
                  v-for="note in selectedOrder.notes"
                  :key="note.id"
                  class="bg-gray-50 rounded-lg p-3 text-sm"
                >
                  <p class="text-gray-700">{{ note.content }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ note.operator }} · {{ formatDateTime(note.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-gold-100 bg-gold-50/50 flex-shrink-0">
            <div class="flex gap-3">
              <BaseButton class="flex-1" @click="viewDetail">
                查看完整详情
              </BaseButton>
              <BaseButton variant="secondary">
                快速操作
              </BaseButton>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Diamond, ChevronRight, X, ExternalLink, User, Phone, MessageCircle, SearchX } from 'lucide-vue-next'
import { useOrdersStore } from '~/stores/orders'
import { useFormat } from '~/composables/useFormat'
import type { Order, OrderStatus } from '~/types'

definePageMeta({
  layout: 'default',
})

const ordersStore = useOrdersStore()
const { formatDate, formatDateTime, formatPrice, getOrderTypeLabel, getOrderStatusLabel, getOrderStatusClass, getJewelryCategoryLabel } = useFormat()

const searchQuery = ref('')
const selectedType = ref('')
const activeStatus = ref<OrderStatus[]>([])

const statusFilters = computed(() => [
  { value: 'pending', label: '待处理', count: ordersStore.stats.pending },
  { value: 'processing', label: '加工中', count: ordersStore.stats.processing },
  { value: 'completed', label: '已完成', count: ordersStore.stats.completed },
  { value: 'abnormal', label: '异常', count: ordersStore.stats.abnormal },
])

const filteredOrders = computed(() => {
  let result = [...ordersStore.orders]

  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    result = result.filter(
      o =>
        o.orderNo.toLowerCase().includes(search) ||
        o.customer.name.toLowerCase().includes(search) ||
        o.customer.phone.includes(search)
    )
  }

  if (activeStatus.value.length > 0) {
    result = result.filter(o => activeStatus.value.includes(o.status))
  }

  if (selectedType.value) {
    result = result.filter(o => o.type === selectedType.value)
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const selectedOrder = computed(() => ordersStore.selectedOrder)

const getProgressPercent = (order: Order): number => {
  const completed = order.progress.filter(p => p.status === 'completed').length
  return Math.round((completed / order.progress.length) * 100)
}

const toggleStatusFilter = (status: OrderStatus) => {
  const index = activeStatus.value.indexOf(status)
  if (index > -1) {
    activeStatus.value.splice(index, 1)
  } else {
    activeStatus.value.push(status)
  }
}

const selectOrder = (order: Order) => {
  ordersStore.selectOrder(order)
}

const closeDetail = () => {
  ordersStore.selectOrder(null)
}

const viewDetail = () => {
  if (selectedOrder.value) {
    navigateTo(`/orders/${selectedOrder.value.id}`)
  }
}

onMounted(async () => {
  await ordersStore.fetchOrders()
})
</script>
