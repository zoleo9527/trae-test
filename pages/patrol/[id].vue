<template>
  <div v-if="patrol" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          @click="navigateTo('/patrol')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ patrol.patrolNo }}</h1>
          <div class="flex items-center gap-2 mt-1">
            <StatusBadge :status="patrol.status" />
            <span class="text-sm text-gray-500">{{ commonStore.formatDateTime(patrol.createdAt) }} 创建</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="patrol.status === 'draft' && userStore.hasPermission('patrol:submit')"
          class="btn btn-primary"
          @click="handleSubmit"
        >
          提交审核
        </button>
        <button
          v-if="patrol.status === 'pending' && userStore.hasPermission('patrol:approve')"
          class="btn btn-primary"
          @click="handleApprove"
        >
          通过
        </button>
        <button
          v-if="patrol.status === 'pending' && userStore.hasPermission('patrol:approve')"
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
          <h3 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">巡场日期</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ commonStore.formatDate(patrol.date) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">时间段</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ patrol.startTime }} - {{ patrol.endTime || '--' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">地点</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ patrol.location }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">天气</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ patrol.weather }} · {{ patrol.temperature }}°C</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">执行人</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ patrol.operatorName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">审核人</p>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ patrol.supervisorName || '待审核' }}</p>
            </div>
          </div>
          <div v-if="patrol.summary" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500">巡场摘要</p>
            <p class="text-sm text-gray-900 mt-1">{{ patrol.summary }}</p>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">检查项</h3>
            <div class="flex items-center gap-2">
              <span class="badge bg-green-100 text-green-800">{{ excellentCount }} 优秀</span>
              <span class="badge bg-blue-100 text-blue-800">{{ goodCount }} 良好</span>
              <span class="badge bg-amber-100 text-amber-800">{{ fairCount }} 一般</span>
              <span class="badge bg-red-100 text-red-800">{{ poorCount }} 较差</span>
            </div>
          </div>
          <div class="space-y-3">
            <div
              v-for="item in patrol.items"
              :key="item.id"
              class="p-4 rounded-lg border border-gray-200"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-900">{{ item.name }}</span>
                    <span class="badge bg-gray-100 text-gray-700 text-xs">{{ getCategoryLabel(item.category) }}</span>
                  </div>
                  <p v-if="item.description" class="text-sm text-gray-500 mt-1">{{ item.description }}</p>
                </div>
                <span
                  class="badge"
                  :class="getConditionClass(item.condition)"
                >
                  {{ getConditionLabel(item.condition) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">发现问题</h3>
            <span class="badge bg-amber-100 text-amber-800">{{ pendingIssuesCount }} 待处理</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="issue in patrol.issues"
              :key="issue.id"
              class="p-4 rounded-lg border"
              :class="issue.status === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <div class="flex items-center gap-2">
                    <span
                      class="badge"
                      :class="getSeverityClass(issue.severity)"
                    >
                      {{ getSeverityLabel(issue.severity) }}
                    </span>
                    <span class="badge bg-gray-100 text-gray-700 text-xs">{{ getIssueCategoryLabel(issue.category) }}</span>
                  </div>
                  <p class="text-sm font-medium text-gray-900 mt-2">{{ issue.description }}</p>
                </div>
                <span
                  class="badge"
                  :class="issue.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ issue.status === 'resolved' ? '已解决' : issue.status === 'in_progress' ? '处理中' : '待处理' }}
                </span>
              </div>
              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span v-if="issue.assigneeName">责任人: {{ issue.assigneeName }}</span>
                <span v-if="issue.resolvedAt">解决时间: {{ commonStore.formatDateTime(issue.resolvedAt) }}</span>
              </div>
              <p v-if="issue.resolution" class="text-sm text-gray-600 mt-2 p-3 bg-white rounded border border-gray-100">
                <span class="font-medium">解决方案: </span>{{ issue.resolution }}
              </p>
            </div>
            <div v-if="patrol.issues.length === 0" class="text-center py-8 text-gray-500">
              未发现问题
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
              v-if="userStore.hasPermission('patrol:remark')"
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
          :booking-id="relatedBookingId"
          :complaint-id="relatedComplaintId"
          :equipment-id="relatedEquipmentId"
        />

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">关联投诉</h3>
          <div class="space-y-3">
            <div
              v-for="complaint in relatedComplaints"
              :key="complaint.id"
              class="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="navigateTo(`/complaint/${complaint.id}`)"
            >
              <div class="flex items-center gap-2 mb-1">
                <StatusBadge :status="complaint.status" />
                <span class="text-xs text-gray-500">{{ complaint.complaintNo }}</span>
              </div>
              <p class="text-sm font-medium text-gray-900">{{ complaint.title }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ complaint.customerName }} · {{ commonStore.formatDateTime(complaint.createdAt) }}</p>
            </div>
            <div v-if="relatedComplaints.length === 0" class="text-center py-4 text-gray-500 text-sm">
              暂无关联投诉
            </div>
          </div>
        </div>
      </div>
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
import { usePatrolStore } from '~/stores/patrol'
import { useComplaintStore } from '~/stores/complaint'
import { useNotificationStore } from '~/stores/notification'
import StatusBadge from '~/components/StatusBadge.vue'
import StatusTimeline from '~/components/StatusTimeline.vue'
import RemarkList from '~/components/RemarkList.vue'
import RelatedInfoPanel from '~/components/RelatedInfoPanel.vue'
import type { PatrolItem, PatrolIssue } from '~/types'

const route = useRoute()
const userStore = useUserStore()
const commonStore = useCommonStore()
const patrolStore = usePatrolStore()
const complaintStore = useComplaintStore()
const notificationStore = useNotificationStore()

const patrol = computed(() => patrolStore.getById(route.params.id as string))

const statusHistory = computed(() => {
  if (!patrol.value) return []
  return commonStore.getStatusHistory(patrol.value.id)
})

const remarks = computed(() => {
  if (!patrol.value) return []
  return commonStore.getRemarks(patrol.value.id)
})

const relatedComplaints = computed(() => {
  if (!patrol.value) return []
  return complaintStore.getRelatedComplaints(patrol.value.id)
})

const relatedBookingId = computed(() => {
  if (!patrol.value) return undefined
  const issue = patrol.value.issues.find(i => i.relatedComplaintId)
  if (issue && issue.relatedComplaintId) {
    const complaint = complaintStore.getById(issue.relatedComplaintId)
    return complaint?.relatedBookingId
  }
  return undefined
})

const relatedComplaintId = computed(() => {
  if (!patrol.value) return undefined
  const issue = patrol.value.issues.find(i => i.relatedComplaintId)
  return issue?.relatedComplaintId
})

const relatedEquipmentId = computed(() => undefined)

const excellentCount = computed(() => patrol.value?.items.filter(i => i.condition === 'excellent').length || 0)
const goodCount = computed(() => patrol.value?.items.filter(i => i.condition === 'good').length || 0)
const fairCount = computed(() => patrol.value?.items.filter(i => i.condition === 'fair').length || 0)
const poorCount = computed(() => patrol.value?.items.filter(i => i.condition === 'poor').length || 0)
const pendingIssuesCount = computed(() => patrol.value?.issues.filter(i => i.status !== 'resolved').length || 0)

const showRejectModal = ref(false)
const showRemarkModal = ref(false)
const rejectReason = ref('')
const newRemark = ref('')
const isInternalRemark = ref(false)

function getCategoryLabel(category: PatrolItem['category']) {
  const map: Record<string, string> = {
    fairway: '球道',
    green: '果岭',
    tee: '发球台',
    bunker: '沙坑',
    facility: '设施',
    equipment: '器材',
    safety: '安全'
  }
  return map[category] || category
}

function getConditionLabel(condition: PatrolItem['condition']) {
  const map: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差'
  }
  return map[condition] || condition
}

