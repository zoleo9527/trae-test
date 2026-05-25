<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useTicketStore } from '@/stores/ticket'
import { useExceptionStore } from '@/stores/exception'
import { useAppStore } from '@/stores/app'
import StatusTag from '@/components/common/StatusTag.vue'
import { Search, QrCode, CheckCircle, AlertTriangle, Users, Ticket, ChevronDown, User, Phone } from 'lucide-vue-next'

const route = useRoute()

const ticketStore = useTicketStore()
const exceptionStore = useExceptionStore()
const appStore = useAppStore()

const searchKeyword = ref('')
const selectedOrderId = ref<string | null>(null)
const selectedTickets = ref<string[]>([])

const selectedOrder = computed(() => 
  ticketStore.ticketOrders.find(o => o.id === selectedOrderId.value)
)

const filteredOrders = computed(() => {
  return ticketStore.ticketOrders.filter(order => {
    return !searchKeyword.value || 
      order.activityName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      order.orderNo.toLowerCase().includes(searchKeyword.value.toLowerCase())
  })
})

const selectOrder = (id: string) => {
  selectedOrderId.value = selectedOrderId.value === id ? null : id
  selectedTickets.value = []
}

const toggleTicketSelection = (ticketId: string) => {
  const index = selectedTickets.value.indexOf(ticketId)
  if (index > -1) {
    selectedTickets.value.splice(index, 1)
  } else {
    selectedTickets.value.push(ticketId)
  }
}

const selectAllUnused = () => {
  if (!selectedOrder.value) return
  const unusedIds = selectedOrder.value.items
    .filter(t => t.status === 'unused')
    .map(t => t.id)
  selectedTickets.value = unusedIds
}

const batchVerify = () => {
  if (!selectedOrder.value || selectedTickets.value.length === 0) return
  ticketStore.batchVerify(
    selectedOrder.value.id,
    selectedTickets.value,
    appStore.roleNames[appStore.currentRole]
  )
  selectedTickets.value = []
}

const openRelatedException = (orderId: string) => {
  const exception = exceptionStore.exceptions.find(e => e.relatedOrderId === orderId)
  if (exception) {
    exceptionStore.openDrawer(exception.id)
  }
}

const canVerify = computed(() => 
  appStore.currentRole === 'ticket' || appStore.currentRole === 'manager'
)

