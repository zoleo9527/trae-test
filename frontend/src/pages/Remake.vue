<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  RotateCcw,
  AlertTriangle,
  PackageX,
  Plus,
  Clock,
  CheckCircle2,
  User,
  ChefHat,
  Edit3,
  TrendingDown,
} from 'lucide-vue-next'
import { useRemakeStore } from '@/stores/remake'
import { useOrderStore } from '@/stores/order'
import { useScheduleStore } from '@/stores/schedule'
import StatusBadge from '@/components/StatusBadge.vue'
import {
  formatDateTime,
  formatPrice,
  remakeCategoryLabels,
  remakeStatusLabels,
} from '@/lib/utils'

const remakeStore = useRemakeStore()
const orderStore = useOrderStore()
const scheduleStore = useScheduleStore()

const selectedTicketId = ref<string | null>(null)
const statusFilter = ref<string>('all')
const showLossModal = ref(false)
const lossForm = ref({
  materialName: '',
  quantity: 0,
  unit: 'kg',
  cost: 0,
})

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'open', label: '待处理' },
  { value: 'scheduled', label: '已排产' },
  { value: 'producing', label: '重做中' },
  { value: 'completed', label: '已完成' },
  { value: 'closed', label: '已关闭' },
]

const filteredTickets = computed(() => {
  let tickets = [...remakeStore.tickets]
  if (statusFilter.value !== 'all') {
    tickets = tickets.filter(t => t.status === statusFilter.value)
  }
  return tickets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})

const stats = computed(() => ({
  total: remakeStore.tickets.length,
  open: remakeStore.openTickets.length,
  producing: remakeStore.tickets.filter(t => t.status === 'producing').length,
  completed: remakeStore.tickets.filter(t => t.status === 'completed' || t.status === 'closed').length,
  totalLossCost: remakeStore.materialLosses.reduce((sum, l) => sum + l.cost, 0),
}))

function getOrder(ticketId: string) {
  const ticket = remakeStore.tickets.find(t => t.id === ticketId)
  if (!ticket) return null
  return orderStore.getOrderById(ticket.orderId)
}

function getLosses(ticketId: string) {
  return remakeStore.getLossesByTicketId(ticketId)
}

function getLossTotal(ticketId: string) {
  return getLosses(ticketId).reduce((sum, l) => sum + l.cost, 0)
}

function getSchedule(ticketId: string) {
  return scheduleStore.remakeSchedule.filter(s => s.remakeTicketId === ticketId)
}

function selectTicket(ticketId: string) {
  selectedTicketId.value = selectedTicketId.value === ticketId ? null : ticketId
}

function updateTicketStatus(ticketId: string, status: any) {
  remakeStore.updateTicketStatus(ticketId, status)
}

function addMaterialLoss() {
  if (!selectedTicketId.value || !lossForm.value.materialName) return

  remakeStore.addMaterialLoss({
    id: `ML-NEW-${Date.now()}`,
    remakeTicketId: selectedTicketId.value,
    materialName: lossForm.value.materialName,
    quantity: lossForm.value.quantity,
    unit: lossForm.value.unit,
    cost: lossForm.value.cost,
    recordedBy: '后厨负责人',
    recordedAt: new Date().toISOString(),
  })

  lossForm.value = {
    materialName: '',
    quantity: 0,
    unit: 'kg',
    cost: 0,
  }
  showLossModal.value = false
}

const categoryColors: Record<string, string> = {
  quality: 'bg-orange-100 text-orange-700 border-orange-200',
  customer_complaint: 'bg-red-100 text-red-700 border-red-200',
  wrong_item: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  damaged: 'bg-purple-100 text-purple-700 border-purple-200',
}
</script>