function getConditionClass(condition: PatrolItem['condition']) {
  const map: Record<string, string> = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-amber-100 text-amber-800',
    poor: 'bg-red-100 text-red-800'
  }
  return map[condition] || ''
}

function getSeverityLabel(severity: PatrolIssue['severity']) {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return map[severity] || severity
}

function getSeverityClass(severity: PatrolIssue['severity']) {
  const map: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800'
  }
  return map[severity] || ''
}

function getIssueCategoryLabel(category: PatrolIssue['category']) {
  const map: Record<string, string> = {
    maintenance: '维护',
    safety: '安全',
    service: '服务',
    other: '其他'
  }
  return map[category] || category
}

function handleSubmit() {
  if (patrol.value) {
    patrolStore.submitForApproval(patrol.value.id)
    notificationStore.showToastMessage('success', '巡场记录已提交审核')
  }
}

function handleApprove() {
  if (patrol.value) {
    patrolStore.approve(patrol.value.id)
    notificationStore.showToastMessage('success', '巡场记录已通过')
  }
}

function confirmReject() {
  if (patrol.value && rejectReason.value.trim()) {
    patrolStore.reject(patrol.value.id, rejectReason.value.trim())
    notificationStore.showToastMessage('warning', '巡场记录已驳回')
    showRejectModal.value = false
  }
}

function addRemark() {
  if (patrol.value && newRemark.value.trim()) {
    commonStore.addRemark(
      patrol.value.id,
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
