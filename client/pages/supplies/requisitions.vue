<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">申领单管理</h1>
        <p class="text-gray-500 mt-1">
          共 {{ requisitions.length }} 条申领单 · 
          <span class="text-yellow-600">{{ pendingCount }} 条待审核</span>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/supplies"
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          库存列表
        </NuxtLink>
        <NuxtLink
          to="/supplies/requisition/new"
          class="px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建申领
        </NuxtLink>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500">状态:</label>
          <select
            v-model="selectedStatus"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部</option>
            <option value="draft">草稿</option>
            <option value="pending">待审核</option>
            <option value="approved">已批准</option>
            <option value="rejected">已拒绝</option>
            <option value="delivered">已发货</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500">项目:</label>
          <select
            v-model="selectedProjectId"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部项目</option>
            <option v-for="project in projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500">开始日期:</label>
          <input
            v-model="startDate"
            type="date"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500">结束日期:</label>
          <input
            v-model="endDate"
            type="date"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          @click="resetFilters"
          class="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors"
        >
          重置筛选
        </button>
      </div>
    </div>

    <div v-if="filteredRequisitions.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
      <span class="text-5xl mb-4 block">📋</span>
      <p class="text-gray-500 text-lg">暂无符合条件的申领单</p>
      <p class="text-gray-400 text-sm mt-2">请尝试调整筛选条件</p>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 text-gray-600">
            <th class="text-left px-6 py-4 font-medium">申领单号</th>
            <th class="text-left px-6 py-4 font-medium">项目</th>
            <th class="text-left px-6 py-4 font-medium">申领人</th>
            <th class="text-left px-6 py-4 font-medium">申请日期</th>
            <th class="text-center px-6 py-4 font-medium">耗材数量</th>
            <th class="text-right px-6 py-4 font-medium">合计金额</th>
            <th class="text-center px-6 py-4 font-medium">状态</th>
            <th class="text-right px-6 py-4 font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="req in filteredRequisitions"
            :key="req.id"
            class="hover:bg-gray-50 transition-colors cursor-pointer"
            @click="viewDetail(req)"
          >
            <td class="px-6 py-4">
              <span class="font-mono text-gray-900">{{ req.id }}</span>
            </td>
            <td class="px-6 py-4">
              <span class="text-gray-900">{{ getProjectName(req.projectId) }}</span>
            </td>
            <td class="px-6 py-4">
              <span class="text-gray-600">{{ getStaffName(req.applicantId) }}</span>
            </td>
            <td class="px-6 py-4">
              <span class="text-gray-600">{{ req.applicationDate }}</span>
            </td>
            <td class="px-6 py-4 text-center">
              <span class="text-gray-600">{{ req.items.length }} 项</span>
            </td>
            <td class="px-6 py-4 text-right">
              <span class="font-medium text-gray-900">{{ formatCurrency(getTotalAmount(req)) }}</span>
            </td>
            <td class="px-6 py-4 text-center">
              <span
                class="px-3 py-1 text-xs font-medium rounded-full"
                :class="getStatusBadgeClass(req.status)"
              >
                {{ getStatusText(req.status) }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="canApprove(req)"
                  @click.stop="approveRequisition(req)"
                  class="px-3 py-1.5 text-xs bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
                >
                  批准
                </button>
                <button
                  v-if="canApprove(req)"
                  @click.stop="rejectRequisition(req)"
                  class="px-3 py-1.5 text-xs bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
                >
                  拒绝
                </button>
                <button
                  v-if="canDeliver(req)"
                  @click.stop="deliverRequisition(req)"
                  class="px-3 py-1.5 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
                >
                  发货
                </button>
                <button
                  @click.stop="viewDetail(req)"
                  class="px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  详情
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <RequisitionDetailModal
      v-if="selectedRequisition"
      :visible="showDetailModal"
      :requisition="selectedRequisition"
      @close="closeDetailModal"
      @update="handleRequisitionUpdate"
    />

    <Teleport to="body">
      <div
        v-if="showToast"
        class="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"
      >
        <span v-if="toastType === 'success'" class="text-green-400">✓</span>
        <span v-else class="text-red-400">✕</span>
        <span>{{ toastMessage }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import { formatCurrency, getStatusText } from '~/utils/formatters'
import type { SupplyRequisition } from '~/types'

const dataStore = useDataStore()
const authStore = useAuthStore()

const selectedStatus = ref('')
const selectedProjectId = ref('')
const startDate = ref('')
const endDate = ref('')

const showDetailModal = ref(false)
const selectedRequisition = ref<SupplyRequisition | null>(null)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

const showRejectDialog = ref(false)
const rejectReason = ref('')
const rejectingRequisitionId = ref('')

const projects = computed(() => dataStore.projects)
const requisitions = computed(() => dataStore.requisitions)

const pendingCount = computed(() => {
  return requisitions.value.filter(r => r.status === 'pending').length
})

const filteredRequisitions = computed(() => {
  let result = [...requisitions.value]

  if (selectedStatus.value) {
    result = result.filter(r => r.status === selectedStatus.value)
  }

  if (selectedProjectId.value) {
    result = result.filter(r => r.projectId === selectedProjectId.value)
  }

  if (startDate.value) {
    result = result.filter(r => r.applicationDate >= startDate.value)
  }

  if (endDate.value) {
    result = result.filter(r => r.applicationDate <= endDate.value)
  }

  result.sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime())

  return result
})

function getProjectName(projectId: string): string {
  return dataStore.getProjectById(projectId)?.name || '未知项目'
}

function getStaffName(staffId: string): string {
  return dataStore.getStaffById(staffId)?.name || '未知'
}

function getTotalAmount(req: SupplyRequisition): number {
  return req.items.reduce((sum, item) => {
    if (item.unitPrice) {
      return sum + item.quantity * item.unitPrice
    }
    return sum
  }, 0)
}

function getStatusBadgeClass(status: string): string {
  const classMap: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    delivered: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700'
  }
  return classMap[status] || 'bg-gray-100 text-gray-700'
}

