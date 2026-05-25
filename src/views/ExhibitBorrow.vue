<script setup lang="ts">
import { ref, computed } from 'vue'
import { useExhibitStore } from '@/stores/exhibit'
import { useExceptionStore } from '@/stores/exception'
import { useAppStore } from '@/stores/app'
import StatusTag from '@/components/common/StatusTag.vue'
import PriorityTag from '@/components/common/PriorityTag.vue'
import { Search, Filter, ChevronDown, AlertCircle, MapPin, User, Calendar, Check, Package, PackageCheck, Settings, X } from 'lucide-vue-next'
import type { BorrowStatus } from '@/types'

const exhibitStore = useExhibitStore()
const exceptionStore = useExceptionStore()
const appStore = useAppStore()

const searchKeyword = ref('')
const statusFilter = ref<BorrowStatus | 'all'>('all')
const expandedOrderId = ref<string | null>(null)
const showReceiptConfirm = ref(false)
const showInstallConfirm = ref(false)
const confirmOrderId = ref<string | null>(null)
const confirmRemark = ref('')

const statusOptions: { value: BorrowStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'transferring', label: '流转中' },
  { value: 'installing', label: '布展中' },
  { value: 'completed', label: '已完成' },
  { value: 'exception', label: '异常' }
]

const filteredOrders = computed(() => {
  return exhibitStore.borrowOrders.filter(order => {
    const matchKeyword = !searchKeyword.value || 
      order.exhibitName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      order.orderNo.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchStatus = statusFilter.value === 'all' || order.status === statusFilter.value
    return matchKeyword && matchStatus
  })
})

const canOperate = computed(() => 
  appStore.currentRole === 'manager' || appStore.currentRole === 'executor'
)

const toggleExpand = (id: string) => {
  expandedOrderId.value = expandedOrderId.value === id ? null : id
}

const openRelatedException = (orderId: string) => {
  const exception = exceptionStore.exceptions.find(e => e.relatedOrderId === orderId)
  if (exception) {
    exceptionStore.openDrawer(exception.id)
  }
}

const getProgressPercent = (progress: { status: string }[]) => {
  const completed = progress.filter(p => p.status === 'completed').length
  return Math.round((completed / progress.length) * 100)
}

const openReceiptConfirm = (orderId: string) => {
  confirmOrderId.value = orderId
  confirmRemark.value = ''
  showReceiptConfirm.value = true
}

const openInstallConfirm = (orderId: string) => {
  confirmOrderId.value = orderId
  confirmRemark.value = ''
  showInstallConfirm.value = true
}

const confirmReceipt = () => {
  if (confirmOrderId.value) {
    exhibitStore.confirmReceipt(
      confirmOrderId.value,
      appStore.roleNames[appStore.currentRole],
      confirmRemark.value || undefined
    )
    showReceiptConfirm.value = false
    confirmOrderId.value = null
    confirmRemark.value = ''
  }
}

const confirmInstall = () => {
  if (confirmOrderId.value) {
    exhibitStore.completeInstall(
      confirmOrderId.value,
      appStore.roleNames[appStore.currentRole],
      confirmRemark.value || undefined
    )
    showInstallConfirm.value = false
    confirmOrderId.value = null
    confirmRemark.value = ''
  }
}

