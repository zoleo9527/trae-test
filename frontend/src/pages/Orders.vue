<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Search,
  Filter,
  Edit3,
  Clock,
  User,
  Phone,
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-vue-next'
import { useOrderStore } from '@/stores/order'
import StatusBadge from '@/components/StatusBadge.vue'
import FlowTimeline from '@/components/FlowTimeline.vue'
import {
  formatDateTime,
  formatPrice,
  formatPhone,
  changeTypeLabels,
} from '@/lib/utils'

const orderStore = useOrderStore()

const searchQuery = ref('')
const statusFilter = ref<string>('all')
const showChangesOnly = ref(false)
const selectedOrderId = ref<string | null>(null)
const showChangeModal = ref(false)

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'scheduled', label: '已排产' },
  { value: 'producing', label: '制作中' },
  { value: 'completed', label: '已完成' },
  { value: 'exception', label: '异常' },
]

const filteredOrders = computed(() => {
  let orders = [...orderStore.orders]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    orders = orders.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.customerName.includes(q) ||
      o.phone.includes(q)
    )
  }

  if (statusFilter.value !== 'all') {
    orders = orders.filter(o => o.status === statusFilter.value)
  }

  if (showChangesOnly.value) {
    orders = orders.filter(o => orderStore.getChangesByOrderId(o.id).length > 0)
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const stats = computed(() => ({
  total: orderStore.orders.length,
  pending: orderStore.pendingOrders.length,
  withChanges: orderStore.ordersWithChanges.length,
  exception: orderStore.exceptionOrders.length,
}))

function getChangesForOrder(orderId: string) {
  return orderStore.getChangesByOrderId(orderId)
}

function selectOrder(orderId: string) {
  selectedOrderId.value = selectedOrderId.value === orderId ? null : orderId
}

function confirmOrder(orderId: string) {
  orderStore.confirmOrder(orderId)
}
</script>

<template>
  <div class="orders-page">
    <div class="card p-5 mb-6">
      <div class="grid grid-cols-4 gap-4">
        <div class="p-3 bg-bakery-50 rounded-lg border border-bakery-100">
          <div class="text-2xl font-bold text-bakery-800 font-mono">{{ stats.total }}</div>
          <div class="text-xs text-bakery-500 mt-1">订单总数</div>
        </div>
        <div class="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <div class="text-2xl font-bold text-yellow-700 font-mono">{{ stats.pending }}</div>
          <div class="text-xs text-yellow-600 mt-1">待确认</div>
        </div>
        <div class="p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div class="text-2xl font-bold text-purple-700 font-mono">{{ stats.withChanges }}</div>
          <div class="text-xs text-purple-600 mt-1">有改单</div>
        </div>
        <div class="p-3 bg-orange-50 rounded-lg border border-orange-100">
          <div class="text-2xl font-bold text-orange-700 font-mono">{{ stats.exception }}</div>
          <div class="text-xs text-orange-600 mt-1">异常订单</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="px-5 py-4 border-b border-bakery-100">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 flex-1">
            <div class="relative flex-1 max-w-md">
              <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-bakery-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索订单号、客户姓名、手机号..."
                class="input-field w-full pl-10"
              />
            </div>

            <select v-model="statusFilter" class="input-field min-w-[140px]">
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="showChangesOnly"
                type="checkbox"
                class="w-4 h-4 text-bakery-500 rounded"
              />
              <span class="text-sm text-bakery-700">仅显示有改单</span>
            </label>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-bakery-50">
              <th class="text-left px-5 py-3 text-xs font-medium text-bakery-500">订单号</th>
              <th class="text-left px-5 py-3 text-xs font-medium text-bakery-500">客户信息</th>
              <th class="text-left px-5 py-3 text-xs font-medium text-bakery-500">商品</th>
              <th class="text-left px-5 py-3 text-xs font-medium text-bakery-500">金额</th>
              <th class="text-left px-5 py-3 text-xs font-medium text-bakery-500">取货时间</th>
              <th class="text-left px-5 py-3 text-xs font-medium text-bakery-500">改单</th>
              <th class="text-left px-5 py-3 text-xs font-medium text-bakery-500">状态</th>
              <th class="text-left px-5 py-3 text-xs font-medium text-bakery-500">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-bakery-100">
            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="hover:bg-bakery-50/50 transition-colors cursor-pointer"
              :class="{ 'bg-bakery-50': selectedOrderId === order.id }"
              @click="selectOrder(order.id)"
            >
              <td class="px-5 py-4">
                <span class="font-mono text-sm text-bakery-600">{{ order.id }}</span>
              </td>
              <td class="px-5 py-4">
                <div class="text-sm font-medium text-bakery-800">{{ order.customerName }}</div>
                <div class="text-xs text-bakery-500 font-mono">{{ formatPhone(order.phone) }}</div>
              </td>
              <td class="px-5 py-4">
                <div class="text-sm text-bakery-700 max-w-[200px] truncate">
                  {{ order.items.map(i => `${i.name}×${i.quantity}`).join('、') }}
                </div>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm font-mono font-semibold text-bakery-800">{{ formatPrice(order.totalPrice) }}</span>
              </td>
              <td class="px-5 py-4">
                <div class="text-sm text-bakery-700">{{ order.pickupDate }}</div>
                <div class="text-xs text-bakery-500">{{ order.pickupTime }}</div>
              </td>
              <td class="px-5 py-4">
                <div v-if="getChangesForOrder(order.id).length > 0">
                  <span class="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    <Edit3 class="w-3 h-3" />
                    {{ getChangesForOrder(order.id).length }} 次改单
                  </span>
                </div>
                <span v-else class="text-xs text-bakery-400">-</span>
              </td>
              <td class="px-5 py-4">
                <StatusBadge :status="order.status" type="order" />
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                  <button
                    v-if="order.status === 'pending'"
                    class="btn-ghost text-xs"
                    @click.stop="confirmOrder(order.id)"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5 inline mr-1" />
                    确认
                  </button>
                  <button class="btn-ghost text-xs" @click.stop>
                    <Edit3 class="w-3.5 h-3.5 inline mr-1" />
                    改单
                  </button>
                  <ChevronRight class="w-4 h-4 text-bakery-400" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Transition name="slide-down">
        <div v-if="selectedOrderId" class="border-t border-bakery-200">
          <div class="p-5 bg-bakery-50">
            <div class="grid grid-cols-3 gap-6">
              <div class="col-span-2">
                <h4 class="text-sm font-medium text-bakery-800 mb-3">订单流程</h4>
                <FlowTimeline :order-id="selectedOrderId" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-bakery-800 mb-3">改单记录</h4>
                <div v-if="getChangesForOrder(selectedOrderId).length === 0" class="text-sm text-bakery-400">
                  暂无改单记录
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="change in getChangesForOrder(selectedOrderId)"
                    :key="change.id"
                    class="p-3 bg-white rounded-lg border border-bakery-200"
                  >
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        {{ changeTypeLabels[change.changeType] }}
                      </span>
                      <span
                        class="text-xs px-1.5 py-0.5 rounded"
                        :class="change.pushedToSchedule ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
                      >
                        {{ change.pushedToSchedule ? '已推送排产' : '待推送排产' }}
                      </span>
                    </div>
                    <div class="text-xs text-bakery-700">
                      <span class="text-bakery-500">{{ change.oldValue }}</span>
                      <span class="mx-1">→</span>
                      <span class="font-medium text-bakery-800">{{ change.newValue }}</span>
                    </div>
                    <div class="text-xs text-bakery-500 mt-1">原因：{{ change.reason }}</div>
                    <div class="text-xs text-bakery-400 mt-1">{{ formatDateTime(change.createdAt) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
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
  max-height: 600px;
}
</style>

