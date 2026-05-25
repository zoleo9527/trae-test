<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">演出场次管理</h1>
        <p class="text-gray-500">管理所有演出排期</p>
      </div>
      <button @click="showCreateModal = true" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
        + 新增演出
      </button>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">演出名称</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">剧团</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">场地</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">票务</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="perf in performances" :key="perf.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ perf.name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ perf.troupe }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ formatDateTime(perf.start_time) }}</div>
              <div class="text-xs text-gray-500">{{ formatDateTime(perf.end_time) }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ perf.venue }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ perf.sold_tickets }} / {{ perf.total_tickets }}</div>
              <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div class="bg-indigo-600 h-2 rounded-full" :style="{ width: `${(perf.sold_tickets / perf.total_tickets) * 100}%` }"></div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(perf.status)" class="status-badge">{{ getStatusText(perf.status) }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <button @click="editPerformance(perf)" class="text-indigo-600 hover:text-indigo-900">编辑</button>
              <button @click="deletePerformance(perf.id)" class="text-red-600 hover:text-red-900">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showCreateModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold text-gray-900">{{ showCreateModal ? '新增演出' : '编辑演出' }}</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">演出名称</label>
            <input v-model="form.name" type="text" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">剧团</label>
            <input v-model="form.troupe" type="text" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input v-model="form.start_time" type="datetime-local" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
              <input v-model="form.end_time" type="datetime-local" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">场地</label>
            <input v-model="form.venue" type="text" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">总票数</label>
            <input v-model.number="form.total_tickets" type="number" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div v-if="showEditModal">
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select v-model="form.status" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="scheduled">已排期</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>
        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button @click="closeModal" class="px-4 py-2 text-gray-700 hover:text-gray-900">取消</button>
          <button @click="savePerformance" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Performance {
  id: number
  name: string
  troupe: string
  start_time: string
  end_time: string
  venue: string
  total_tickets: number
  sold_tickets: number
  status: string
}

const performances = ref<Performance[]>([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  name: '',
  troupe: '',
  start_time: '',
  end_time: '',
  venue: '',
  total_tickets: 0,
  status: 'scheduled'
})

const { get, post, put, del } = useApi()

const loadPerformances = async () => {
  performances.value = await get<Performance[]>('/performances')
}

const resetForm = () => {
  form.value = {
    name: '',
    troupe: '',
    start_time: '',
    end_time: '',
    venue: '',
    total_tickets: 0,
    status: 'scheduled'
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingId.value = null
  resetForm()
}

const editPerformance = (perf: Performance) => {
  editingId.value = perf.id
  form.value = {
    name: perf.name,
    troupe: perf.troupe,
    start_time: perf.start_time.slice(0, 16),
    end_time: perf.end_time.slice(0, 16),
    venue: perf.venue,
    total_tickets: perf.total_tickets,
    status: perf.status
  }
  showEditModal.value = true
}

const savePerformance = async () => {
  if (showCreateModal.value) {
    await post('/performances', form.value)
  } else if (editingId.value) {
    await put(`/performances/${editingId.value}`, form.value)
  }
  closeModal()
  loadPerformances()
}

const deletePerformance = async (id: number) => {
  if (confirm('确定删除此演出？')) {
    await del(`/performances/${id}`)
    loadPerformances()
  }
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    scheduled: 'status-scheduled',
    completed: 'status-completed',
    cancelled: 'status-rejected'
  }
  return map[status] || 'status-pending'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    scheduled: '已排期',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadPerformances()
})
</script>
