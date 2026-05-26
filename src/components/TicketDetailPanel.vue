<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores'
import StatusTimeline from './StatusTimeline.vue'

const store = useAppStore()
const noteInput = ref('')

const ticket = computed(() => store.selectedTicket)
const isManager = computed(() => store.currentRole === 'manager')
const isConsultant = computed(() => store.currentRole === 'consultant')

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'badge-gray' },
  processing: { label: '处理中', color: 'badge-blue' },
  confirmed: { label: '已确认', color: 'badge-purple' },
  resolved: { label: '已解决', color: 'badge-green' },
  rejected: { label: '已拒绝', color: 'badge-red' }
}

const currentUser = computed(() => {
  if (store.currentRole === 'manager') return '陈经理'
  if (store.currentRole === 'consultant') return '销售-' + (ticket.value?.assignee.includes('李明') ? '李明' : '周琳')
  return '协调-赵芳'
})

function backToOrder() {
  if (ticket.value) {
    store.selectOrder(ticket.value.orderId)
  }
}

function updateStatus(status: string) {
  if (ticket.value) {
    store.updateTicketStatus(ticket.value.id, status as any, currentUser.value)
  }
}

function confirmPart(partId: string) {
  store.confirmPart(partId, currentUser.value)
}

function submitCompensation() {
  if (ticket.value && ticket.value.id) {
    store.submitCompensation(ticket.value.id, currentUser.value)
  }
}

function approveCompensation() {
  if (ticket.value && ticket.value.id) {
    store.approveCompensation(ticket.value.id, currentUser.value)
  }
}

function rejectCompensation() {
  if (ticket.value && ticket.value.id) {
    store.rejectCompensation(ticket.value.id, currentUser.value, '经理审批未通过')
  }
}

function addNote() {
  if (noteInput.value.trim() && ticket.value) {
    store.addTicketNote(ticket.value.id, noteInput.value.trim(), currentUser.value)
    noteInput.value = ''
  }
}
</script>