const processQueryParams = () => {
  const orderNo = route.query.orderNo as string
  const highlight = route.query.highlight === 'true'
  
  if (orderNo && highlight) {
    const order = ticketStore.ticketOrders.find(o => o.orderNo === orderNo)
    if (order) {
      selectedTickets.value = []
      nextTick(() => {
        selectedOrderId.value = order.id
        const element = document.getElementById(`ticket-order-${order.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    }
  }
}

onMounted(() => {
  processQueryParams()
})

watch(() => route.query, () => {
  processQueryParams()
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
    <div class="lg:col-span-1 space-y-4 overflow-auto">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-museum-gray-400" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索活动名称或订单号..."
          class="w-full pl-10 pr-4 py-2.5 border border-museum-gray-300 rounded-lg focus:ring-2 focus:ring-museum-gold/50 focus:border-museum-gold transition-all"
        />
      </div>

      <div class="space-y-3">
        <div 
          v-for="order in filteredOrders"
          :key="order.id"
          :id="`ticket-order-${order.id}`"
          class="p-4 bg-white rounded-xl shadow-museum cursor-pointer transition-all duration-300 hover:shadow-museum-hover"
          :class="{ 
            'ring-2 ring-museum-gold': selectedOrderId === order.id,
            'ring-offset-2 ring-offset-museum-gray-50 animate-pulse': 
              selectedOrderId === order.id && route.query.highlight === 'true'
          }"
          @click="selectOrder(order.id)"
        >
          <div class="flex items-start justify-between mb-2">
            <span class="text-xs font-mono text-museum-gray-500">{{ order.orderNo }}</span>
            <StatusTag :status="order.status" type="ticket" />
          </div>
          <h3 class="font-medium text-museum-gray-800 mb-2">{{ order.activityName }}</h3>
          <div class="flex items-center justify-between text-sm text-museum-gray-500 mb-3">
            <span class="flex items-center gap-1">
              <Ticket class="w-4 h-4" />
              {{ order.ticketType }}
            </span>
            <span>{{ order.verifyTime }}</span>
          </div>
          
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-museum-gray-500">核销进度</span>
              <span class="font-medium text-museum-gray-700">
                {{ order.verifiedCount }} / {{ order.totalCount }}
              </span>
            </div>
            <div class="h-1.5 bg-museum-gray-100 rounded-full overflow-hidden">
              <div 
                class="h-full bg-museum-green rounded-full transition-all"
                :style="{ width: `${(order.verifiedCount / order.totalCount) * 100}%` }"
              ></div>
            </div>
          </div>

          <div v-if="order.exceptionCount > 0" class="mt-3 pt-3 border-t border-museum-gray-100">
            <button 
              class="flex items-center gap-1.5 text-museum-coral text-xs hover:underline"
              @click.stop="openRelatedException(order.id)"
            >
              <AlertTriangle class="w-3.5 h-3.5" />
              {{ order.exceptionCount }} 项核销异常待处理
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="lg:col-span-2 bg-white rounded-xl shadow-museum flex flex-col overflow-hidden">
      <div class="p-5 border-b border-museum-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-museum-gray-800 font-serif">核销工作台</h3>
            <p v-if="selectedOrder" class="text-sm text-museum-gray-500 mt-1">
              {{ selectedOrder.activityName }} - {{ selectedOrder.ticketType }}
            </p>
            <p v-else class="text-sm text-museum-gray-400 mt-1">请从左侧选择一个订单</p>
          </div>
          
          <div v-if="selectedOrder && canVerify" class="flex items-center gap-2">
            <button 
              class="flex items-center gap-2 px-4 py-2 border border-museum-gray-300 rounded-lg hover:bg-museum-gray-50 transition-colors text-sm"
              @click="selectAllUnused"
            >
              <Users class="w-4 h-4" />
              全选未核销
            </button>
            <button 
              class="flex items-center gap-2 px-4 py-2 bg-museum-dark text-white rounded-lg hover:bg-museum-darker transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="selectedTickets.length === 0"
              @click="batchVerify"
            >
              <CheckCircle class="w-4 h-4" />
              批量核销 ({{ selectedTickets.length }})
            </button>
          </div>
        </div>
      </div>

      <div v-if="selectedOrder" class="flex-1 overflow-auto p-5">
        <div class="space-y-2">
          <div 
            v-for="ticket in selectedOrder.items"
            :key="ticket.id"
            class="flex items-center gap-4 p-4 rounded-lg border transition-all"
            :class="{
              'border-museum-gray-200 hover:border-museum-gold/50 bg-white': ticket.status === 'unused',
              'border-museum-green/30 bg-museum-green/5': ticket.status === 'verified',
              'border-museum-coral/30 bg-museum-coral/5': ticket.status === 'exception',
              'border-museum-gray-200 bg-museum-gray-50 opacity-60': ticket.status === 'expired'
            }"
          >
            <div v-if="ticket.status === 'unused' && canVerify">
              <input
                type="checkbox"
                :checked="selectedTickets.includes(ticket.id)"
                @change="toggleTicketSelection(ticket.id)"
                class="w-5 h-5 rounded border-museum-gray-300 text-museum-gold focus:ring-museum-gold/50 cursor-pointer"
              />
            </div>
            <div v-else class="w-5">
              <CheckCircle v-if="ticket.status === 'verified'" class="w-5 h-5 text-museum-green" />
              <AlertTriangle v-else-if="ticket.status === 'exception'" class="w-5 h-5 text-museum-coral" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <span class="text-sm font-mono text-museum-gray-500">{{ ticket.ticketNo }}</span>
                <StatusTag :status="ticket.status" type="ticket" />
              </div>
              <div class="flex flex-wrap items-center gap-4 text-sm">
                <span class="flex items-center gap-1.5 text-museum-gray-700">
                  <User class="w-4 h-4 text-museum-gray-400" />
                  {{ ticket.visitorName }}
                </span>
                <span class="flex items-center gap-1.5 text-museum-gray-500">
                  <Phone class="w-4 h-4" />
                  {{ ticket.visitorPhone }}
                </span>
              </div>
            </div>

            <div class="text-right flex-shrink-0">
              <p v-if="ticket.verifyTime" class="text-xs text-museum-gray-500">{{ ticket.verifyTime }}</p>
              <p v-if="ticket.operator" class="text-xs text-museum-gray-400">{{ ticket.operator }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center text-museum-gray-400">
          <QrCode class="w-16 h-16 mx-auto mb-4" />
          <p class="text-lg">选择订单开始核销</p>
          <p class="text-sm mt-2">支持单个扫码核销或批量核销</p>
        </div>
      </div>

      <div v-if="!canVerify && selectedOrder" class="p-4 bg-museum-gray-50 border-t border-museum-gray-200 text-center">
        <p class="text-sm text-museum-gray-500">
          当前角色无核销权限，请切换至「票务专员」角色进行操作
        </p>
      </div>
    </div>
  </div>
</template>
