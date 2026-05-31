<template>
  <div class="space-y-6">
    <FilterBar
      :show-category="true"
      :show-assignee="true"
      :category-options="categoryOptions"
      :user-options="userOptions"
      @filter="handleFilter"
      @create="showCreateModal = true"
    >
      <template #actions>新建巡场</template>
    </FilterBar>

    <div class="card p-0 overflow-hidden">
      <div class="table-container border-0 rounded-none">
        <table class="table">
          <thead>
            <tr>
              <th>巡场编号</th>
              <th>日期</th>
              <th>时间段</th>
              <th>地点</th>
              <th>执行人</th>
              <th>检查项</th>
              <th>问题数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="patrol in pagedPatrols"
              :key="patrol.id"
              class="cursor-pointer"
              @click="navigateTo(`/patrol/${patrol.id}`)"
            >
              <td class="font-medium text-primary-600">{{ patrol.patrolNo }}</td>
              <td>{{ commonStore.formatDate(patrol.date) }}</td>
              <td>{{ patrol.startTime }} - {{ patrol.endTime || '--' }}</td>
              <td>{{ patrol.location }}</td>
              <td>{{ patrol.operatorName }}</td>
              <td>
                <span class="badge bg-blue-100 text-blue-800">{{ patrol.items.length }} 项</span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="patrol.issues.length > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ patrol.issues.filter(i => i.status !== 'resolved').length }} 待处理
                </span>
              </td>
              <td>
                <StatusBadge :status="patrol.status" />
              </td>
              <td @click.stop>
                <div class="flex items-center gap-2">
                  <button
                    v-if="patrol.status === 'draft' && userStore.hasPermission('patrol:submit')"
                    class="text-sm text-primary-600 hover:text-primary-700"
                    @click="handleSubmit(patrol.id)"
                  >
                    提交审核
                  </button>
                  <button
                    v-if="patrol.status === 'pending' && userStore.hasPermission('patrol:approve')"
                    class="text-sm text-green-600 hover:text-green-700"
                    @click="handleApprove(patrol.id)"
                  >
                    通过
                  </button>
                  <button
                    v-if="patrol.status === 'pending' && userStore.hasPermission('patrol:approve')"
                    class="text-sm text-red-600 hover:text-red-700"
                    @click="handleReject(patrol.id)"
                  >
                    驳回
                  </button>
                  <button
                    class="text-sm text-gray-500 hover:text-gray-700"
                    @click="navigateTo(`/patrol/${patrol.id}`)"
                  >
                    详情
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="filteredPatrols.length"
        @change="handlePageChange"
      />
    </div>

    <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">驳回巡场记录</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">驳回原因</label>
          <textarea
            v-model="rejectReason"
            class="textarea"
            rows="4"
            placeholder="请输入驳回原因..."
          ></textarea>
        </div>
        <div class="flex justify-end gap-3">
          <button class="btn btn-secondary" @click="showRejectModal = false">取消</button>
          <button class="btn btn-danger" @click="confirmReject">确认驳回</button>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content p-6 max-w-2xl">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">新建巡场记录</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">巡场日期</label>
              <input v-model="newPatrol.date" type="date" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">地点</label>
              <select v-model="newPatrol.location" class="select">
                <option value="">请选择</option>
                <option value="练习场A区">练习场A区</option>
                <option value="练习场B区">练习场B区</option>
                <option value="果岭区">果岭区</option>
                <option value="沙坑区">沙坑区</option>
                <option value="会所">会所</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input v-model="newPatrol.startTime" type="time" class="input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">天气</label>
              <select v-model="newPatrol.weather" class="select">
                <option value="晴">晴</option>
                <option value="多云">多云</option>
                <option value="阴">阴</option>
                <option value="雨">雨</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">温度 (°C)</label>
            <input v-model.number="newPatrol.temperature" type="number" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">巡场摘要</label>
            <textarea v-model="newPatrol.summary" class="textarea" rows="3" placeholder="请输入巡场摘要..." />
          </div>
          <div class="pt-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">检查项</label>
            <div class="space-y-2">
              <div v-for="(item, index) in newPatrol.items" :key="index" class="flex items-center gap-3">
                <select v-model="item.name" class="select flex-1">
                  <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.label">
                    {{ cat.label }}
                  </option>
                </select>
                <select v-model="item.condition" class="select w-28">
                  <option value="excellent">优秀</option>
                  <option value="good">良好</option>
                  <option value="fair">一般</option>
                  <option value="poor">较差</option>
                </select>
                <button @click="removePatrolItem(index)" class="text-red-500 hover:text-red-700">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <button @click="addPatrolItem" class="text-primary-600 hover:text-primary-700 text-sm">
                + 添加检查项
              </button>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-4 mt-4 border-t">
          <button class="btn btn-secondary" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" @click="handleCreate">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useCommonStore } from '~/stores/common'
import { usePatrolStore } from '~/stores/patrol'
import { useNotificationStore } from '~/stores/notification'
import FilterBar from '~/components/FilterBar.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import Pagination from '~/components/Pagination.vue'
import type { PatrolRecord, RecordStatus } from '~/types'