<template>
  <div class="remake-page">
    <div class="card p-5 mb-6">
      <div class="grid grid-cols-5 gap-4">
        <div class="p-3 bg-orange-50 rounded-lg border border-orange-100">
          <div class="text-2xl font-bold text-orange-700 font-mono">{{ stats.open }}</div>
          <div class="text-xs text-orange-600 mt-1">待处理</div>
        </div>
        <div class="p-3 bg-bakery-50 rounded-lg border border-bakery-100">
          <div class="text-2xl font-bold text-bakery-700 font-mono">{{ stats.producing }}</div>
          <div class="text-xs text-bakery-500 mt-1">重做中</div>
        </div>
        <div class="p-3 bg-green-50 rounded-lg border border-green-100">
          <div class="text-2xl font-bold text-green-700 font-mono">{{ stats.completed }}</div>
          <div class="text-xs text-green-600 mt-1">已完成</div>
        </div>
        <div class="p-3 bg-red-50 rounded-lg border border-red-100">
          <div class="text-2xl font-bold text-red-700 font-mono">{{ stats.total }}</div>
          <div class="text-xs text-red-600 mt-1">总工单</div>
        </div>
        <div class="p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div class="text-2xl font-bold text-purple-700 font-mono">{{ formatPrice(stats.totalLossCost) }}</div>
          <div class="text-xs text-purple-600 mt-1">累计损耗</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="px-5 py-4 border-b border-bakery-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <RotateCcw class="w-5 h-5 text-bakery-600" />
            <h3 class="font-semibold text-bakery-800">异常补做工单</h3>
          </div>
          <div class="flex items-center gap-2">
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
            <button class="btn-primary flex items-center gap-2">
              <Plus class="w-4 h-4" />
              新增工单
            </button>
          </div>
        </div>
      </div>

      <div class="divide-y divide-bakery-100">
        <div
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          class="hover:bg-bakery-50/50 transition-colors cursor-pointer"
          :class="{ 'bg-bakery-50': selectedTicketId === ticket.id }"
          @click="selectTicket(ticket.id)"
        >
          <div class="px-5 py-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-mono text-sm text-bakery-500">{{ ticket.id }}</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full border"
                    :class="categoryColors[ticket.category]"
                  >
                    {{ remakeCategoryLabels[ticket.category] }}
                  </span>
                  <StatusBadge :status="ticket.status" type="remake" />
                </div>

                <div class="text-sm font-medium text-bakery-800 mb-1">
                  {{ ticket.reason }}
                </div>

                <div class="flex items-center gap-4 text-xs text-bakery-500">
                  <span>关联订单：{{ ticket.orderId }}</span>
                  <span v-if="getOrder(ticket.id)">
                    客户：{{ getOrder(ticket.id)?.customerName }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    {{ formatDateTime(ticket.createdAt) }}
                  </span>
                  <span v-if="getLosses(ticket.id).length > 0" class="flex items-center gap-1 text-red-500">
                    <TrendingDown class="w-3 h-3" />
                    损耗：{{ formatPrice(getLossTotal(ticket.id)) }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 ml-4">
                <button
                  v-if="ticket.status === 'open'"
                  class="btn-ghost text-xs"
                  @click.stop="updateTicketStatus(ticket.id, 'scheduled')"
                >
                  安排排产
                </button>
                <button
                  v-if="ticket.status === 'scheduled'"
                  class="btn-ghost text-xs"
                  @click.stop="updateTicketStatus(ticket.id, 'producing')"
                >
                  开始重做
                </button>
                <button
                  v-if="ticket.status === 'producing'"
                  class="btn-ghost text-xs"
                  @click.stop="updateTicketStatus(ticket.id, 'completed')"
                >
                  标记完成
                </button>
                <button
                  v-if="ticket.status !== 'completed' && ticket.status !== 'closed'"
                  class="btn-ghost text-xs"
                  @click.stop="showLossModal = true; selectedTicketId = ticket.id"
                >
                  <PackageX class="w-3.5 h-3.5 inline mr-1" />
                  录损耗
                </button>
              </div>
            </div>

            <Transition name="slide-down">
              <div v-if="selectedTicketId === ticket.id" class="mt-4 pt-4 border-t border-bakery-200">
                <div class="grid grid-cols-3 gap-6">
                  <div>
                    <h4 class="text-sm font-medium text-bakery-800 mb-3">原订单信息</h4>
                    <div v-if="getOrder(ticket.id)" class="p-3 bg-bakery-50 rounded-lg border border-bakery-100">
                      <div class="text-sm font-medium text-bakery-800">
                        {{ getOrder(ticket.id)?.customerName }}
                      </div>
                      <div class="text-xs text-bakery-600 mt-1">
                        {{ getOrder(ticket.id)?.items?.map((i: any) => `${i.name}×${i.quantity}`).join('、') }}
                      </div>
                      <div class="text-sm font-mono text-bakery-800 mt-2">
                        {{ formatPrice(getOrder(ticket.id)?.totalPrice || 0) }}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 class="text-sm font-medium text-bakery-800 mb-3">补做排产</h4>
                    <div v-if="getSchedule(ticket.id).length === 0" class="text-sm text-bakery-400">
                      暂无排产记录
                    </div>
                    <div v-else class="space-y-2">
                      <div
                        v-for="sch in getSchedule(ticket.id)"
                        :key="sch.id"
                        class="p-3 bg-orange-50 rounded-lg border border-orange-100"
                      >
                        <div class="flex items-center justify-between">
                          <span class="text-sm font-medium text-bakery-800">{{ sch.station }}</span>
                          <StatusBadge :status="sch.status" type="schedule" />
                        </div>
                        <div class="text-xs text-bakery-600 mt-1">
                          {{ sch.timeSlot }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-sm font-medium text-bakery-800">材料损耗记录</h4>
                      <button
                        class="text-xs text-accent hover:text-accent-hover"
                        @click.stop="showLossModal = true; selectedTicketId = ticket.id"
                      >
                        <Plus class="w-3 h-3 inline" />
                        新增
                      </button>
                    </div>
                    <div v-if="getLosses(ticket.id).length === 0" class="text-sm text-bakery-400">
                      暂无损耗记录
                    </div>
                    <div v-else class="space-y-2">
                      <div
                        v-for="loss in getLosses(ticket.id)"
                        :key="loss.id"
                        class="p-3 bg-red-50 rounded-lg border border-red-100"
                      >
                        <div class="flex items-center justify-between">
                          <span class="text-sm font-medium text-bakery-800">{{ loss.materialName }}</span>
                          <span class="text-sm font-mono text-red-600">-{{ formatPrice(loss.cost) }}</span>
                        </div>
                        <div class="text-xs text-bakery-600 mt-1">
                          {{ loss.quantity }}{{ loss.unit }} · 录入：{{ loss.recordedBy }}
                        </div>
                        <div class="text-xs text-bakery-400 mt-0.5">
                          {{ formatDateTime(loss.recordedAt) }}
                        </div>
                      </div>
                      <div class="flex justify-between text-sm font-medium pt-2 border-t border-red-200">
                        <span class="text-bakery-700">合计损耗</span>
                        <span class="text-red-600 font-mono">{{ formatPrice(getLossTotal(ticket.id)) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="showLossModal"
        class="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
        @click.self="showLossModal = false"
      >
        <div class="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
          <div class="px-6 py-4 border-b border-bakery-200">
            <h3 class="font-semibold text-bakery-800">录入材料损耗</h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm text-bakery-700 mb-1.5">材料名称</label>
              <input
                v-model="lossForm.materialName"
                type="text"
                placeholder="如：淡奶油、草莓"
                class="input-field w-full"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-bakery-700 mb-1.5">数量</label>
                <input
                  v-model.number="lossForm.quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  class="input-field w-full"
                />
              </div>
              <div>
                <label class="block text-sm text-bakery-700 mb-1.5">单位</label>
                <select v-model="lossForm.unit" class="input-field w-full">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="个">个</option>
                  <option value="份">份</option>
                  <option value="盒">盒</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm text-bakery-700 mb-1.5">成本金额 (元)</label>
              <input
                v-model.number="lossForm.cost"
                type="number"
                min="0"
                step="0.01"
                class="input-field w-full"
              />
            </div>
          </div>
          <div class="px-6 py-4 border-t border-bakery-200 flex justify-end gap-3">
            <button class="btn-secondary" @click="showLossModal = false">取消</button>
            <button class="btn-danger" @click="addMaterialLoss">确认录入</button>
          </div>
        </div>
      </div>
    </Transition>
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

