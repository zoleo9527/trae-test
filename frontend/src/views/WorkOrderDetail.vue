<template>
  <div class="work-order-detail" v-if="workOrder">
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="router.back()">← 返回</button>
        <div>
          <h1 class="page-title">{{ workOrder.orderNumber }}</h1>
          <div class="status-badge" :style="{ background: STATUS_COLORS[workOrder.status] }">
            {{ STATUS_LABELS[workOrder.status] }}
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button
          v-if="canNegotiate"
          @click="updateStatus('negotiating')"
          class="btn-secondary"
        >
          转入协商
        </button>
        <button
          v-if="canSubmitReview"
          @click="updateStatus('reviewing')"
          class="btn-secondary"
        >
          提交复核
        </button>
        <button
          v-if="canApprove"
          @click="updateStatus('approved')"
          class="btn-primary"
        >
          批准赔付
        </button>
        <button
          v-if="canReject"
          @click="updateStatus('closed')"
          class="btn-danger"
        >
          拒绝赔付
        </button>
        <button
          v-if="canComplete"
          @click="updateStatus('completed')"
          class="btn-primary"
        >
          标记完成
        </button>
      </div>
    </div>

    <div class="detail-content">
      <div class="left-panel">
        <div class="info-card">
          <h3 class="card-title">工单信息</h3>
          <div class="info-row">
            <span class="label">分类</span>
            <span class="value">{{ CATEGORY_LABELS[workOrder.category] }}</span>
          </div>
          <div class="info-row">
            <span class="label">问题类型</span>
            <span class="value" v-if="workOrder.problemType">
              {{ PROBLEM_TYPE_LABELS[workOrder.problemType] }}
            </span>
          </div>
          <div class="info-row">
            <span class="label">标题</span>
            <span class="value">{{ workOrder.title }}</span>
          </div>
          <div class="info-row">
            <span class="label">客户诉求金额</span>
            <span class="value highlight">¥{{ workOrder.requestedAmount || 0 }}</span>
          </div>
          <div class="info-row">
            <span class="label">原始价格</span>
            <span class="value">¥{{ workOrder.originalPrice || 0 }}</span>
          </div>
          <div class="info-row full-width">
            <span class="label">问题描述</span>
            <p class="value text">{{ workOrder.description }}</p>
          </div>
          <div class="info-row">
            <span class="label">处理人</span>
            <span class="value" v-if="workOrder.assignee">
              {{ workOrder.assignee.avatar }} {{ workOrder.assignee.name }}
              ({{ ROLE_LABELS[workOrder.assignee.role] }})
            </span>
          </div>
        </div>

        <div class="info-card" v-if="workOrder.filmRoll">
          <h3 class="card-title">
            关联胶卷
            <span class="warning-badge" v-if="workOrder.filmRoll.isMixed">⚠️ 混号</span>
          </h3>
          <div class="info-row">
            <span class="label">胶卷号</span>
            <span class="value">{{ workOrder.filmRoll.rollNumber }}</span>
          </div>
          <div class="info-row">
            <span class="label">客户姓名</span>
            <span class="value">{{ workOrder.filmRoll.customerName }}</span>
          </div>
          <div class="info-row">
            <span class="label">胶卷信息</span>
            <span class="value">
              {{ workOrder.filmRoll.filmBrand }}
              {{ workOrder.filmRoll.iso }}
              {{ workOrder.filmRoll.exposures }}张
            </span>
          </div>
          <div class="info-row">
            <span class="label">交付版本</span>
            <span class="value">{{ workOrder.filmRoll.deliveryVersion || '-' }}</span>
          </div>
          <div class="info-row full-width" v-if="workOrder.filmRoll.isMixed">
            <span class="label">混号说明</span>
            <p class="value text warning">
              {{ workOrder.filmRoll.mixedNote }}
              <br />
              混装胶卷：{{ workOrder.filmRoll.mixedWithRollNumber }}
            </p>
          </div>
        </div>

        <div class="info-card">
          <h3 class="card-title">赔付方案</h3>
          <div v-if="workOrder.compensation">
            <div class="info-row">
              <span class="label">赔付类型</span>
              <span class="value">
                {{ COMPENSATION_TYPE_LABELS[workOrder.compensation.type] }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">赔付金额</span>
              <span class="value highlight">¥{{ workOrder.compensation.amount }}</span>
            </div>
            <div class="info-row">
              <span class="label">客户承担</span>
              <span class="value">¥{{ workOrder.compensation.customerCost }}</span>
            </div>
            <div class="info-row">
              <span class="label">门店承担</span>
              <span class="value">¥{{ workOrder.compensation.labCost }}</span>
            </div>
            <div class="info-row full-width">
              <span class="label">赔付原因</span>
              <p class="value text">{{ workOrder.compensation.reason }}</p>
            </div>
            <div class="info-row full-width" v-if="workOrder.compensation.ownerReview">
              <span class="label">复核意见</span>
              <p class="value text">{{ workOrder.compensation.ownerReview }}</p>
            </div>
            <div class="info-row" v-if="workOrder.compensation.approvedBy">
              <span class="label">审批人</span>
              <span class="value">{{ workOrder.compensation.approvedBy }}</span>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无赔付方案</p>
            <button
              v-if="canCreateCompensation"
              @click="showCompensationForm = true"
              class="btn-secondary"
            >
              创建赔付方案
            </button>
          </div>
        </div>

        <div class="info-card" v-if="showCompensationForm">
          <h3 class="card-title">创建赔付方案</h3>
          <div class="form-group">
            <label>赔付类型</label>
            <select v-model="compensationForm.type" class="form-control">
              <option v-for="(label, key) in COMPENSATION_TYPE_LABELS" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>赔付金额</label>
            <input v-model.number="compensationForm.amount" type="number" class="form-control" />
          </div>
          <div class="form-group">
            <label>赔付原因</label>
            <textarea v-model="compensationForm.reason" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button @click="showCompensationForm = false" class="btn-text">取消</button>
            <button @click="submitCompensation" class="btn-primary">提交</button>
          </div>
        </div>

        <div class="info-card" v-if="workOrder.negotiationSummary">
          <h3 class="card-title">协商摘要</h3>
          <p class="summary-text">{{ workOrder.negotiationSummary }}</p>
        </div>

        <div class="info-card" v-if="workOrder.reviewConclusion">
          <h3 class="card-title">复核结论</h3>
          <p class="summary-text">{{ workOrder.reviewConclusion }}</p>
        </div>
      </div>

      <div class="right-panel">
        <div class="timeline-card">
          <h3 class="card-title">状态流转</h3>
          <div class="timeline">
            <div class="timeline-item" v-for="log in workOrder.statusLogs" :key="log.id">
              <div class="timeline-dot" :style="{ background: STATUS_COLORS[log.toStatus] }"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="from-status">{{ STATUS_LABELS[log.fromStatus] || '创建' }}</span>
                  <span class="arrow">→</span>
                  <span class="to-status">{{ STATUS_LABELS[log.toStatus] }}</span>
                </div>
                <p class="timeline-remark" v-if="log.remark">{{ log.remark }}</p>
                <div class="timeline-footer">
                  <span class="operator">{{ log.operatorName }}</span>
                  <span class="time">{{ formatDate(log.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="notes-card">
          <h3 class="card-title">备注记录</h3>

          <div class="add-note">
            <textarea
              v-model="newNote.content"
              placeholder="添加备注..."
              class="note-input"
              rows="3"
            ></textarea>
            <div class="note-actions">
              <select v-model="newNote.type" class="note-type">
                <option v-for="(label, key) in NOTE_TYPE_LABELS" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
              <label class="private-label">
                <input type="checkbox" v-model="newNote.isPrivate" />
                仅内部可见
              </label>
              <button @click="addNote" class="btn-primary" :disabled="!newNote.content.trim()">
                添加
              </button>
            </div>
          </div>

          <div class="notes-list">
            <div
              class="note-item"
              v-for="note in workOrder.notes"
              :key="note.id"
              :class="{ private: note.isPrivate }"
            >
              <div class="note-header">
                <span class="note-type-tag" :class="note.type">
                  {{ NOTE_TYPE_LABELS[note.type] }}
                </span>
                <span class="note-private" v-if="note.isPrivate">🔒 私有</span>
              </div>
              <p class="note-content">{{ note.content }}</p>
              <div class="note-footer">
                <span class="note-creator">{{ note.creatorName }}</span>
                <span class="note-time">{{ formatDate(note.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="loading" v-else>加载中...</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWorkOrdersStore } from '@/stores/workOrders';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CATEGORY_LABELS,
  PROBLEM_TYPE_LABELS,
  ROLE_LABELS,
  NOTE_TYPE_LABELS,
  COMPENSATION_TYPE_LABELS,
} from '@/utils/constants';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const workOrdersStore = useWorkOrdersStore();

const workOrder = computed(() => workOrdersStore.currentWorkOrder);
const showCompensationForm = ref(false);

const compensationForm = ref({
  type: 'partial_refund',
  amount: 0,
  reason: '',
});

const newNote = ref({
  content: '',
  type: 'internal',
  isPrivate: false,
});

const canNegotiate = computed(() => {
  return (
    authStore.userRole === 'customer_service' &&
    workOrder.value?.status === 'pending'
  );
});

const canSubmitReview = computed(() => {
  return (
    authStore.userRole === 'customer_service' &&
    workOrder.value?.status === 'negotiating'
  );
});

const canApprove = computed(() => {
  return authStore.userRole === 'owner' && workOrder.value?.status === 'reviewing';
});

const canReject = computed(() => {
  return authStore.userRole === 'owner' && workOrder.value?.status === 'reviewing';
});

const canComplete = computed(() => {
  return (
    (authStore.userRole === 'owner' || authStore.userRole === 'customer_service') &&
    workOrder.value?.status === 'approved'
  );
});

const canCreateCompensation = computed(() => {
  return (
    authStore.userRole === 'customer_service' &&
    (workOrder.value?.status === 'negotiating' || workOrder.value?.status === 'pending')
  );
});

async function updateStatus(status: string) {
  try {
    await workOrdersStore.updateWorkOrder(route.params.id as string, { status });
    await loadData();
  } catch (e) {
    console.error('状态更新失败', e);
  }
}

async function submitCompensation() {
  try {
    await workOrdersStore.createCompensation(
      route.params.id as string,
      compensationForm.value,
    );
    showCompensationForm.value = false;
    compensationForm.value = { type: 'partial_refund', amount: 0, reason: '' };
    await loadData();
  } catch (e) {
    console.error('创建赔付方案失败', e);
  }
}

async function addNote() {
  try {
    await workOrdersStore.addNote(route.params.id as string, newNote.value);
    newNote.value = { content: '', type: 'internal', isPrivate: false };
    await loadData();
  } catch (e) {
    console.error('添加备注失败', e);
  }
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

async function loadData() {
  await workOrdersStore.fetchWorkOrder(route.params.id as string);
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.work-order-detail {
  padding: 24px 32px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e5ea;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: none;
  color: #007aff;
  font-size: 14px;
  padding: 8px 0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1d1d1f;
  display: inline-block;
  margin-right: 12px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  vertical-align: middle;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary,
.btn-danger,
.btn-text {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #007aff;
  color: #fff;
}

.btn-primary:hover {
  background: #0056cc;
}

.btn-secondary {
  background: #f5f5f7;
  color: #1d1d1f;
}

.btn-secondary:hover {
  background: #e5e5ea;
}

.btn-danger {
  background: #ff3b30;
  color: #fff;
}

.btn-danger:hover {
  background: #cc2f26;
}

.btn-text {
  background: transparent;
  color: #86868b;
}

.btn-text:hover {
  color: #1d1d1f;
}

.detail-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

.info-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-badge {
  background: #fff5e6;
  color: #ff9500;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.info-row {
  display: flex;
  margin-bottom: 12px;
}

.info-row.full-width {
  flex-direction: column;
  gap: 6px;
}

.info-row .label {
  width: 100px;
  color: #86868b;
  font-size: 13px;
  flex-shrink: 0;
}

.info-row .value {
  color: #1d1d1f;
  font-size: 14px;
}

.info-row .value.highlight {
  color: #ff3b30;
  font-weight: 600;
  font-size: 16px;
}

.info-row .value.text {
  line-height: 1.6;
  white-space: pre-wrap;
}

.info-row .value.text.warning {
  color: #ff9500;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #86868b;
}

.empty-state p {
  margin-bottom: 12px;
}

.summary-text {
  background: #f5f5f7;
  padding: 14px;
  border-radius: 8px;
  line-height: 1.7;
  color: #1d1d1f;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: #86868b;
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.timeline-card,
.notes-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 14px;
  padding-bottom: 20px;
  position: relative;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 20px;
  bottom: 0;
  width: 2px;
  background: #e5e5ea;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  z-index: 1;
}

.timeline-content {
  flex: 1;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.from-status {
  color: #86868b;
  font-size: 13px;
}

.arrow {
  color: #c7c7cc;
}

.to-status {
  font-weight: 600;
  font-size: 13px;
}

.timeline-remark {
  color: #1d1d1f;
  font-size: 13px;
  margin-bottom: 4px;
}

.timeline-footer {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #86868b;
}

.add-note {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.note-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  margin-bottom: 10px;
}

.note-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.note-type {
  padding: 6px 10px;
  border: 1px solid #d2d2d7;
  border-radius: 6px;
  font-size: 13px;
}

.private-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #86868b;
  cursor: pointer;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.note-item {
  padding: 14px;
  background: #f5f5f7;
  border-radius: 10px;
}

.note-item.private {
  background: #fff5e6;
}

.note-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.note-type-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.note-type-tag.internal {
  background: #e8f0fe;
  color: #007aff;
}

.note-type-tag.customer {
  background: #f0fff4;
  color: #34c759;
}

.note-type-tag.negotiation {
  background: #fff5e6;
  color: #ff9500;
}

.note-type-tag.review {
  background: #f5e6ff;
  color: #af52de;
}

.note-private {
  font-size: 11px;
  color: #ff9500;
}

.note-content {
  font-size: 14px;
  line-height: 1.6;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #86868b;
}

.loading {
  text-align: center;
  padding: 80px;
  color: #86868b;
}
</style>
