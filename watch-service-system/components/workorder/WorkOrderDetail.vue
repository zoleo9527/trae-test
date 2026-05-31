<template>
  <div class="h-full flex flex-col bg-gray-50">
    <template v-if="order">
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-3">
              <h2 class="text-xl font-semibold text-gray-900">{{ order.orderNo }}</h2>
              <StatusBadge :status="order.status" />
              <PriorityBadge :priority="order.priority" />
            </div>
            <p class="mt-1 text-sm text-gray-500">
              收件日期: {{ formatDate(order.receivedAt) }}
              <span v-if="order.expectedDate" class="ml-4">预计完成: {{ formatDate(order.expectedDate) }}</span>
            </p>
          </div>
          <div class="flex items-center space-x-2 flex-wrap gap-y-2">
            <template v-if="currentRole === 'technician'">
              <button
                v-if="order.status === 'pending_review'"
                @click="handleStartInspect"
                class="btn-primary"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:magnify" class="w-4 h-4 mr-2" />
                开始检测
              </button>
              <button
                v-if="order.status === 'quoting' && order.parts.length === 0"
                @click="showPartLockModal = true"
                class="btn-primary"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:lock" class="w-4 h-4 mr-2" />
                锁定配件
              </button>
              <button
                v-if="order.status === 'quoting' && order.parts.length > 0"
                @click="showQuoteModal = true"
                class="btn-primary"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:currency-cny" class="w-4 h-4 mr-2" />
                提交报价
              </button>
              <button
                v-if="order.status === 'repairing'"
                @click="showProgressModal = true"
                class="btn-secondary"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:update" class="w-4 h-4 mr-2" />
                更新进度
              </button>
              <button
                v-if="order.status === 'repairing'"
                @click="handleCompleteRepair"
                class="btn-success"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:check-circle" class="w-4 h-4 mr-2" />
                完成维修
              </button>
              <button
                v-if="order.status === 'quoting' && order.parts.length > 0"
                @click="handleReleaseParts"
                class="btn-secondary"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:lock-open" class="w-4 h-4 mr-2" />
                释放配件
              </button>
            </template>

            <template v-if="currentRole === 'manager'">
              <button
                v-if="order.status === 'pending_approval'"
                @click="handleApprove"
                class="btn-success"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:check" class="w-4 h-4 mr-2" />
                审批通过
              </button>
              <button
                v-if="order.status === 'pending_approval'"
                @click="showRejectModal = true"
                class="btn-danger"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:close" class="w-4 h-4 mr-2" />
                驳回
              </button>
              <button
                v-if="order.status === 'picked_up' && (!order.receipt?.satisfaction || order.receipt.satisfaction === 0)"
                @click="showSatisfactionModal = true"
                class="btn-primary"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:star" class="w-4 h-4 mr-2" />
                满意度回访
              </button>
            </template>

            <template v-if="currentRole === 'consultant'">
              <button
                v-if="order.status === 'pending_confirm'"
                @click="handleSendConfirmation"
                class="btn-primary"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:message-text" class="w-4 h-4 mr-2" />
                发送确认
              </button>
              <button
                v-if="order.status === 'pending_confirm'"
                @click="handleCustomerConfirm"
                class="btn-success"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:thumb-up" class="w-4 h-4 mr-2" />
                客户确认
              </button>
              <button
                v-if="order.status === 'pending_confirm'"
                @click="showCustomerRejectModal = true"
                class="btn-danger"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:thumb-down" class="w-4 h-4 mr-2" />
                客户驳回
              </button>
              <button
                v-if="order.status === 'completed'"
                @click="handleNotifyPickup"
                class="btn-primary"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:bell" class="w-4 h-4 mr-2" />
                通知取件
              </button>
              <button
                v-if="order.status === 'completed'"
                @click="showPickupModal = true"
                class="btn-success"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:package-variant-closed" class="w-4 h-4 mr-2" />
                确认取件
              </button>
              <button
                v-if="order.status === 'rejected' || order.status === 'customer_rejected'"
                @click="handleReopen"
                class="btn-primary"
                :disabled="actionLoading"
              >
                <Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
                重新处理
              </button>
            </template>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
        <div v-if="order.rejectReason || order.customerRejectReason" class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-start space-x-3">
            <Icon icon="mdi:alert-circle" class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-red-800">
                {{ order.rejectReason ? '经理驳回原因' : '客户驳回原因' }}
              </p>
              <p class="text-sm text-red-700 mt-1">
                {{ order.rejectReason || order.customerRejectReason }}
              </p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">客户信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">客户姓名</p>
              <p class="mt-1 font-medium text-gray-900">{{ order.customer.name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">联系电话</p>
              <p class="mt-1 font-medium text-gray-900">{{ formatPhone(order.customer.phone) }}</p>
            </div>
            <div v-if="order.customer.email" class="col-span-2">
              <p class="text-sm text-gray-500">电子邮箱</p>
              <p class="mt-1 font-medium text-gray-900">{{ order.customer.email }}</p>
            </div>
            <div v-if="order.customer.address" class="col-span-2">
              <p class="text-sm text-gray-500">联系地址</p>
              <p class="mt-1 font-medium text-gray-900">{{ order.customer.address }}</p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">手表信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">品牌</p>
              <p class="mt-1 font-medium text-gray-900">{{ order.watchBrand }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">型号</p>
              <p class="mt-1 font-medium text-gray-900">{{ order.watchModel }}</p>
            </div>
            <div v-if="order.watchSerial">
              <p class="text-sm text-gray-500">序列号</p>
              <p class="mt-1 font-medium text-gray-900 font-mono">{{ order.watchSerial }}</p>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500">故障描述</p>
            <p class="mt-1 text-gray-900">{{ order.problemDesc }}</p>
          </div>
          <div v-if="order.inspectionResult" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500">检测结果</p>
            <p class="mt-1 text-gray-900">{{ order.inspectionResult }}</p>
          </div>
        </div>

        <div v-if="order.quote" class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">报价信息</h3>
            <span :class="[
              'px-2.5 py-1 rounded-full text-xs font-medium',
              order.quote.status === 'approved' ? 'bg-green-100 text-green-800' :
              order.quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            ]">
              {{ quoteStatusLabel }}
            </span>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="text-gray-600">零件费用</span>
              <span class="font-medium">{{ formatCurrency(order.quote.partsCost) }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <span class="text-gray-600">人工费用</span>
              <span class="font-medium">{{ formatCurrency(order.quote.laborCost) }}</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="font-semibold text-gray-900">总计</span>
              <span class="text-lg font-bold text-primary-700">{{ formatCurrency(order.quote.amount) }}</span>
            </div>
          </div>
          <p v-if="order.quote.remark" class="mt-4 text-sm text-gray-500">
            备注: {{ order.quote.remark }}
          </p>
          <p v-if="order.quote.approvedAt" class="mt-2 text-xs text-gray-400">
            审批时间: {{ formatDate(order.quote.approvedAt) }}
          </p>
        </div>

        <div v-if="order.parts.length > 0" class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">配件锁定</h3>
            <span class="text-xs text-gray-400">
              共 {{ order.parts.length }} 种配件
            </span>
          </div>
          <div class="space-y-3">
            <div
              v-for="part in order.parts"
              :key="part.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p class="font-medium text-gray-900">{{ part.partName }}</p>
                <p class="text-sm text-gray-500">编号: {{ part.partCode }}</p>
              </div>
              <div class="flex items-center space-x-4">
                <span class="text-sm text-gray-600">x{{ part.quantity }}</span>
                <span :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  part.status === 'locked' ? 'bg-amber-100 text-amber-800' :
                  part.status === 'used' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                ]">
                  {{ part.status === 'locked' ? '已锁定' : part.status === 'used' ? '已使用' : '已释放' }}
                </span>
              </div>
            </div>
          </div>
          <p v-if="order.parts.length > 0" class="mt-3 text-xs text-gray-400">
            锁定时间: {{ formatDate(order.parts[0].lockedAt) }}
          </p>
        </div>

        <div v-if="order.progress.length > 0" class="card p-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">维修进度</h3>
          <div class="space-y-4">
            <div
              v-for="(item, index) in order.progress"
              :key="item.id"
              class="relative pl-8"
            >
              <div
                v-if="index < order.progress.length - 1"
                class="absolute left-3 top-6 w-0.5 h-full bg-gray-200"
              />
              <div
                class="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center"
                :class="getProgressColor(item.status)"
              >
                <Icon :icon="getProgressIcon(item.status)" class="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div class="flex items-center justify-between">
                  <p class="font-medium text-gray-900">{{ getProgressLabel(item.status) }}</p>
                  <span class="text-xs text-gray-400">{{ formatDateTime(item.createdAt) }}</span>
                </div>
                <p class="text-sm text-gray-600 mt-0.5">{{ item.description }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ item.operator }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="order.receipt" class="card p-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">客户回执</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-gray-600">报价确认</span>
              <span :class="[
                'px-2 py-1 rounded text-xs font-medium',
                order.receipt.confirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              ]">
                {{ order.receipt.confirmed ? '已确认' : '待确认' }}
              </span>
            </div>
            <div v-if="order.receipt.confirmedAt" class="text-sm text-gray-500">
              确认时间: {{ formatDate(order.receipt.confirmedAt) }}
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-gray-600">取件状态</span>
              <span :class="[
                'px-2 py-1 rounded text-xs font-medium',
                order.receipt.pickedUp ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              ]">
                {{ order.receipt.pickedUp ? '已取件' : '待取件' }}
              </span>
            </div>
            <div v-if="order.receipt.pickedUpAt" class="text-sm text-gray-500">
              取件时间: {{ formatDate(order.receipt.pickedUpAt) }}
            </div>
            <div v-if="order.receipt.pickupNote" class="text-sm text-gray-600">
              取件备注: {{ order.receipt.pickupNote }}
            </div>
            <div v-if="order.receipt.satisfaction" class="flex items-center justify-between py-2">
              <span class="text-gray-600">满意度</span>
              <div class="flex items-center space-x-1">
                <Icon
                  v-for="star in 5"
                  :key="star"
                  :icon="star <= (order.receipt.satisfaction || 0) ? 'mdi:star' : 'mdi:star-outline'"
                  class="w-4 h-4"
                  :class="star <= (order.receipt.satisfaction || 0) ? 'text-yellow-400' : 'text-gray-300'"
                />
                <span class="text-sm font-medium text-gray-700 ml-2">{{ order.receipt.satisfaction }}星</span>
              </div>
            </div>
            <div v-if="order.receipt.satisfactionComment" class="text-sm text-gray-600">
              评价: {{ order.receipt.satisfactionComment }}
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">处理时间线</h3>
          <Timeline :entries="order.timeline" />
        </div>
      </div>
    </template>

    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-16 h-16 mx-auto mb-4 text-gray-300">
          <Icon icon="mdi:clipboard-text-outline" class="w-full h-full" />
        </div>
        <p class="text-gray-500">请从左侧选择一个工单查看详情</p>
      </div>
    </div>

    <ConfirmModal
      v-model="showRejectModal"
      title="审批驳回"
      message="确定要驳回此报价吗？驳回后配件将被释放，需要重新提交报价。"
      confirm-text="确认驳回"
      confirm-variant="danger"
      type="danger"
      show-input
      input-label="驳回原因"
      input-placeholder="请输入驳回原因..."
      required
      :loading="actionLoading"
      @confirm="handleReject"
    />

    <ConfirmModal
      v-model="showCustomerRejectModal"
      title="客户驳回"
      message="确定要记录客户驳回吗？驳回后配件将被释放，需要重新报价。"
      confirm-text="确认驳回"
      confirm-variant="danger"
      type="danger"
      show-input
      input-label="客户驳回原因"
      input-placeholder="请输入客户驳回原因..."
      required
      :loading="actionLoading"
      @confirm="handleCustomerReject"
    />

    <ConfirmModal
      v-model="showPickupModal"
      title="确认取件"
      message="请确认客户已取走手表。"
      confirm-text="确认取件"
      confirm-variant="success"
      type="warning"
      show-input
      input-label="取件备注"
      input-placeholder="请输入取件备注（可选）..."
      :loading="actionLoading"
      @confirm="handleConfirmPickup"
    />

    <QuoteModal
      v-model="showQuoteModal"
      :order="order"
      :loading="actionLoading"
      @submit="handleSubmitQuote"
    />

    <SatisfactionModal
      v-model="showSatisfactionModal"
      :order="order"
      :loading="actionLoading"
      @submit="handleSatisfactionSurvey"
    />

    <PartLockModal
      v-model="showPartLockModal"
      :order="order"
      :available-parts="partInventory"
      :loading="actionLoading"
      @submit="handleLockParts"
    />

    <ProgressModal
      v-model="showProgressModal"
      :order="order"
      :loading="actionLoading"
      @submit="handleUpdateProgress"
    />

    <InspectModal
      v-model="showInspectModal"
      :order="order"
      :loading="actionLoading"
      @submit="handleStartInspectSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { WorkOrder } from '~/types/workorder';
