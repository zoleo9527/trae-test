<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">演职接待管理</h1>
        <p class="text-gray-500">管理演职人员接待安排</p>
      </div>
      <div class="flex space-x-2">
        <button v-for="s in statusFilters" :key="s.value" @click="currentFilter = s.value"
          :class="currentFilter === s.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          class="px-4 py-2 rounded-lg transition-colors text-sm">
          {{ s.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="reception in filteredReceptions" :key="reception.id" class="bg-white rounded-lg shadow">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-semibold text-gray-900">{{ reception.performance?.name }}</h3>
              <p class="text-sm text-gray-500">{{ reception.performance?.troupe }}</p>
            </div>
            <span :class="getStatusClass(reception.status)" class="status-badge">{{ getStatusText(reception.status) }}</span>
          </div>
          
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex items-center">
              <span class="w-20">🏨 酒店</span>
              <span>{{ reception.hotel || '未安排' }}</span>
            </div>
            <div class="flex items-center">
              <span class="w-20">🛏️ 房间</span>
              <span>{{ reception.room_count }} 间</span>
            </div>
            <div class="flex items-center">
              <span class="w-20">🍽️ 用餐</span>
              <span>{{ reception.meal_count }} 人</span>
            </div>
            <div class="flex items-center">
              <span class="w-20">🚗 交通</span>
              <span>{{ reception.transportation || '未安排' }}</span>
            </div>
          </div>

          <div v-if="reception.notes" class="mt-4 p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500">备注</p>
            <p class="text-sm text-gray-700">{{ reception.notes }}</p>
          </div>

          <div class="mt-4 pt-4 border-t flex justify-end space-x-2">
            <button @click="updateStatus(reception.id, 'reviewing')" v-if="reception.status === 'pending'"
              class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
              提交审核
            </button>
            <button @click="updateStatus(reception.id, 'completed')" v-if="reception.status === 'reviewing'"
              class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
              确认完成
            </button>
            <button @click="editReception(reception)" class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              编辑
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">编辑接待</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">酒店</label>
            <input v-model="form.hotel" type="text" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">房间数</label>
              <input v-model.number="form.room_count" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">用餐人数</label>
              <input v-model.number="form.meal_count" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">交通安排</label>
            <input v-model="form.transportation" type="text" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea v-model="form.notes" rows="3" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>
        </div>
        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button @click="showEditModal = false" class="px-4 py-2 text-gray-700 hover:text-gray-900">取消</button>
          <button @click="saveReception" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
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

interface Reception {
  id: number
  performance_id: number
  hotel: string
  room_count: number
  meal_count: number
  transportation: string
  notes: string
  status: string
  performance: Performance
}

const receptions = ref<Reception[]>([])
const currentFilter = ref('all')
const showEditModal = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  hotel: '',
  room_count: 0,
  meal_count: 0,
  transportation: '',
  notes: ''
})

const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '审核中', value: 'reviewing' },
  { label: '已完成', value: 'completed' }
]

const { get, put } = useApi()

const loadReceptions = async () => {
  receptions.value = await get<Reception[]>('/receptions')
}

const filteredReceptions = computed(() => {
  if (currentFilter.value === 'all') return receptions.value
  return receptions.value.filter(r => r.status === currentFilter.value)
})

const editReception = (reception: Reception) => {
  editingId.value = reception.id
  form.value = {
    hotel: reception.hotel,
    room_count: reception.room_count,
    meal_count: reception.meal_count,
    transportation: reception.transportation,
    notes: reception.notes
  }
  showEditModal.value = true
}

const saveReception = async () => {
  if (editingId.value) {
    await put(`/receptions/${editingId.value}`, form.value)
    showEditModal.value = false
    editingId.value = null
    loadReceptions()
  }
}

const updateStatus = async (id: number, status: string) => {
  await put(`/receptions/${id}`, { status })
  loadReceptions()
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'status-pending',
    reviewing: 'status-reviewing',
    completed: 'status-approved',
    rejected: 'status-rejected'
  }
  return map[status] || 'status-pending'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    reviewing: '审核中',
    completed: '已完成',
    rejected: '已驳回'
  }
  return map[status] || status
}

onMounted(() => {
  loadReceptions()
})
</script>
