<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Undo2,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  FileText,
  BarChart3,
  PieChart,
} from 'lucide-vue-next'
import { useRefundStore } from '@/stores/refund'
import { useOrderStore } from '@/stores/order'
import { useRemakeStore } from '@/stores/remake'
import StatusBadge from '@/components/StatusBadge.vue'
import TraceCard from '@/components/TraceCard.vue'
import {
  formatDateTime,
  formatPrice,
  refundStatusLabels,
  traceTypeLabels,
} from '@/lib/utils'

const refundStore = useRefundStore()
const orderStore = useOrderStore()
const remakeStore = useRemakeStore()

const selectedRefundId = ref<string | null>(null)
const activeTab = ref<'list' | 'analysis'>('list')
const statusFilter = ref<string>('all')

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'requested', label: '待审核' },
  { value: 'tracing', label: '追溯中' },
  { value: 'approved', label: '已批准' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已拒绝' },
]

const filteredRefunds = computed(() => {
  let refunds = [...refundStore.refunds]
  if (statusFilter.value !== 'all') {
    refunds = refunds.filter(r => r.status === statusFilter.value)
  }
  return refunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const stats = computed(() => ({
  total: refundStore.refunds.length,
  pending: refundStore.pendingRefunds.length,
  completed: refundStore.refunds.filter(r => r.status === 'completed').length,
  totalAmount: refundStore.refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0),
}))

const lossAnalysis = computed(() => {
  const losses = remakeStore.materialLosses
  const byMaterial: Record<string, { quantity: number; cost: number }> = {}

  for (const loss of losses) {
    if (!byMaterial[loss.materialName]) {
      byMaterial[loss.materialName] = { quantity: 0, cost: 0 }
    }
    byMaterial[loss.materialName].quantity += loss.quantity
    byMaterial[loss.materialName].cost += loss.cost
  }

  return Object.entries(byMaterial)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.cost - a.cost)
})

const lossByCategory = computed(() => {
  const tickets = remakeStore.tickets
  const byCategory: Record<string, { count: number; loss: number }> = {}

  for (const ticket of tickets) {
    const category = ticket.category
    if (!byCategory[category]) {
      byCategory[category] = { count: 0, loss: 0 }
    }
    byCategory[category].count++
    byCategory[category].loss += remakeStore.getLossesByTicketId(ticket.id).reduce((sum, l) => sum + l.cost, 0)
  }

  return byCategory
})

function getOrder(refundId: string) {
  const refund = refundStore.refunds.find(r => r.id === refundId)
  if (!refund) return null
  return orderStore.getOrderById(refund.orderId)
}

function getTraceChain(refundId: string) {
  const refund = refundStore.refunds.find(r => r.id === refundId)
  if (!refund) return []
  return refundStore.buildTraceChain(refund.orderId)
}

function selectRefund(refundId: string) {
  selectedRefundId.value = selectedRefundId.value === refundId ? null : refundId
}

function approveRefund(refundId: string) {
  const refund = refundStore.refunds.find(r => r.id === refundId)
  if (!refund) return
  refundStore.approveRefund(refundId, '当前操作人')
  orderStore.updateOrderStatus(refund.orderId, 'refunded')
}

function rejectRefund(refundId: string) {
  refundStore.rejectRefund(refundId)
}
</script>