function canApprove(req: SupplyRequisition): boolean {
  return req.status === 'pending' && authStore.isProjectManager
}

function canDeliver(req: SupplyRequisition): boolean {
  return req.status === 'approved' && authStore.isProjectManager
}

function viewDetail(req: SupplyRequisition) {
  selectedRequisition.value = req
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedRequisition.value = null
}

function handleRequisitionUpdate(req: SupplyRequisition) {
  showToastMessage('操作成功')
}

async function approveRequisition(req: SupplyRequisition) {
  try {
    await dataStore.updateRequisitionStatus(req.id, 'approved', authStore.currentUser?.id)
    showToastMessage('已批准该申领单')
  } catch (error) {
    showToastMessage('操作失败', 'error')
  }
}

function rejectRequisition(req: SupplyRequisition) {
  rejectingRequisitionId.value = req.id
  rejectReason.value = ''
  showRejectDialog.value = true
}

async function confirmReject() {
  try {
    await dataStore.updateRequisitionStatus(
      rejectingRequisitionId.value,
      'rejected',
      authStore.currentUser?.id,
      rejectReason.value
    )
    showRejectDialog.value = false
    showToastMessage('已拒绝该申领单')
  } catch (error) {
    showToastMessage('操作失败', 'error')
  }
}

async function deliverRequisition(req: SupplyRequisition) {
  try {
    await dataStore.updateRequisitionStatus(req.id, 'delivered')
    showToastMessage('已标记为发货状态，库存已更新')
  } catch (error) {
    showToastMessage('操作失败', 'error')
  }
}

function resetFilters() {
  selectedStatus.value = ''
  selectedProjectId.value = ''
  startDate.value = ''
  endDate.value = ''
}

function showToastMessage(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
</script>

<style scoped>
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