import { formatDate, formatPhone, formatCurrency, formatDateTime } from '~/utils/format';
import Timeline from './Timeline.vue';
import ConfirmModal from '../common/ConfirmModal.vue';
import QuoteModal from './QuoteModal.vue';
import SatisfactionModal from './SatisfactionModal.vue';
import PartLockModal from './PartLockModal.vue';
import ProgressModal from './ProgressModal.vue';
import InspectModal from './InspectModal.vue';

interface Props {
  order: WorkOrder | null;
}

const props = defineProps<Props>();

const { currentRole } = useRole();
const {
  performAction,
  actionLoading,
  partInventory,
  fetchPartInventory,
} = useWorkOrder();

const showRejectModal = ref(false);
const showCustomerRejectModal = ref(false);
const showPickupModal = ref(false);
const showQuoteModal = ref(false);
const showSatisfactionModal = ref(false);
const showPartLockModal = ref(false);
const showProgressModal = ref(false);
const showInspectModal = ref(false);

const quoteStatusLabel = computed(() => {
  const labels: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已通过',
    rejected: '已驳回',
  };
  return props.order?.quote ? labels[props.order.quote.status] : '';
});

function getProgressLabel(status: string): string {
  const labels: Record<string, string> = {
    inspecting: '检测中',
    parts_preparing: '配件准备',
    repairing: '维修中',
    testing: '测试中',
    completed: '已完成',
  };
  return labels[status] || status;
}