<template>
  <div class="refund-page">
    <div class="card p-5 mb-6">
      <div class="grid grid-cols-4 gap-4">
        <div class="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <div class="text-2xl font-bold text-yellow-700 font-mono">{{ stats.pending }}</div>
          <div class="text-xs text-yellow-600 mt-1">待处理</div>
        </div>
        <div class="p-3 bg-green-50 rounded-lg border border-green-100">
          <div class="text-2xl font-bold text-green-700 font-mono">{{ stats.completed }}</div>
          <div class="text-xs text-green-600 mt-1">已完成</div>
        </div>
        <div class="p-3 bg-red-50 rounded-lg border border-red-100">
          <div class="text-2xl font-bold text-red-700 font-mono">{{ stats.total }}</div>
          <div class="text-xs text-red-600 mt-1">总退款单</div>
        </div>
        <div class="p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div class="text-2xl font-bold text-purple-700 font-mono">{{ formatPrice(stats.totalAmount) }}</div>
          <div class="text-xs text-purple-600 mt-1">累计退款</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="px-5 py-4 border-b border-bakery-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 bg-bakery-50 rounded-lg p-1">
              <button
                class="px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2"
                :class="activeTab === 'list' ? 'bg-white text-bakery-800 shadow-sm font-medium' : 'text-bakery-500 hover:text-bakery-700'"
                @click="activeTab = 'list'"
              >
                <FileText class="w-4 h-4" />
                退款追溯
              </button>
              <button
                class="px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2"
                :class="activeTab === 'analysis' ? 'bg-white text-bakery-800 shadow-sm font-medium' : 'text-bakery-500 hover:text-bakery-700'"
                @click="activeTab = 'analysis'"
              >
                <BarChart3 class="w-4 h-4" />
                损耗复盘
              </button>
            </div>
          </div>

          <div v-if="activeTab === 'list'" class="flex items-center gap-2">
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

      <div v-if="activeTab === 'list'" class="divide-y divide-bakery-100">
        <div
          v-for="refund in filteredRefunds"
          :key="refund.id"
          class="hover:bg-bakery-50/50 transition-colors cursor-pointer"
          :class="{ 'bg-bakery-50': selectedRefundId === refund.id }"
          @click="selectRefund(refund.id)"
        >
          <div class="px-5 py-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-mono text-sm text-bakery-500">{{ refund.id }}</span>
                  <StatusBadge :status="refund.status" type="refund" />
                  <span class="text-sm font-mono font-semibold text-accent">
                    {{ formatPrice(refund.amount) }}
                  </span>
                </div>

                <div class="text-sm font-medium text-bakery-800 mb-1">
                  {{ refund.reason }}
                </div>

                <div class="flex items-center gap-4 text-xs text-bakery-500">
                  <span>关联订单：{{ refund.orderId }}</span>
                  <span v-if="getOrder(refund.id)">
                    客户：{{ getOrder(refund.id)?.customerName }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    {{ formatDateTime(refund.createdAt) }}
                  </span>
                  <span v-if="refund.approvedBy">
                    审核人：{{ refund.approvedBy }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 ml-4">
                <button
                  class="btn-ghost text-xs flex items-center gap-1"
                  @click.stop
                >
                  <Eye class="w-3.5 h-3.5" />
                  {{ selectedRefundId === refund.id ? '收起追溯' : '查看追溯链' }}
                </button>
                <button
                  v-if="refund.status === 'requested' || refund.status === 'tracing'"
                  class="btn-ghost text-xs text-green-600"
                  @click.stop="approveRefund(refund.id)"
                >
                  <CheckCircle2 class="w-3.5 h-3.5 inline mr-1" />
                  通过
                </button>
                <button
                  v-if="refund.status === 'requested' || refund.status === 'tracing'"
                  class="btn-ghost text-xs text-red-600"
                  @click.stop="rejectRefund(refund.id)"
                >
                  拒绝
                </button>
              </div>
            </div>

            <Transition name="slide-down">
              <div v-if="selectedRefundId === refund.id" class="mt-4 pt-4 border-t border-bakery-200">
                <h4 class="text-sm font-medium text-bakery-800 mb-3 flex items-center gap-2">
                  <AlertCircle class="w-4 h-4 text-accent" />
                  退款追溯链 - 从退款回溯到原始订单
                </h4>
                <div class="space-y-2">
                  <TraceCard
                    v-for="trace in getTraceChain(refund.id)"
                    :key="trace.id"
                    :trace="trace"
                    :default-open="true"
                  />
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'analysis'" class="p-5">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <h4 class="text-sm font-medium text-bakery-800 mb-4 flex items-center gap-2">
              <PieChart class="w-4 h-4 text-bakery-500" />
              按材料类型损耗统计
            </h4>
            <div class="space-y-3">
              <div
                v-for="item in lossAnalysis"
                :key="item.name"
                class="p-3 bg-white rounded-lg border border-bakery-200"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-bakery-800">{{ item.name }}</span>
                  <span class="text-sm font-mono text-red-600">-{{ formatPrice(item.cost) }}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-bakery-500">
                  <span>损耗数量：{{ item.quantity }} {{ item.name.includes('kg') || item.name.includes('g') ? '' : '单位' }}</span>
                  <div class="w-32 h-2 bg-bakery-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-red-400 rounded-full"
                      :style="{ width: `${Math.min(100, (item.cost / (lossAnalysis[0]?.cost || 1)) * 100)}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-medium text-bakery-800 mb-4 flex items-center gap-2">
              <TrendingDown class="w-4 h-4 text-bakery-500" />
              按异常类型损耗统计
            </h4>
            <div class="space-y-3">
              <div
                v-for="(data, category) in lossByCategory"
                :key="category"
                class="p-3 bg-white rounded-lg border border-bakery-200"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-bakery-800">
                    {{ ({ quality: '品质问题', customer_complaint: '客户投诉', wrong_item: '做错商品', damaged: '损坏' } as any)[category] }}
                  </span>
                  <div class="flex items-center gap-3">
                    <span class="text-xs text-bakery-500">{{ data.count }} 次</span>
                    <span class="text-sm font-mono text-red-600">-{{ formatPrice(data.loss) }}</span>
                  </div>
                </div>
                <div class="w-full h-2 bg-bakery-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-orange-400 rounded-full"
                    :style="{ width: `${Math.min(100, (data.loss / 250) * 100)}%` }"
                  />
                </div>
              </div>
            </div>

            <div class="mt-6 p-4 bg-bakery-50 rounded-lg border border-bakery-200">
              <h5 class="text-sm font-medium text-bakery-800 mb-2">损耗复盘建议</h5>
              <ul class="text-xs text-bakery-600 space-y-1.5">
                <li class="flex items-start gap-2">
                  <span class="text-accent mt-0.5">•</span>
                  <span>品质问题导致的损耗最高，建议加强制作过程中的品质抽检</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-accent mt-0.5">•</span>
                  <span>草莓、淡奶油等易损耗原料建议优化采购量和储存方式</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-accent mt-0.5">•</span>
                  <span>做错商品可通过标准化出餐核对流程减少</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
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
  max-height: 1000px;
}
</style>

