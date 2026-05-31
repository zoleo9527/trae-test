<template>
  <div v-if="complaint" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          @click="navigateTo('/complaint')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ complaint.title }}</h1>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-sm text-gray-500">{{ complaint.complaintNo }}</span>
            <span class="text-gray-300">|</span>
            <StatusBadge :status="complaint.status" />
            <span
              class="badge"
              :class="getPriorityClass(complaint.priority)"
            >
              {{ getPriorityLabel(complaint.priority) }}
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="complaint.status === 'pending' && userStore.hasPermission('complaint:assign')"
          class="btn btn-primary"
          @click="showAssignModalFlag = true"
        >
          分配处理人
        </button>
        <button
          v-if="complaint.status === 'processing' && userStore.hasPermission('complaint:resolve')"
          class="btn btn-primary"
          @click="showResolveModalFlag = true"
        >
          处理投诉
        </button>
        <button
          v-if="complaint.status === 'pending' && userStore.hasPermission('complaint:reject')"
          class="btn btn-danger"
          @click="showRejectModal = true"
        >
          驳回
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">投诉详情</h3>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-500">客户姓名</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ complaint.customerName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">联系电话</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ complaint.customerPhone }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">投诉分类</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ getCategoryLabel(complaint.category) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">投诉来源</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ getSourceLabel(complaint.source) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">处理人</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ complaint.handlerName || '待分配' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">审核人</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ complaint.supervisorName || '待审核' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">提交时间</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ commonStore.formatDateTime(complaint.createdAt) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">期望解决日期</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ complaint.expectedResolveDate ? commonStore.formatDate(complaint.expectedResolveDate) : '--' }}</p>
            </div>
          </div>
          <div class="pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500 mb-2">问题描述</p>
            <p class="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">{{ complaint.description }}</p>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">处理时间线</h3>
          <div class="space-y-4">
            <div
              v-for="(item, index) in complaint.timeline"
              :key="item.id"
              class="relative pl-8 pb-6 last:pb-0"
            >
              <div
                v-if="index !== complaint.timeline.length - 1"
                class="absolute left-[15px] top-6 bottom-0 w-0.5 bg-gray-200"
              ></div>
              <div
                class="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                :class="getTimelineDotClass(item.action)"
              >
                <svg v-if="item.action === 'created'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <svg v-else-if="item.action === 'assigned'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg v-else-if="item.action === 'resolved'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="item.action === 'rejected'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-start justify-between mb-2">
                  <span class="badge" :class="getTimelineBadgeClass(item.action)">
                    {{ getActionLabel(item.action) }}
                  </span>
                  <span class="text-xs text-gray-400">{{ commonStore.formatDateTime(item.createdAt) }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span class="font-medium">{{ item.operatorName }}</span>
                  <span class="text-gray-400">·</span>
                  <span>{{ getRoleLabel(item.operatorRole) }}</span>
                </div>
                <p class="text-sm text-gray-700">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">状态流转</h3>
          <StatusTimeline :items="statusHistory" />
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">备注记录</h3>
            <button
              v-if="userStore.hasPermission('complaint:remark')"
              class="btn btn-primary text-sm"
              @click="showRemarkModal = true"
            >
              添加备注
            </button>
          </div>
          <RemarkList :items="remarks" />
        </div>
      </div>

      <div class="space-y-6">
        <RelatedInfoPanel
          :booking-id="complaint.relatedBookingId"
          :patrol-id="complaint.relatedPatrolId"
          :equipment-id="complaint.relatedEquipmentId"
        />

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">客户信息</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-primary-700 font-semibold">{{ complaint.customerName.charAt(0) }}</span>
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ complaint.customerName }}</p>
                <p class="text-sm text-gray-500">{{ complaint.customerPhone }}</p>
              </div>
            </div>
            <div v-if="customerAccount" class="pt-3 border-t border-gray-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-500">会员等级</span>
                <span
                  class="badge"
                  :class="getMemberLevelClass(customerAccount.level)"
                >
                  {{ getMemberLevelLabel(customerAccount.level) }}
                </span>
              </div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-500">账户余额</span>
                <span class="text-sm font-medium text-gray-900">¥{{ customerAccount.balance.toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">累计消费</span>
                <span class="text-sm font-medium text-gray-900">¥{{ customerAccount.totalConsumed.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">历史投诉</h3>
          <div class="space-y-3">
            <div
              v-for="c in customerComplaints"
              :key="c.id"
              class="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="navigateTo(`/complaint/${c.id}`)"
            >
              <div class="flex items-center gap-2 mb-1">
                <StatusBadge :status="c.status" />
                <span class="text-xs text-gray-500">{{ c.complaintNo }}</span>
              </div>
              <p class="text-sm font-medium text-gray-900 truncate">{{ c.title }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ commonStore.formatDateTime(c.createdAt) }}</p>
            </div>
            <div v-if="customerComplaints.length === 0" class="text-center py-4 text-gray-500 text-sm">
              暂无历史投诉
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAssignModalFlag" class="modal-overlay" @click.self="showAssignModalFlag = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">分配处理人</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">选择处理人</label>
          <select v-model="selectedHandlerId" class="select">
            <option value="">请选择处理人</option>
            <option value="user_2">李明 - 教练主管</option>
            <option value="user_3">王芳 - 前台</option>
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

    <div v-if="showRemarkModal" class="modal-overlay" @click.self="showRemarkModal = false">
      <div class="modal-content p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">添加备注</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">备注内容</label>
          <textarea
            v-model="newRemark"
            class="textarea"
            rows="4"
            placeholder="请输入备注内容..."
          ></textarea>
        </div>
        <div class="mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="isInternalRemark" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span class="text-sm text-gray-700">设为内部备注</span>
          </label>
        </div>
        <div class="flex justify-end gap-3">
          <button class="btn btn-secondary" @click="showRemarkModal = false">取消</button>
          <button class="btn btn-primary" @click="addRemark">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useCommonStore } from '~/stores/common'
import { useComplaintStore } from '~/stores/complaint'
import { usePrepaidStore } from '~/stores/prepaid'
import { useNotificationStore } from '~/stores/notification'
import StatusBadge from '~/components/StatusBadge.vue'
import StatusTimeline from '~/components/StatusTimeline.vue'
import RemarkList from '~/components/RemarkList.vue'
import RelatedInfoPanel from '~/components/RelatedInfoPanel.vue'
import type { ComplaintCategory, ComplaintPriority, UserRole, ComplaintTimeline } from '~/types'

const route = useRoute()
const userStore = useUserStore()
const commonStore = useCommonStore()
const complaintStore = useComplaintStore()
const prepaidStore = usePrepaidStore()
const notificationStore = useNotificationStore()

const complaint = computed(() => complaintStore.getById(route.params.id as string))

const statusHistory = computed(() => {
  if (!complaint.value) return []
  return commonStore.getStatusHistory(complaint.value.id)
})

const remarks = computed(() => {
  if (!complaint.value) return []
  return commonStore.getRemarks(complaint.value.id)
})

const customerAccount = computed(() => {
  if (!complaint.value) return null
  return prepaidStore.accounts.find(a => a.customerId === complaint.value!.customerId)
})

const customerComplaints = computed(() => {
  if (!complaint.value) return []
  return complaintStore.complaints
    .filter(c => c.customerId === complaint.value!.customerId && c.id !== complaint.value!.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
})

const showAssignModalFlag = ref(false)
const showResolveModalFlag = ref(false)
const showRejectModal = ref(false)
const showRemarkModal = ref(false)
const selectedHandlerId = ref('')
const assignRemark = ref('')
const resolveResult = ref<'resolved' | 'rejected'>('resolved')
const resolveRemark = ref('')
const rejectReason = ref('')
const newRemark = ref('')
const isInternalRemark = ref(false)

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

function getSourceLabel(source: string) {
  const map: Record<string, string> = {
    phone: '电话',
    on_site: '现场',
    wechat: '微信',
    online: '线上',
    other: '其他'
  }
  return map[source] || source
}

function getRoleLabel(role: UserRole) {
  const map: Record<UserRole, string> = {
    manager: '场馆经理',
    coach_supervisor: '教练主管',
    reception: '前台'
  }
  return map[role] || role
}

function getActionLabel(action: ComplaintTimeline['action']) {
  const map: Record<string, string> = {
    created: '创建投诉',
    assigned: '分配处理人',
    investigating: '调查中',
    resolving: '处理中',
    resolved: '已解决',
    rejected: '已驳回',
    follow_up: '跟进中'
  }
  return map[action] || action
}

function getTimelineDotClass(action: ComplaintTimeline['action']) {
  const map: Record<string, string> = {
    created: 'bg-blue-500 text-white',
    assigned: 'bg-purple-500 text-white',
    investigating: 'bg-amber-500 text-white',
    resolving: 'bg-blue-500 text-white',
    resolved: 'bg-green-500 text-white',
    rejected: 'bg-red-500 text-white',
    follow_up: 'bg-amber-500 text-white'
  }
  return map[action] || 'bg-gray-500 text-white'
}

function getTimelineBadgeClass(action: ComplaintTimeline['action']) {
  const map: Record<string, string> = {
    created: 'bg-blue-100 text-blue-800',
    assigned: 'bg-purple-100 text-purple-800',
    investigating: 'bg-amber-100 text-amber-800',
    resolving: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    follow_up: 'bg-amber-100 text-amber-800'
  }
  return map[action] || ''
}

function getMemberLevelLabel(level: string) {
  const map: Record<string, string> = {
    normal: '普通会员',
    silver: '银卡会员',
    gold: '金卡会员',
    platinum: '铂金会员'
  }
  return map[level] || level
}

function getMemberLevelClass(level: string) {
  const map: Record<string, string> = {
    normal: 'bg-gray-100 text-gray-800',
    silver: 'bg-gray-300 text-gray-800',
    gold: 'bg-amber-100 text-amber-800',
    platinum: 'bg-purple-100 text-purple-800'
  }
  return map[level] || ''
}

function confirmAssign() {
  if (complaint.value && selectedHandlerId.value) {
    const handlerName = selectedHandlerId.value === 'user_2' ? '李明' : '王芳'
    complaintStore.assignHandler(complaint.value.id, selectedHandlerId.value, handlerName, assignRemark.value)
    notificationStore.showToastMessage('success', '投诉已分配处理人')
    showAssignModalFlag.value = false
  }
}

function confirmResolve() {
  if (complaint.value && resolveRemark.value.trim()) {
    if (resolveResult.value === 'resolved') {
      complaintStore.resolveComplaint(complaint.value.id, resolveRemark.value.trim())
      notificationStore.showToastMessage('success', '投诉已解决')
    } else {
      complaintStore.rejectComplaint(complaint.value.id, resolveRemark.value.trim())
      notificationStore.showToastMessage('warning', '投诉已标记为无法解决')
    }
    showResolveModalFlag.value = false
  }
}

function confirmReject() {
  if (complaint.value && rejectReason.value.trim()) {
    complaintStore.rejectComplaint(complaint.value.id, rejectReason.value.trim())
    notificationStore.showToastMessage('warning', '投诉已驳回')
    showRejectModal.value = false
  }
}

function addRemark() {
  if (complaint.value && newRemark.value.trim()) {
    commonStore.addRemark(
      complaint.value.id,
      newRemark.value.trim(),
      isInternalRemark.value
    )
    notificationStore.showToastMessage('success', '备注添加成功')
    showRemarkModal.value = false
    newRemark.value = ''
    isInternalRemark.value = false
  }
}
</script>