function getProgressColor(status: string): string {
  const colors: Record<string, string> = {
    inspecting: 'bg-blue-500',
    parts_preparing: 'bg-amber-500',
    repairing: 'bg-cyan-500',
    testing: 'bg-purple-500',
    completed: 'bg-green-500',
  };
  return colors[status] || 'bg-gray-500';
}

function getProgressIcon(status: string): string {
  const icons: Record<string, string> = {
    inspecting: 'mdi:magnify',
    parts_preparing: 'mdi:package-variant',
    repairing: 'mdi:hammer-wrench',
    testing: 'mdi:check-circle-outline',
    completed: 'mdi:check',
  };
  return icons[status] || 'mdi:circle';
}

function handleStartInspect() {
  showInspectModal.value = true;
}

async function handleStartInspectSubmit(data: { inspectionResult: string; remark: string }) {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'start_inspect',
      inspectionResult: data.inspectionResult,
      remark: data.remark || '开始检测手表故障',
    });
    showInspectModal.value = false;
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleLockParts(parts: Array<{ partName: string; partCode: string; quantity: number }>) {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'lock_parts',
      parts,
    });
    showPartLockModal.value = false;
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleReleaseParts() {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'release_parts',
    });
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleSubmitQuote(data: { partsCost: number; laborCost: number; remark: string }) {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'submit_quote',
      partsCost: data.partsCost,
      laborCost: data.laborCost,
      remark: data.remark,
    });
    showQuoteModal.value = false;
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleApprove() {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'approve_quote',
    });
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleReject(reason?: string) {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'reject_quote',
      rejectReason: reason,
    });
    showRejectModal.value = false;
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleSendConfirmation() {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'send_confirmation',
    });
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleCustomerConfirm() {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'customer_confirm',
    });
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleCustomerReject(reason?: string) {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'customer_reject',
      rejectReason: reason,
    });
    showCustomerRejectModal.value = false;
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleUpdateProgress(data: { status: string; remark: string }) {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'update_progress',
      progressStatus: data.status,
      remark: data.remark,
    });
    showProgressModal.value = false;
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleCompleteRepair() {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'complete_repair',
    });
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleNotifyPickup() {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'notify_pickup',
    });
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleConfirmPickup(note?: string) {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'confirm_pickup',
      pickupNote: note,
    });
    showPickupModal.value = false;
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleSatisfactionSurvey(data: { satisfaction: number; comment: string }) {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'satisfaction_survey',
      satisfaction: data.satisfaction,
      satisfactionComment: data.comment,
    });
    showSatisfactionModal.value = false;
  } catch (err) {
    console.error('操作失败:', err);
  }
}

async function handleReopen() {
  if (!props.order) return;
  try {
    await performAction(props.order.id, {
      actionType: 'reopen',
    });
  } catch (err) {
    console.error('操作失败:', err);
  }
}
</script>
