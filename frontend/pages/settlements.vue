<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">费用结算管理</h1>
        <p class="text-gray-500">管理演出费用结算与审批</p>
      </div>
      <div class="flex space-x-2">
        <button v-for="s in statusFilters" :key="s.value" @click="currentFilter = s.value"
          :class="currentFilter === s.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          class="px-4 py-2 rounded-lg transition-colors text-sm">
          {{ s.label }}
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div v-for="settlement in filteredSettlements" :key="settlement.id" class="bg-white rounded-lg shadow">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="font-semibold text-gray-900 text-lg">{{ settlement.performance?.name }}</h3>
              <p class="text-sm text-gray-500">{{ settlement.performance?.troupe }}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-gray-900">¥{{ settlement.total_amount.toLocaleString() }}</p>
              <span :class="getStatusClass(settlement.status)" class="status-badge inline-block mt-1">{{ getStatusText(settlement.status) }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-500">演出费</p>
              <p class="font-semibold text-gray-900">¥{{ settlement.performance_fee.toLocaleString() }}</p>
            </div>
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-500">酒店费</p>
              <p class="font-semibold text-gray-900">¥{{ settlement.hotel_expense.toLocaleString() }}</p>
            </div>
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-500">餐费</p>
              <p class="font-semibold text-gray-900">¥{{ settlement.meal_expense.toLocaleString() }}</p>
            </div>
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-500">交通费</p>
              <p class="font-semibold text-gray-900">¥{{ settlement.transportation_expense.toLocaleString() }}</p>
            </div>
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-500">其他</p>
              <p class="font-semibold text-gray-900">¥{{ settlement.other_expense.toLocaleString() }}</p>
            </div>
            <div class="text-center p-3 bg-green-50 rounded-lg">
              <p class="text-xs text-gray-500">票房收入</p>
              <p class="font-semibold text-green-700">¥{{ settlement.ticket_revenue.toLocaleString() }}</p>
            </div>
          </div>

          <div v-if="settlement.approval_notes" class="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p class="text-xs text-yellow-700">审批意见</p>
            <p class="text-sm text-yellow-800">{{ settlement.approval_notes }}</p>
          </div>

          <div class="flex justify-between items-center pt-4 border-t">
            <div class="text-sm text-gray-500">
              <span v-if="settlement.approver">审批人: {{ settlement.approver }}</span>
              <span v-if="settlement.approval_time" class="ml-4">审批时间: {{ formatDate(settlement.approval_time) }}</span>
            </div>
            <div class="flex space-x-2">
              <button v-if="settlement.status === 'pending'" @click="updateStatus(settlement.id, 'reviewing')"
                class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                提交审核
              </button>
              <button v-if="settlement.status === 'reviewing'" @click="approveSettlement(settlement.id)"
                class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                通过
              </button>
              <button v-if="settlement.status === 'reviewing'" @click="rejectSettlement(settlement.id)"
                class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                驳回
              </button>
              <button @click="editSettlement(settlement)" class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                编辑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
        <div class="px-6 py-4 border-b sticky top-0 bg-white">
          <h3 class="text-lg font-semibold text-gray-900">编辑结算</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">演出费</label>
            <input v-model.number="form.performance_fee" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">酒店费</label>
            <input v-model.number="form.hotel_expense" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">餐费</label>
            <input v-model.number="form.meal_expense" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">交通费</label>
            <input v-model.number="form.transportation_expense" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">其他费用</label>
            <input v-model.number="form.other_expense" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">票房收入</label>
            <input v-model.number="form.ticket_revenue" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
        </div>
        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3 sticky bottom-0">
          <button @click="showEditModal = false" class="px-4 py-2 text-gray-700 hover:text-gray-900">取消</button>
          <button @click="saveSettlement" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">驳回结算</h3>
        </div>
        <div class="p-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">驳回原因</label>
          <textarea v-model="rejectReason" rows="4" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="请输入驳回原因..."></textarea>
        </div>
        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button @click="showRejectModal = false" class="px-4 py-2 text-gray-700 hover:text-gray-900">取消</button>
          <button @click="confirmReject" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">确认驳回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Performance {
  name: string
  troupe: string
}

interface Settlement {
  id: number
  performance_id: number
  performance_fee: number
  hotel_expense: number
  meal_expense: number
  transportation_expense: number
  other_expense: number
  total_amount: number
  ticket_revenue: number
  status: string
  approver: string
  approval_time: string
  approval_notes: string
  performance: Performance
}

const settlements = ref<Settlement[]>([])
const currentFilter = ref('all')
const showEditModal = ref(false)
const showRejectModal = ref(false)
const editingId = ref<number | null>(null)
const rejectingId = ref<number | null>(null)
const rejectReason = ref('')

const form = ref({
  performance_fee: 0,
  hotel_expense: 0,
  meal_expense: 0,
  transportation_expense: 0,
  other_expense: 0,
  ticket_revenue: 0
})

const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '待提交', value: 'pending' },
  { label: '审核中', value: 'reviewing' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' }
]

const { get, put } = useApi()

const loadSettlements = async () => {
  settlements.value = await get<Settlement[]>('/settlements')
}

const filteredSettlements = computed(() => {
  if (currentFilter.value === 'all') return settlements.value
  return settlements.value.filter(s => s.status === currentFilter.value)
})

const editSettlement = (settlement: Settlement) => {
  editingId.value = settlement.id
  form.value = {
    performance_fee: settlement.performance_fee,
    hotel_expense: settlement.hotel_expense,
    meal_expense: settlement.meal_expense,
    transportation_expense: settlement.transportation_expense,
    other_expense: settlement.other_expense,
    ticket_revenue: settlement.ticket_revenue
  }
  showEditModal.value = true
}

const saveSettlement = async () => {
  if (editingId.value) {
    await put(`/settlements/${editingId.value}`, form.value)
    showEditModal.value = false
    editingId.value = null
    loadSettlements()
  }
}

const updateStatus = async (id: number, status: string) => {
  await put(`/settlements/${id}`, { status })
  loadSettlements()
}

const approveSettlement = async (id: number) => {
  await put(`/settlements/${id}`, { 
    status: 'approved',
    approver: '管理员'
  })
  loadSettlements()
}

const rejectSettlement = (id: number) => {
  rejectingId.value = id
  rejectReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (rejectingId.value) {
    await put(`/settlements/${rejectingId.value}`, { 
      status: 'rejected',
      approver: '管理员',
      approval_notes: rejectReason.value
    })
    showRejectModal.value = false
    rejectingId.value = null
    loadSettlements()
  }
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'status-pending',
    reviewing: 'status-reviewing',
    approved: 'status-approved',
    rejected: 'status-rejected'
  }
  return map[status] || 'status-pending'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待提交',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已驳回'
  }
  return map[status] || status
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadSettlements()
})
</script>