<template>
  <div v-if="ticket" class="ticket-detail">
    <div class="detail-header">
      <button class="btn btn-ghost btn-sm" @click="backToOrder">← 返回订单</button>
      <div class="flex items-center gap-3">
        <h2 class="detail-title">{{ ticket.title }}</h2>
        <span class="badge" :class="statusLabels[ticket.status].color">
          {{ statusLabels[ticket.status].label }}
        </span>
        <span
          class="badge"
          :class="ticket.priority === 'high' ? 'badge-red' : ticket.priority === 'medium' ? 'badge-yellow' : 'badge-gray'"
        >
          {{ ticket.priority === 'high' ? '紧急' : ticket.priority === 'medium' ? '一般' : '低' }}
        </span>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-main">
        <div class="section-card">
          <div class="section-header"><h3>问题描述</h3></div>
          <div class="description-box">
            {{ ticket.description }}
          </div>
          <div class="meta-row">
            <span class="meta-item">
              <span class="meta-label">关联订单</span>
              <span class="meta-value">{{ ticket.relatedOrder?.orderNo }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">客户</span>
              <span class="meta-value">{{ ticket.relatedOrder?.customer.name }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">创建时间</span>
              <span class="meta-value">{{ ticket.createdAt }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">创建人</span>
              <span class="meta-value">{{ ticket.createdBy }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">负责人</span>
              <span class="meta-value">{{ ticket.assignee }}</span>
            </span>
          </div>
        </div>

        <div class="section-card" v-if="ticket.type === 'supplementary'">
          <div class="section-header">
            <h3>补件清单</h3>
            <span class="badge badge-blue">{{ ticket.parts.length }} 项</span>
          </div>
          <div class="parts-list">
            <div
              v-for="part in ticket.parts"
              :key="part.id"
              class="part-item"
              :class="{ confirmed: part.confirmed }"
            >
              <div class="part-main">
                <div class="part-name">{{ part.name }}</div>
                <div class="part-sku">{{ part.sku }}</div>
              </div>
              <div class="part-info">
                <div class="part-row">
                  <span class="part-label">原因</span>
                  <span class="part-value">{{ part.reason }}</span>
                </div>
                <div class="part-row">
                  <span class="part-label">数量</span>
                  <span class="part-value">{{ part.quantity }}</span>
                </div>
                <div class="part-row" v-if="part.note">
                  <span class="part-label">备注</span>
                  <span class="part-value text-sm">{{ part.note }}</span>
                </div>
                <div class="part-row" v-if="part.confirmed">
                  <span class="part-label">确认人</span>
                  <span class="part-value">{{ part.confirmedBy }}</span>
                </div>
                <div class="part-row" v-if="part.confirmed">
                  <span class="part-label">确认时间</span>
                  <span class="part-value">{{ part.confirmedAt }}</span>
                </div>
              </div>
              <div class="part-status">
                <template v-if="part.confirmed">
                  <span class="badge badge-green">已确认</span>
                </template>
                <template v-else>
                  <button
                    v-if="isConsultant || isManager"
                    class="btn btn-primary btn-sm"
                    @click="confirmPart(part.id)"
                  >
                    确认补件
                  </button>
                  <span v-else class="badge badge-yellow">待确认</span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="section-card" v-if="ticket.type === 'compensation' && ticket.compensation">
          <div class="section-header">
            <h3>赔付协商</h3>
            <span class="badge" :class="ticket.compensation.status === 'approved' ? 'badge-green' : ticket.compensation.status === 'rejected' ? 'badge-red' : 'badge-yellow'">
              {{ ticket.compensation.status === 'proposed' ? '待提交' : ticket.compensation.status === 'negotiating' ? '协商中' : ticket.compensation.status === 'approved' ? '已通过' : '已拒绝' }}
            </span>
          </div>
          <div class="compensation-box">
            <div class="comp-amount">
              <span class="amount-label">赔付金额</span>
              <span class="amount-value">¥{{ ticket.compensation.amount.toLocaleString() }}</span>
            </div>
            <div class="comp-section">
              <div class="comp-label">客户诉求</div>
              <div class="comp-text">{{ ticket.compensation.customerRequest }}</div>
            </div>
            <div class="comp-section">
              <div class="comp-label">内部评估</div>
              <div class="comp-text">{{ ticket.compensation.internalDiscussion }}</div>
            </div>
            <div class="comp-section" v-if="ticket.compensation.approvedBy">
              <div class="comp-label">审批人</div>
              <div class="comp-text">{{ ticket.compensation.approvedBy }} · {{ ticket.compensation.approvedAt }}</div>
            </div>
            <div class="comp-actions" v-if="ticket.compensation.status !== 'approved' && ticket.compensation.status !== 'rejected'">
              <template v-if="isConsultant && ticket.compensation.status === 'proposed'">
                <button class="btn btn-primary" @click="submitCompensation">提交赔付方案</button>
              </template>
              <template v-if="isManager && ticket.compensation.status === 'negotiating'">
                <button class="btn btn-primary" @click="approveCompensation">审批通过</button>
                <button class="btn btn-danger" @click="rejectCompensation">拒绝</button>
              </template>
              <template v-if="!isManager && !isConsultant">
                <span class="text-sm text-gray-500">等待经理审批</span>
              </template>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header"><h3>处理记录</h3></div>
          <StatusTimeline :history="ticket.history" />
        </div>

        <div class="section-card">
          <div class="section-header"><h3>添加备注</h3></div>
          <div class="note-input-area">
            <textarea
              v-model="noteInput"
              class="note-input"
              placeholder="输入备注内容..."
              rows="2"
            ></textarea>
            <div class="note-actions">
              <button class="btn btn-secondary btn-sm" @click="noteInput = ''">清空</button>
              <button class="btn btn-primary btn-sm" :disabled="!noteInput.trim()" @click="addNote">
                添加备注
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-side">
        <div class="section-card">
          <div class="section-header"><h3>快速操作</h3></div>
          <div class="action-list">
            <template v-if="ticket.status === 'pending'">
              <button class="action-btn" @click="updateStatus('processing')">
                <span class="action-icon">→</span>
                开始处理
              </button>
            </template>
            <template v-if="ticket.status === 'processing' && ticket.type === 'supplementary'">
              <button class="action-btn" @click="updateStatus('confirmed')">
                <span class="action-icon">✓</span>
                确认工单
              </button>
            </template>
            <template v-if="ticket.status !== 'resolved' && ticket.status !== 'rejected'">
              <button class="action-btn action-success" @click="updateStatus('resolved')">
                <span class="action-icon">✓</span>
                标记已解决
              </button>
            </template>
            <template v-if="ticket.status !== 'rejected'">
              <button class="action-btn action-danger" @click="updateStatus('rejected')">
                <span class="action-icon">✕</span>
                关闭工单
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-detail {
  padding: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 16px;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
}

.section-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.description-box {
  padding: 16px;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
  background: #f9fafb;
  border-radius: 0;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
}

.meta-item {
  display: flex;
  gap: 6px;
}

.meta-label {
  font-size: 11px;
  color: #9ca3af;
}

.meta-value {
  font-size: 12px;
  color: #374151;
  font-weight: 500;
}

.parts-list {
  padding: 8px;
}

.part-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 8px;
  transition: all 0.15s;
}

.part-item.confirmed {
  border-color: #86efac;
  background: #f0fdf4;
}

.part-main {
  width: 160px;
  flex-shrink: 0;
}

.part-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.part-sku {
  font-size: 10px;
  color: #9ca3af;
  font-family: 'SF Mono', Menlo, monospace;
}

.part-info {
  flex: 1;
}

.part-row {
  display: flex;
  gap: 8px;
  padding: 2px 0;
}

.part-label {
  font-size: 11px;
  color: #9ca3af;
  width: 56px;
  flex-shrink: 0;
}

.part-value {
  font-size: 12px;
  color: #374151;
}

.part-status {
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
}

.compensation-box {
  padding: 16px;
}

.comp-amount {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 16px;
}

.amount-label {
  font-size: 12px;
  color: #9ca3af;
}

.amount-value {
  font-size: 28px;
  font-weight: 700;
  color: #ef4444;
}

.comp-section {
  margin-bottom: 12px;
}

.comp-label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.comp-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  background: #f9fafb;
  padding: 10px 12px;
  border-radius: 6px;
}

.comp-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.note-input-area {
  padding: 12px 16px;
}

.note-input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
}

.note-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.action-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;
  transition: all 0.15s;
}

.action-btn:hover {
  background: #e5e7eb;
}

.action-btn.action-success:hover {
  background: #d1fae5;
  color: #059669;
}

.action-btn.action-danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

.action-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
</style>