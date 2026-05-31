<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  QrCode,
  CheckCircle2,
  Clock,
  User,
  Phone,
  PackageCheck,
  Bell,
  Search,
} from 'lucide-vue-next'
import { pickups } from '@/data/mockOrders'
import { useOrderStore } from '@/stores/order'
import StatusBadge from '@/components/StatusBadge.vue'
import {
  formatDateTime,
  formatPrice,
  formatPhone,
} from '@/lib/utils'

const orderStore = useOrderStore()

const searchQuery = ref('')
const statusFilter = ref<string>('all')
const verifyingId = ref<string | null>(null)

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'waiting', label: '待取货' },
  { value: 'notified', label: '已通知' },
  { value: 'verified', label: '已核销' },
  { value: 'completed', label: '已完成' },
]

const filteredPickups = computed(() => {
  let list = [...pickups]

  if (statusFilter.value !== 'all') {
    list = list.filter(p => p.status === statusFilter.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => {
      const order = orderStore.getOrderById(p.orderId)
      if (!order) return false
      return order.id.toLowerCase().includes(q) ||
        order.customerName.includes(q) ||
        order.phone.includes(q)
    })
  }

  return list.sort((a, b) => {
    const orderA = orderStore.getOrderById(a.orderId)
    const orderB = orderStore.getOrderById(b.orderId)
    const timeA = orderA?.pickupDate + orderA?.pickupTime || ''
    const timeB = orderB?.pickupDate + orderB?.pickupTime || ''
    return timeA.localeCompare(timeB)
  })
})

const stats = computed(() => ({
  waiting: pickups.filter(p => p.status === 'waiting').length,
  notified: pickups.filter(p => p.status === 'notified').length,
  verified: pickups.filter(p => p.status === 'verified').length,
  completed: pickups.filter(p => p.status === 'completed').length,
}))

function getOrder(pickup: typeof pickups[0]) {
  return orderStore.getOrderById(pickup.orderId)
}

async function verifyPickup(pickupId: string) {
  verifyingId.value = pickupId
  await new Promise(resolve => setTimeout(resolve, 500))
  const pickup = pickups.find(p => p.id === pickupId)
  if (pickup) {
    pickup.status = 'verified'
    pickup.verifiedAt = new Date().toISOString()
    pickup.verifiedBy = '当前操作人'
    const order = getOrder(pickup)
    if (order) {
      orderStore.updateOrderStatus(order.id, 'completed')
    }
  }
  verifyingId.value = null
}

function notifyCustomer(pickupId: string) {
  const pickup = pickups.find(p => p.id === pickupId)
  if (pickup) {
    pickup.status = 'notified'
  }
}
</script>

<template>
  <div class="pickup-page">
    <div class="card p-5 mb-6">
      <div class="grid grid-cols-4 gap-4">
        <div class="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-yellow-700 font-mono">{{ stats.waiting }}</div>
              <div class="text-xs text-yellow-600 mt-1">待取货</div>
            </div>
            <Clock class="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div class="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-blue-700 font-mono">{{ stats.notified }}</div>
              <div class="text-xs text-blue-600 mt-1">已通知</div>
            </div>
            <Bell class="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div class="p-3 bg-green-50 rounded-lg border border-green-100">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-green-700 font-mono">{{ stats.verified }}</div>
              <div class="text-xs text-green-600 mt-1">已核销</div>
            </div>
            <CheckCircle2 class="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div class="p-3 bg-bakery-50 rounded-lg border border-bakery-100">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-bakery-700 font-mono">{{ stats.completed }}</div>
              <div class="text-xs text-bakery-500 mt-1">已完成</div>
            </div>
            <PackageCheck class="w-8 h-8 text-bakery-400" />
          </div>
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

            <div class="flex items-center gap-1 bg-bakery-50 rounded-lg p-1">
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                class="px-3 py-1.5 text-sm rounded-md transition-colors"
                :class="statusFilter === opt.value ? 'bg-white text-bakery-800 shadow-sm font-medium' : 'text-bakery-500 hover:text-bakery-700'"
                @click="statusFilter = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="p-5 grid grid-cols-3 gap-4">
        <div
          v-for="pickup in filteredPickups"
          :key="pickup.id"
          class="p-4 rounded-lg border border-bakery-200 bg-white hover:shadow-md transition-all"
          :class="{ 'ring-2 ring-bakery-400': verifyingId === pickup.id }"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-mono text-sm text-bakery-500">{{ pickup.orderId }}</span>
                <StatusBadge :status="pickup.status" type="pickup" />
              </div>
              <div class="text-base font-semibold text-bakery-800">
                {{ getOrder(pickup)?.customerName }}
              </div>
              <div class="text-sm text-bakery-500 font-mono">
                {{ formatPhone(getOrder(pickup)?.phone || '') }}
              </div>
            </div>
            <div class="w-10 h-10 rounded-lg bg-bakery-100 flex items-center justify-center">
              <QrCode class="w-5 h-5 text-bakery-500" />
            </div>
          </div>

          <div class="bg-bakery-50 rounded-lg p-3 mb-3">
            <div class="text-xs text-bakery-500 mb-1">商品清单</div>
            <div class="space-y-0.5">
              <div
                v-for="(item, idx) in getOrder(pickup)?.items"
                :key="idx"
                class="flex justify-between text-sm"
              >
                <span class="text-bakery-700">{{ item.name }}</span>
                <span class="text-bakery-800 font-mono">×{{ item.quantity }}</span>
              </div>
            </div>
            <div class="flex justify-between text-sm font-medium pt-2 mt-2 border-t border-bakery-200">
              <span class="text-bakery-800">合计</span>
              <span class="text-bakery-800 font-mono">{{ formatPrice(getOrder(pickup)?.totalPrice || 0) }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-bakery-500 mb-3">
            <div class="flex items-center gap-1">
              <Clock class="w-3.5 h-3.5" />
              取货时间：{{ getOrder(pickup)?.pickupDate }} {{ getOrder(pickup)?.pickupTime }}
            </div>
          </div>

          <div v-if="pickup.verifiedAt" class="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-3">
            <CheckCircle2 class="w-3.5 h-3.5 inline mr-1" />
            已核销：{{ formatDateTime(pickup.verifiedAt) }} · {{ pickup.verifiedBy }}
          </div>

          <div class="flex gap-2">
            <button
              v-if="pickup.status === 'waiting'"
              class="btn-secondary flex-1 text-sm py-2"
              @click="notifyCustomer(pickup.id)"
            >
              <Bell class="w-4 h-4 inline mr-1.5" />
              通知客户
            </button>
            <button
              v-if="pickup.status === 'waiting' || pickup.status === 'notified'"
              class="btn-primary flex-1 text-sm py-2"
              :disabled="verifyingId === pickup.id"
              @click="verifyPickup(pickup.id)"
            >
              <CheckCircle2 class="w-4 h-4 inline mr-1.5" />
              {{ verifyingId === pickup.id ? '核销中...' : '确认核销' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredPickups.length === 0" class="p-16 text-center text-bakery-400">
        <PackageCheck class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p class="text-sm">暂无符合条件的自提记录</p>
      </div>
    </div>
  </div>
</template>

