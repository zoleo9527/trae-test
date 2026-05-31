<template>
  <div class="space-y-6">
    <FilterBar
      :show-category="true"
      :show-priority="true"
      :show-assignee="true"
      :category-options="categoryOptions"
      :user-options="userOptions"
      @filter="handleFilter"
      @create="showCreateModal = true"
    >
      <template #actions>登记投诉</template>
    </FilterBar>

    <div class="card p-0 overflow-hidden">
      <div class="table-container border-0 rounded-none">
        <table class="table">
          <thead>
            <tr>
              <th>投诉编号</th>
              <th>客户</th>
              <th>标题</th>
              <th>分类</th>
              <th>优先级</th>
              <th>处理人</th>
              <th>来源</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="complaint in pagedComplaints"
              :key="complaint.id"
              class="cursor-pointer"
              @click="navigateTo(`/complaint/${complaint.id}`)"
            >
              <td class="font-medium text-primary-600">{{ complaint.complaintNo }}</td>
              <td>
                <div>
                  <p class="font-medium text-gray-900">{{ complaint.customerName }}</p>
                  <p class="text-xs text-gray-500">{{ complaint.customerPhone }}</p>
                </div>
              </td>
              <td class="max-w-xs truncate">{{ complaint.title }}</td>
              <td>
                <span class="badge bg-gray-100 text-gray-700">{{ getCategoryLabel(complaint.category) }}</span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="getPriorityClass(complaint.priority)"
                >
                  {{ getPriorityLabel(complaint.priority) }}
                </span>
              </td>
              <td>{{ complaint.handlerName || '待分配' }}</td>
              <td>
                <span class="badge bg-gray-100 text-gray-700">{{ getSourceLabel(complaint.source) }}</span>
              </td>
              <td>
                <StatusBadge :status="complaint.status" />
              </td>
              <td>{{ commonStore.formatDateTime(complaint.createdAt) }}</td>
              <td @click.stop>
                <div class="flex items-center gap-2">
                  <button
                    v-if="complaint.status === 'pending' && userStore.hasPermission('complaint:assign')"
                    class="text-sm text-primary-600 hover:text-primary-700"
                    @click="showAssignModal(complaint)"
                  >
                    分配
                  </button>
                  <button
                    v-if="complaint.status === 'processing' && userStore.hasPermission('complaint:resolve')"
                    class="text-sm text-green-600 hover:text-green-700"
                    @click="showResolveModal(complaint)"
                  >
                    解决
                  </button>
                  <button
                    v-if="complaint.status === 'pending' && userStore.hasPermission('complaint:reject')"
                    class="text-sm text-red-600 hover:text-red-700"
                    @click="handleReject(complaint.id)"
                  >
                    驳回
                  </button>
                  <button
                    class="text-sm text-gray-500 hover:text-gray-700"
                    @click="navigateTo(`/complaint/${complaint.id}`)"
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
        :total="filteredComplaints.length"
        @change="handlePageChange"
      />
    </div>

    <div v-if="showAssignModalFlag" class="modal-overlay" @click.self="showAssignModalFlag = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">分配处理人</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">选择处理人</label>
          <select v-model="selectedHandlerId" class="select">
            <option value="">请选择处理人</option>
            <option v-for="u in userOptions" :key="u.value" :value="u.value">
              {{ u.label }}
            </option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
          <textarea
            v-model="assignRemark"
            class="textarea"
            rows="3"
            placeholder="请输入分配说明..."
          ></textarea>
        </div>
        <div class="flex justify-end gap-3">
          <button class="btn btn-secondary" @click="showAssignModalFlag = false">取消</button>
          <button class="btn btn-primary" @click="confirmAssign">确认分配</button>
        </div>
      </div>
    </div>

    <div v-if="showResolveModalFlag" class="modal-overlay" @click.self="showResolveModalFlag = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">处理投诉</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">处理结果</label>
          <select v-model="resolveResult" class="select">
            <option value="resolved">已解决</option>
            <option value="rejected">无法解决</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">处理说明</label>
          <textarea
            v-model="resolveRemark"
            class="textarea"
            rows="4"
            placeholder="请详细说明处理过程和结果..."
          ></textarea>
        </div>
        <div class="flex justify-end gap-3">
          <button class="btn btn-secondary" @click="showResolveModalFlag = false">取消</button>
          <button class="btn btn-primary" @click="confirmResolve">确认处理</button>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">驳回投诉</h3>
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
        <h3 class="text-lg font-semibold text-gray-900 mb-4">登记投诉</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">客户姓名</label>
              <input v-model="newComplaint.customerName" type="text" class="input" placeholder="请输入客户姓名" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input v-model="newComplaint.customerPhone" type="tel" class="input" placeholder="请输入联系电话" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">投诉标题</label>
            <input v-model="newComplaint.title" type="text" class="input" placeholder="请简要描述投诉内容" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">投诉分类</label>
              <select v-model="newComplaint.category" class="select">
                <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">
                  {{ cat.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select v-model="newComplaint.priority" class="select">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">投诉来源</label>
            <select v-model="newComplaint.source" class="select">
              <option value="phone">电话</option>
              <option value="on_site">现场</option>
              <option value="wechat">微信</option>
              <option value="online">线上</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
            <textarea v-model="newComplaint.description" class="textarea" rows="4" placeholder="请详细描述投诉内容..." />
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
import { useComplaintStore } from '~/stores/complaint'
import { useNotificationStore } from '~/stores/notification'
import FilterBar from '~/components/FilterBar.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import Pagination from '~/components/Pagination.vue'
import type { Complaint, ComplaintCategory, ComplaintPriority } from '~/types'

const userStore = useUserStore()
const commonStore = useCommonStore()
const complaintStore = useComplaintStore()
const notificationStore = useNotificationStore()

const filters = reactive({
  keyword: '',
  startDate: '',
  endDate: '',
  status: '',
  category: '',
  priority: '' as ComplaintPriority | '',
  assignee: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const showRejectModal = ref(false)
const showCreateModal = ref(false)
const showAssignModalFlag = ref(false)
const showResolveModalFlag = ref(false)
const rejectReason = ref('')
const selectedComplaintId = ref<string | null>(null)
const selectedHandlerId = ref('')
const assignRemark = ref('')
const resolveResult = ref<'resolved' | 'rejected'>('resolved')
const resolveRemark = ref('')

const newComplaint = reactive({
  customerName: '',
  customerPhone: '',
  title: '',
  category: 'other' as ComplaintCategory,
  priority: 'medium' as ComplaintPriority,
  source: 'on_site' as 'phone' | 'on_site' | 'wechat' | 'online' | 'other',
  description: ''
})

function resetNewComplaint() {
  newComplaint.customerName = ''
  newComplaint.customerPhone = ''
  newComplaint.title = ''
  newComplaint.category = 'other'
  newComplaint.priority = 'medium'
  newComplaint.source = 'on_site'
  newComplaint.description = ''
}

function handleCreate() {
  if (!newComplaint.customerName.trim()) {
    notificationStore.showToastMessage('error', '请输入客户姓名')
    return
  }
  if (!newComplaint.customerPhone.trim()) {
    notificationStore.showToastMessage('error', '请输入联系电话')
    return
  }
  if (!newComplaint.title.trim()) {
    notificationStore.showToastMessage('error', '请输入投诉标题')
    return
  }
  if (!newComplaint.description.trim()) {
    notificationStore.showToastMessage('error', '请输入投诉详情')
    return
  }

  const complaint = complaintStore.createComplaint({
    customerName: newComplaint.customerName,
    customerPhone: newComplaint.customerPhone,
    title: newComplaint.title,
    category: newComplaint.category,
    priority: newComplaint.priority,
    source: newComplaint.source,
    description: newComplaint.description
  })

  notificationStore.showToastMessage('success', '投诉登记成功')
  showCreateModal.value = false
  resetNewComplaint()

  navigateTo(`/complaint/${complaint.id}`)
}

const categoryOptions = [
  { value: 'equipment', label: '器材问题' },
  { value: 'service', label: '服务态度' },
  { value: 'course_condition', label: '场地状况' },
  { value: 'booking', label: '预约问题' },
  { value: 'other', label: '其他' }
]

const userOptions = computed(() => {
  const users = new Map<string, string>()
  complaintStore.complaints.forEach(c => {
    if (c.handlerId) {
      users.set(c.handlerId, c.handlerName!)
    }
    if (c.supervisorId) {
      users.set(c.supervisorId, c.supervisorName!)
    }
  })
  users.set('user_2', '李明-教练主管')
  users.set('user_3', '王芳-前台')
  return Array.from(users.entries()).map(([value, label]) => ({ value, label }))
})

const filteredComplaints = computed(() => {
  return complaintStore.complaints.filter(complaint => {
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      if (!complaint.complaintNo.toLowerCase().includes(keyword) &&
          !complaint.title.toLowerCase().includes(keyword) &&
          !complaint.customerName.toLowerCase().includes(keyword) &&
          !complaint.description.toLowerCase().includes(keyword)) {
        return false
      }
    }

    if (filters.startDate && complaint.createdAt < filters.startDate) return false
    if (filters.endDate && complaint.createdAt > filters.endDate + 'T23:59:59') return false

    if (filters.status && complaint.status !== filters.status) return false
    if (filters.category && complaint.category !== filters.category) return false
    if (filters.priority && complaint.priority !== filters.priority) return false
    if (filters.assignee && complaint.handlerId !== filters.assignee) return false

    return true
  }).sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    const pa = priorityOrder[a.priority] ?? 4
    const pb = priorityOrder[b.priority] ?? 4
    if (pa !== pb) return pa - pb
    return b.createdAt.localeCompare(a.createdAt)
  })
})

const pagedComplaints = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredComplaints.value.slice(start, start + pagination.pageSize)
})