const cancelConfirm = () => {
  showReceiptConfirm.value = false
  showInstallConfirm.value = false
  confirmOrderId.value = null
  confirmRemark.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="relative flex-1 max-w-md w-full">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-museum-gray-400" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索借调单名称或编号..."
          class="w-full pl-10 pr-4 py-2.5 border border-museum-gray-300 rounded-lg focus:ring-2 focus:ring-museum-gold/50 focus:border-museum-gold transition-all"
        />
      </div>
      
      <div class="flex items-center gap-3">
        <div class="relative">
          <button class="flex items-center gap-2 px-4 py-2.5 border border-museum-gray-300 rounded-lg hover:bg-museum-gray-50 transition-colors">
            <Filter class="w-4 h-4 text-museum-gray-600" />
            <span class="text-sm text-museum-gray-700">
              {{ statusOptions.find(s => s.value === statusFilter)?.label }}
            </span>
            <ChevronDown class="w-4 h-4 text-museum-gray-400" />
          </button>
          <div class="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-museum border border-museum-gray-200 py-1 z-10">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              @click="statusFilter = option.value"
              class="w-full text-left px-4 py-2 text-sm hover:bg-museum-gray-50 transition-colors"
              :class="{ 'text-museum-gold bg-museum-gold/5': statusFilter === option.value }"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div 
        v-for="order in filteredOrders"
        :key="order.id"
        class="bg-white rounded-xl shadow-museum overflow-hidden hover:shadow-museum-hover transition-shadow"
      >
        <div 
          class="p-5 cursor-pointer"
          @click="toggleExpand(order.id)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-sm font-mono text-museum-gray-500">{{ order.orderNo }}</span>
                <StatusTag :status="order.status" type="borrow" />
                <PriorityTag :priority="order.priority" />
                <button 
                  v-if="order.hasException"
                  class="flex items-center gap-1 text-museum-coral text-xs hover:underline"
                  @click.stop="openRelatedException(order.id)"
                >
                  <AlertCircle class="w-3.5 h-3.5" />
                  查看异常
                </button>
              </div>
              <h3 class="text-lg font-semibold text-museum-gray-800 font-serif mb-3">
                {{ order.exhibitName }}
              </h3>
              <div class="flex flex-wrap gap-4 text-sm text-museum-gray-500">
                <span class="flex items-center gap-1.5">
                  <MapPin class="w-4 h-4" />
                  {{ order.source }} → {{ order.destination }}
                </span>
                <span class="flex items-center gap-1.5">
                  <User class="w-4 h-4" />
                  {{ order.applicant }}
                </span>
                <span class="flex items-center gap-1.5">
                  <Calendar class="w-4 h-4" />
                  {{ order.applyTime }}
                </span>
                <span class="flex items-center gap-1.5">
                  <Package class="w-4 h-4" />
                  {{ order.items.length }} 件展品
                </span>
              </div>
            </div>
            <ChevronDown 
              class="w-5 h-5 text-museum-gray-400 transition-transform flex-shrink-0 ml-4"
              :class="{ 'rotate-180': expandedOrderId === order.id }"
            />
          </div>

          <div class="mt-4">
            <div class="flex items-center justify-between text-xs text-museum-gray-500 mb-2">
              <span>布展进度</span>
              <span>{{ getProgressPercent(order.progress) }}%</span>
            </div>
            <div class="h-2 bg-museum-gray-100 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500"
                :class="order.status === 'exception' ? 'bg-museum-coral' : 'bg-gradient-to-r from-museum-gold to-museum-green'"
                :style="{ width: `${getProgressPercent(order.progress)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <Transition name="expand">
          <div v-if="expandedOrderId === order.id" class="border-t border-museum-gray-100">
            <div class="p-5 bg-museum-gray-50/50">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 class="text-sm font-semibold text-museum-gray-700 mb-3">布展进度明细</h4>
                  <div class="relative pl-4">
                    <div class="absolute left-1.5 top-2 bottom-2 w-0.5 bg-museum-gray-200"></div>
                    <div class="space-y-4">
                      <div 
                        v-for="node in order.progress"
                        :key="node.id"
                        class="relative"
                      >
                        <div 
                          class="absolute -left-4 w-3.5 h-3.5 rounded-full border-2 border-white"
                          :class="{
                            'bg-museum-green': node.status === 'completed',
                            'bg-museum-gold animate-pulse': node.status === 'processing',
                            'bg-museum-gray-300': node.status === 'pending'
                          }"
                        ></div>
                        <div class="ml-2">
                          <div class="flex items-center gap-2">
                            <span 
                              class="text-sm font-medium"
                              :class="{
                                'text-museum-green': node.status === 'completed',
                                'text-museum-gold': node.status === 'processing',
                                'text-museum-gray-400': node.status === 'pending'
                              }"
                            >
                              {{ node.name }}
                            </span>
                            <Check v-if="node.status === 'completed'" class="w-4 h-4 text-museum-green" />
                          </div>
                          <p v-if="node.operator" class="text-xs text-museum-gray-500 mt-0.5">
                            {{ node.operator }} · {{ node.operateTime }}
                          </p>
                          <p v-if="node.remark" class="text-xs text-museum-gray-400 mt-1 italic">
                            {{ node.remark }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 class="text-sm font-semibold text-museum-gray-700 mb-3">展品清单</h4>
                  <div class="space-y-2">
                    <div 
                      v-for="item in order.items"
                      :key="item.id"
                      class="flex items-center justify-between p-3 bg-white rounded-lg border border-museum-gray-200"
                    >
                      <div>
                        <p class="text-sm font-medium text-museum-gray-800">{{ item.name }}</p>
                        <p class="text-xs text-museum-gray-500">{{ item.code }} · {{ item.category }}</p>
                      </div>
                      <span class="text-xs text-museum-gray-500">{{ item.location }}</span>
                    </div>
                  </div>
                  
                  <div v-if="canOperate && (order.status === 'transferring' || order.status === 'installing')" class="mt-4 flex gap-3">
                    <button
                      v-if="order.status === 'transferring'"
                      @click="openReceiptConfirm(order.id)"
                      class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-museum-dark text-white rounded-lg hover:bg-museum-darker transition-colors text-sm font-medium"
                    >
                      <PackageCheck class="w-4 h-4" />
                      确认签收
                    </button>
                    <button
                      v-if="order.status === 'installing'"
                      @click="openInstallConfirm(order.id)"
                      class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-museum-green text-white rounded-lg hover:bg-museum-green/90 transition-colors text-sm font-medium"
                    >
                      <Settings class="w-4 h-4" />
                      完成布展
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <div v-if="filteredOrders.length === 0" class="text-center py-16 bg-white rounded-xl shadow-museum">
        <Package class="w-16 h-16 mx-auto mb-4 text-museum-gray-300" />
        <p class="text-museum-gray-500">暂无匹配的借调单</p>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showReceiptConfirm || showInstallConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="cancelConfirm"></div>
          
          <div class="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 animate-fade-in">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-museum-gray-800 font-serif">
                {{ showReceiptConfirm ? '确认展品签收' : '确认布展完成' }}
              </h3>
              <button @click="cancelConfirm" class="p-1 hover:bg-museum-gray-100 rounded-lg transition-colors">
                <X class="w-5 h-5 text-museum-gray-500" />
              </button>
            </div>
            
            <p class="text-sm text-museum-gray-600 mb-4">
              {{ showReceiptConfirm 
                ? '确认展品已安全到达并完成清点签收？此操作将更新借调状态为"布展中"。' 
                : '确认所有展品已按要求布展完成？此操作将更新借调状态为"已完成"并清除异常标记。' }}
            </p>
            
            <div class="mb-4">
              <label class="text-sm font-medium text-museum-gray-700 mb-2 block">备注（可选）</label>
              <textarea
                v-model="confirmRemark"
                class="w-full px-4 py-3 border border-museum-gray-300 rounded-lg focus:ring-2 focus:ring-museum-gold/50 focus:border-museum-gold transition-all resize-none text-sm"
                rows="3"
                placeholder="请输入备注信息..."
              ></textarea>
            </div>
            
            <div class="flex justify-end gap-3">
              <button
                @click="cancelConfirm"
                class="px-4 py-2 border border-museum-gray-300 text-museum-gray-700 rounded-lg hover:bg-museum-gray-50 transition-colors text-sm"
              >
                取消
              </button>
              <button
                @click="showReceiptConfirm ? confirmReceipt() : confirmInstall()"
                class="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                :class="showReceiptConfirm ? 'bg-museum-dark hover:bg-museum-darker' : 'bg-museum-green hover:bg-museum-green/90'"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
