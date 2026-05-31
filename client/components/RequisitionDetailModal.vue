<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        @click="$emit('close')"
      ></div>
      <div
        class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="text-xl font-bold text-gray-900">申领单详情</h2>
            <p class="text-sm text-gray-500 mt-1">
              申领单号: {{ requisition.id }}
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div class="p-6 space-y-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <span class="text-2xl">📝</span>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ project?.name }}</h3>
                  <p class="text-sm text-gray-500">
                    申领人: {{ applicant?.name }} · {{ formatDate(requisition.applicationDate) }}
                  </p>
                </div>
              </div>
              <span
                class="px-3 py-1 text-sm font-medium rounded-full"
                :class="statusBadgeClass"
              >
                {{ getStatusText(requisition.status) }}
              </span>
            </div>

            <div class="space-y-3">
              <h4 class="font-medium text-gray-900">申领明细</h4>
              <div class="bg-gray-50 rounded-xl overflow-hidden">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-gray-100 text-gray-600">
                      <th class="text-left px-4 py-3 font-medium">耗材名称</th>
                      <th class="text-center px-4 py-3 font-medium">申请数量</th>
                      <th class="text-center px-4 py-3 font-medium">已发数量</th>
                      <th class="text-right px-4 py-3 font-medium">单价</th>
                      <th class="text-right px-4 py-3 font-medium">小计</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="(item, index) in requisition.items" :key="index" class="hover:bg-white">
                      <td class="px-4 py-3">{{ item.supplyName }}</td>
                      <td class="px-4 py-3 text-center">{{ item.quantity }}</td>
                      <td class="px-4 py-3 text-center">
                        <span :class="item.deliveredQuantity ? 'text-green-600' : 'text-gray-400'">
                          {{ item.deliveredQuantity ?? '-' }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        {{ item.unitPrice ? formatCurrency(item.unitPrice) : '-' }}
                      </td>
                      <td class="px-4 py-3 text-right font-medium">
                        {{ item.unitPrice ? formatCurrency(item.quantity * item.unitPrice) : '-' }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-gray-100">
                    <tr>
                      <td colspan="4" class="px-4 py-3 text-right font-medium text-gray-600">合计</td>
                      <td class="px-4 py-3 text-right font-bold text-primary-600">
                        {{ formatCurrency(totalAmount) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div v-if="requisition.note" class="bg-blue-50 rounded-xl p-4">
              <h4 class="font-medium text-blue-900 mb-1">备注</h4>
              <p class="text-sm text-blue-700">{{ requisition.note }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div v-if="requisition.approverId" class="bg-gray-50 rounded-xl p-4">
                <h4 class="font-medium text-gray-900 mb-2">审批信息</h4>
                <div class="space-y-1 text-sm">
                  <p class="text-gray-600">
                    审批人: <span class="text-gray-900">{{ approver?.name }}</span>
                  </p>
                  <p class="text-gray-600">
                    审批日期: <span class="text-gray-900">{{ requisition.approvalDate }}</span>
                  </p>
                </div>
              </div>
              <div v-if="requisition.deliveryDate" class="bg-gray-50 rounded-xl p-4">
                <h4 class="font-medium text-gray-900 mb-2">物流信息</h4>
                <div class="space-y-1 text-sm">
                  <p class="text-gray-600">
                    发货日期: <span class="text-gray-900">{{ requisition.deliveryDate }}</span>
                  </p>
                  <p class="text-gray-600">
                    状态: <span class="text-green-600 font-medium">已发货</span>
                  </p>
                </div>
              </div>
              <div v-if="requisition.rejectReason" class="col-span-2 bg-red-50 rounded-xl p-4">
                <h4 class="font-medium text-red-900 mb-1">拒绝原因</h4>
                <p class="text-sm text-red-700">{{ requisition.rejectReason }}</p>
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="font-medium text-gray-900">审批流程</h4>
              <div class="relative">
                <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div class="space-y-4">
                  <div class="relative flex items-start gap-4">
                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center z-10 flex-shrink-0">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div class="pt-1">
                      <p class="font-medium text-gray-900">提交申领</p>
                      <p class="text-sm text-gray-500">
                        {{ applicant?.name }} · {{ formatDate(requisition.applicationDate) }}
                      </p>
                    </div>
                  </div>

                  <div
                    v-if="requisition.status !== 'pending' && requisition.status !== 'draft'"
                    class="relative flex items-start gap-4"
                  >
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0"
                      :class="requisition.status === 'rejected' ? 'bg-red-500' : 'bg-green-500'"
                    >
                      <svg v-if="requisition.status === 'rejected'" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div class="pt-1">
                      <p class="font-medium text-gray-900">
                        {{ requisition.status === 'rejected' ? '已拒绝' : '已批准' }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ approver?.name }} · {{ requisition.approvalDate }}
                      </p>
                    </div>
                  </div>

                  <div
                    v-if="requisition.status === 'delivered' || requisition.status === 'completed'"
                    class="relative flex items-start gap-4"
                  >
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-10 flex-shrink-0">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div class="pt-1">
                      <p class="font-medium text-gray-900">已发货</p>
                      <p class="text-sm text-gray-500">
                        {{ requisition.deliveryDate }}
                      </p>
                    </div>
                  </div>

                  <div v-if="requisition.status === 'completed'" class="relative flex items-start gap-4">
                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center z-10 flex-shrink-0">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div class="pt-1">
                      <p class="font-medium text-gray-900">已完成</p>
                      <p class="text-sm text-gray-500">申领流程已完成</p>
                    </div>
                  </div>

                  <div v-if="requisition.status === 'pending'" class="relative flex items-start gap-4">
                    <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center z-10 flex-shrink-0 animate-pulse">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="pt-1">
                      <p class="font-medium text-gray-900">待审核</p>
                      <p class="text-sm text-gray-500">等待项目主管审批</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <template v-if="canApprove">
            <button
              @click="handleReject"
              class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              拒绝
            </button>
            <button
              @click="handleApprove"
              class="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors font-medium"
            >
              批准
            </button>
          </template>
          <template v-else-if="canDeliver">
            <button
              @click="handleDeliver"
              class="px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition-colors font-medium"
            >
              标记已发货
            </button>
          </template>
          <template v-else-if="canComplete">
            <button
              @click="handleComplete"
              class="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors font-medium"
            >
              确认完成
            </button>
          </template>
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

    <div v-if="showRejectDialog" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showRejectDialog = false"></div>
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">拒绝申领</h3>
        <p class="text-sm text-gray-500 mb-4">请填写拒绝原因</p>
        <textarea
          v-model="rejectReason"
          placeholder="请输入拒绝原因..."
          class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          rows="4"
        ></textarea>
        <div class="flex items-center justify-end gap-3 mt-4">
          <button
            @click="showRejectDialog = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="confirmReject"
            :disabled="!rejectReason.trim()"
            class="px-4 py-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            确认拒绝
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SupplyRequisition } from '~/types'
import { useDataStore } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import { formatDate } from '~/utils/date'
import { formatCurrency, getStatusText } from '~/utils/formatters'

interface Props {
  visible: boolean
  requisition: SupplyRequisition
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  update: [requisition: SupplyRequisition]
}>()

const dataStore = useDataStore()
const authStore = useAuthStore()

const showRejectDialog = ref(false)
const rejectReason = ref('')

const project = computed(() => {
  return dataStore.getProjectById(props.requisition.projectId)
})

const applicant = computed(() => {
  return dataStore.getUserById(props.requisition.applicantId)
})

const approver = computed(() => {
  if (props.requisition.approverId) {
    return dataStore.getUserById(props.requisition.approverId)
  }
  return null
})

const totalAmount = computed(() => {
  return props.requisition.items.reduce((sum, item) => {
    if (item.unitPrice) {
      return sum + item.quantity * item.unitPrice
    }
    return sum
  }, 0)
})

const statusBadgeClass = computed(() => {
  const classMap: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    delivered: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700'
  }
  return classMap[props.requisition.status] || 'bg-gray-100 text-gray-700'
})

const canApprove = computed(() => {
  return props.requisition.status === 'pending' && authStore.isProjectManager
})

const canDeliver = computed(() => {
  return props.requisition.status === 'approved' && authStore.isProjectManager
})

const canComplete = computed(() => {
  return props.requisition.status === 'delivered' && authStore.isProjectManager
})

async function handleApprove() {
  try {
    await dataStore.updateRequisitionStatus(
      props.requisition.id,
      'approved',
      authStore.currentUser?.id
    )
    emit('update', props.requisition)
    emit('close')
  } catch (error) {
    console.error('批准失败:', error)
  }
}

function handleReject() {
  showRejectDialog.value = true
}

async function confirmReject() {
  try {
    await dataStore.updateRequisitionStatus(
      props.requisition.id,
      'rejected',
      authStore.currentUser?.id,
      rejectReason.value
    )
    showRejectDialog.value = false
    rejectReason.value = ''
    emit('update', props.requisition)
    emit('close')
  } catch (error) {
    console.error('拒绝失败:', error)
  }
}

async function handleDeliver() {
  try {
    await dataStore.updateRequisitionStatus(
      props.requisition.id,
      'delivered'
    )
    emit('update', props.requisition)
    emit('close')
  } catch (error) {
    console.error('发货失败:', error)
  }
}

async function handleComplete() {
  try {
    await dataStore.updateRequisitionStatus(
      props.requisition.id,
      'completed'
    )
    emit('update', props.requisition)
    emit('close')
  } catch (error) {
    console.error('完成失败:', error)
  }
}
</script>