function handleFilter(newFilters: typeof filters) {
  Object.assign(filters, newFilters)
  pagination.page = 1
}

function handlePageChange() {}

function getCategoryLabel(category: ComplaintCategory) {
  const map: Record<string, string> = {
    equipment: '器材问题',
    service: '服务态度',
    course_condition: '场地状况',
    booking: '预约问题',
    other: '其他'
  }
  return map[category] || category
}

function getPriorityLabel(priority: ComplaintPriority) {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return map[priority] || priority
}

function getPriorityClass(priority: ComplaintPriority) {
  const map: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  }
  return map[priority] || ''
}

function getSourceLabel(source: Complaint['source']) {
  const map: Record<string, string> = {
    phone: '电话',
    on_site: '现场',
    wechat: '微信',
    online: '线上',
    other: '其他'
  }
  return map[source] || source
}

function showAssignModal(complaint: Complaint) {
  selectedComplaintId.value = complaint.id
  selectedHandlerId.value = ''
  assignRemark.value = ''
  showAssignModalFlag.value = true
}

function confirmAssign() {
  if (selectedComplaintId.value && selectedHandlerId.value) {
    const handler = userOptions.value.find(u => u.value === selectedHandlerId.value)
    complaintStore.assignHandler(selectedComplaintId.value, selectedHandlerId.value, handler?.label || '', assignRemark.value)
    notificationStore.showToastMessage('success', '投诉已分配处理人')
    showAssignModalFlag.value = false
  }
}

function showResolveModal(complaint: Complaint) {
  selectedComplaintId.value = complaint.id
  resolveResult.value = 'resolved'
  resolveRemark.value = ''
  showResolveModalFlag.value = true
}

function confirmResolve() {
  if (selectedComplaintId.value && resolveRemark.value.trim()) {
    if (resolveResult.value === 'resolved') {
      complaintStore.resolveComplaint(selectedComplaintId.value, resolveRemark.value.trim())
      notificationStore.showToastMessage('success', '投诉已解决')
    } else {
      complaintStore.rejectComplaint(selectedComplaintId.value, resolveRemark.value.trim())
      notificationStore.showToastMessage('warning', '投诉已标记为无法解决')
    }
    showResolveModalFlag.value = false
  }
}

function handleReject(id: string) {
  selectedComplaintId.value = id
  rejectReason.value = ''
  showRejectModal.value = true
}

function confirmReject() {
  if (selectedComplaintId.value && rejectReason.value.trim()) {
    complaintStore.rejectComplaint(selectedComplaintId.value, rejectReason.value.trim())
    notificationStore.showToastMessage('warning', '投诉已驳回')
    showRejectModal.value = false
  }
}
</script>