const userStore = useUserStore()
const commonStore = useCommonStore()
const patrolStore = usePatrolStore()
const notificationStore = useNotificationStore()

const filters = reactive({
  keyword: '',
  startDate: '',
  endDate: '',
  status: '',
  category: '',
  assignee: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const showRejectModal = ref(false)
const showCreateModal = ref(false)
const rejectReason = ref('')
const selectedPatrolId = ref<string | null>(null)

const newPatrol = reactive({
  date: new Date().toISOString().split('T')[0],
  startTime: new Date().toTimeString().slice(0, 5),
  location: '',
  weather: '晴',
  temperature: 25,
  summary: '',
  items: [
    { id: '1', name: '球道', category: 'fairway' as const, condition: 'good' as const },
    { id: '2', name: '果岭', category: 'green' as const, condition: 'good' as const }
  ]
})

function resetNewPatrol() {
  newPatrol.date = new Date().toISOString().split('T')[0]
  newPatrol.startTime = new Date().toTimeString().slice(0, 5)
  newPatrol.location = ''
  newPatrol.weather = '晴'
  newPatrol.temperature = 25
  newPatrol.summary = ''
  newPatrol.items = [
    { id: '1', name: '球道', category: 'fairway' as const, condition: 'good' as const },
    { id: '2', name: '果岭', category: 'green' as const, condition: 'good' as const }
  ]
}

function addPatrolItem() {
  newPatrol.items.push({
    id: Date.now().toString(),
    name: '',
    category: 'fairway' as const,
    condition: 'good' as const
  })
}

function removePatrolItem(index: number) {
  if (newPatrol.items.length > 1) {
    newPatrol.items.splice(index, 1)
  }
}

function handleCreate() {
  if (!newPatrol.location.trim()) {
    notificationStore.showToastMessage('error', '请选择巡场地点')
    return
  }

  const patrol = patrolStore.createPatrol({
    date: newPatrol.date,
    startTime: newPatrol.startTime,
    location: newPatrol.location,
    weather: newPatrol.weather,
    temperature: newPatrol.temperature,
    summary: newPatrol.summary,
    items: newPatrol.items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      name: item.name,
      category: item.category,
      condition: item.condition
    }))
  })

  notificationStore.showToastMessage('success', '巡场记录创建成功')
  showCreateModal.value = false
  resetNewPatrol()

  if (userStore.hasPermission('patrol:submit')) {
    navigateTo(`/patrol/${patrol.id}`)
  }
}

const categoryOptions = [
  { value: 'fairway', label: '球道' },
  { value: 'green', label: '果岭' },
  { value: 'tee', label: '发球台' },
  { value: 'bunker', label: '沙坑' },
  { value: 'facility', label: '设施' },
  { value: 'equipment', label: '器材' },
  { value: 'safety', label: '安全' }
]

const userOptions = computed(() => {
  const users = new Map<string, string>()
  patrolStore.patrols.forEach(p => {
    users.set(p.operatorId, p.operatorName)
    if (p.supervisorId) {
      users.set(p.supervisorId, p.supervisorName!)
    }
  })
  return Array.from(users.entries()).map(([value, label]) => ({ value, label }))
})

const filteredPatrols = computed(() => {
  return patrolStore.patrols.filter(patrol => {
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      if (!patrol.patrolNo.toLowerCase().includes(keyword) &&
          !patrol.location.toLowerCase().includes(keyword) &&
          !patrol.operatorName.toLowerCase().includes(keyword)) {
        return false
      }
    }

    if (filters.startDate && patrol.date < filters.startDate) return false
    if (filters.endDate && patrol.date > filters.endDate) return false

    if (filters.status && patrol.status !== filters.status) return false

    if (filters.category) {
      const hasCategory = patrol.items.some(i => i.category === filters.category)
      if (!hasCategory) return false
    }

    if (filters.assignee && patrol.operatorId !== filters.assignee) return false

    return true
  }).sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })
})

const pagedPatrols = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredPatrols.value.slice(start, start + pagination.pageSize)
})

function handleFilter(newFilters: typeof filters) {
  Object.assign(filters, newFilters)
  pagination.page = 1
}

function handlePageChange() {}

function handleSubmit(id: string) {
  patrolStore.submitForApproval(id)
  notificationStore.showToastMessage('success', '巡场记录已提交审核')
}

function handleApprove(id: string) {
  patrolStore.approve(id)
  notificationStore.showToastMessage('success', '巡场记录已通过')
}

function handleReject(id: string) {
  selectedPatrolId.value = id
  rejectReason.value = ''
  showRejectModal.value = true
}

function confirmReject() {
  if (selectedPatrolId.value && rejectReason.value.trim()) {
    patrolStore.reject(selectedPatrolId.value, rejectReason.value.trim())
    notificationStore.showToastMessage('warning', '巡场记录已驳回')
    showRejectModal.value = false
  }
}
</script>
