<template>
  <div class="appeal-detail">
    <div class="detail-header card">
      <div class="header-left">
        <button class="btn btn-ghost back-btn" @click="$router.back()">
          ← 返回
        </button>
        <div class="appeal-info">
          <div class="appeal-title">
            <span class="appeal-no">{{ appeal?.appeal_no }}</span>
            {{ appeal?.title }}
          </div>
          <div class="appeal-meta">
            <span class="badge" :class="typeClass">{{ typeLabels[appeal?.type as keyof typeof typeLabels] }}</span>
            <span class="badge" :class="priorityClass(appeal?.priority)">
              {{ priorityLabels[appeal?.priority as keyof typeof priorityLabels] }}
            </span>
            <span class="badge" :class="statusClass(appeal?.status)">
              {{ statusLabels[appeal?.status as keyof typeof statusLabels] }}
            </span>
            <span class="meta-text">
              创建于 {{ formatDateTime(appeal?.created_at || 0) }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-right" v-if="canUpdateStatus">
        <select v-model="newStatus" class="select" style="width: 140px;">
          <option v-for="(label, value) in statusLabels" :key="value" :value="value">{{ label }}</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="handleStatusChange" :disabled="newStatus === appeal?.status">
          更新状态
        </button>
      </div>
    </div>
    
    <div class="detail-grid">
      <div class="detail-main">
        <div class="card description-card">
          <div class="card-header">
            <h3>问题描述</h3>
          </div>
          <div class="card-body">
            <p class="description-text">{{ appeal?.description }}</p>
          </div>
        </div>
        
        <div class="card timeline-card">
          <div class="card-header">
            <h3>处理时间线</h3>
          </div>
          <div class="card-body">
            <div class="timeline">
              <div v-for="(item, index) in timeline" :key="item.id" class="timeline-item">
                <div class="timeline-dot" :class="{ last: index === timeline.length - 1 }"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-action">{{ item.action }}</span>
                    <span class="timeline-time">{{ formatDateTime(item.created_at) }}</span>
                  </div>
                  <div class="timeline-meta">
                    <span v-if="item.actor_name">{{ item.actor_name }}</span>
                  </div>
                  <div v-if="item.note" class="timeline-note">{{ item.note }}</div>
                </div>
              </div>
            </div>
            
            <div class="timeline-input">
              <textarea v-model="timelineNote" class="textarea" placeholder="添加备注或进展记录..."></textarea>
              <div class="input-actions">
                <button class="btn btn-primary btn-sm" @click="handleAddTimeline" :disabled="!timelineNote.trim()">
                  添加记录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="detail-side">
        <div class="card related-card">
          <div class="card-header">
            <h3>关联信息</h3>
          </div>
          <div class="card-body">
            <div class="related-item" v-if="appeal?.locker_no">
              <span class="related-label">储物柜:</span>
              <span class="tag">{{ appeal.locker_no }} ({{ appeal.locker_zone }}区)</span>
            </div>
            <div class="related-item" v-if="appeal?.assignment_operator_name">
              <span class="related-label">分配操作人:</span>
              <span>{{ appeal.assignment_operator_name }}</span>
            </div>
            <div class="related-item" v-if="appeal?.assignment_assigned_at">
              <span class="related-label">分配时间:</span>
              <span>{{ formatDateTime(appeal.assignment_assigned_at) }}</span>
            </div>
            <div class="related-item" v-if="appeal?.assignment_member_name || appeal?.assignment_guest_name">
              <span class="related-label">使用人:</span>
              <span>{{ appeal.assignment_member_name || appeal.assignment_guest_name }}</span>
            </div>
            <div class="related-item" v-if="appeal?.course_name">
              <span class="related-label">课程:</span>
              <span class="tag">{{ appeal.course_name }}</span>
            </div>
            <div class="related-item" v-if="appeal?.transaction_member_name">
              <span class="related-label">储值记录:</span>
              <span>{{ appeal.transaction_member_name }} ¥{{ Math.abs(appeal.transaction_amount || 0) }} ({{ appeal.transaction_type === 'recharge' ? '充值' : appeal.transaction_type === 'consume' ? '消费' : '退款' }})</span>
            </div>
            <div class="related-item" v-if="appeal?.patrol_location">
              <span class="related-label">巡场位置:</span>
              <span>{{ appeal.patrol_location }}</span>
            </div>
            <div class="related-item" v-if="appeal?.patrol_description">
              <span class="related-label">巡场描述:</span>
              <span class="patrol-desc">{{ appeal.patrol_description }}</span>
            </div>
            <div class="related-item">
              <span class="related-label">报告人:</span>
              <span>{{ appeal?.reporter_name || '系统' }}</span>
            </div>
            <div class="related-item" v-if="appeal?.assignee_name">
              <span class="related-label">处理人:</span>
              <span>{{ appeal.assignee_name }}</span>
            </div>
            <div class="related-item">
              <span class="related-label">更新时间:</span>
              <span>{{ formatDateTime(appeal?.updated_at || 0) }}</span>
            </div>
          </div>
        </div>
        
        <div class="card assign-card" v-if="canAssign">
          <div class="card-header">
            <h3>分配处理</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="label">选择处理人</label>
              <select v-model="selectedAssignee" class="select">
                <option :value="null">未分配</option>
                <option v-for="u in users" :key="u.id" :value="u.id">
                  {{ u.name }} ({{ roleLabels[u.role] }})
                </option>
              </select>
            </div>
            <button class="btn btn-secondary btn-sm" @click="handleAssign" :disabled="selectedAssignee === appeal?.assignee_id">
              分配
            </button>
          </div>
        </div>
        
        <div class="card quick-actions">
          <div class="card-header">
            <h3>快捷操作</h3>
          </div>
          <div class="card-body">
            <button class="action-btn" @click="quickAction('start')" :disabled="!canUpdateStatus">
              <span class="action-icon">🔍</span>
              <span>开始调查</span>
            </button>
            <button class="action-btn" @click="quickAction('resolve')" :disabled="!canResolve">
              <span class="action-icon">✅</span>
              <span>标记已解决</span>
            </button>
            <button class="action-btn" @click="quickAction('escalate')" :disabled="!canEscalate">
              <span class="action-icon">⬆️</span>
              <span>升级处理</span>
            </button>
            <button class="action-btn" @click="quickAction('reject')" :disabled="!canReject">
              <span class="action-icon">❌</span>
              <span>驳回申诉</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import dbApi from '@/db'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'
import { APPEAL_TYPE_LABELS, APPEAL_STATUS_LABELS, APPEAL_PRIORITY_LABELS, ROLE_LABELS } from '@/types'

const route = useRoute()
const userStore = useUserStore()

const appeal = ref<any>(null)
const timeline = ref<any[]>([])
const users = ref<any[]>([])
const newStatus = ref('')
const timelineNote = ref('')
const selectedAssignee = ref<number | null>(null)

const typeLabels = APPEAL_TYPE_LABELS
const statusLabels = APPEAL_STATUS_LABELS
const priorityLabels = APPEAL_PRIORITY_LABELS
const roleLabels = ROLE_LABELS

const typeClass = computed(() => 'badge-info')

const canUpdateStatus = computed(() => {
  if (!userStore.currentUser) return false
  if (userStore.hasRole(['director'])) return true
  if (userStore.hasRole(['head_coach'])) return appeal.value?.assignee_id === userStore.currentUser.id
  if (userStore.hasRole(['reception'])) return appeal.value?.status === 'pending'
  return false
})

const canResolve = computed(() => {
  if (!userStore.currentUser) return false
  if (userStore.hasRole(['director'])) return true
  if (userStore.hasRole(['head_coach'])) return appeal.value?.assignee_id === userStore.currentUser.id && appeal.value?.status === 'investigating'
  return false
})

const canEscalate = computed(() => {
  if (!userStore.currentUser) return false
  return userStore.hasRole(['director'])
})

const canReject = computed(() => {
  if (!userStore.currentUser) return false
  return userStore.hasRole(['director'])
})

const canAssign = computed(() => {
  return userStore.hasRole(['director'])
})

function priorityClass(priority?: string): string {
  const map: Record<string, string> = {
    urgent: 'badge-urgent',
    high: 'badge-error',
    normal: 'badge-warning',
    low: 'badge-muted'
  }
  return map[priority || ''] || 'badge-muted'
}

function statusClass(status?: string): string {
  const map: Record<string, string> = {
    pending: 'badge-warning',
    investigating: 'badge-info',
    resolved: 'badge-success',
    rejected: 'badge-error',
    escalated: 'badge-urgent'
  }
  return map[status || ''] || 'badge-muted'
}

function formatDateTime(ts: number): string {
  return dayjs(ts).format('YYYY-MM-DD HH:mm')
}

async function handleStatusChange() {
  if (!appeal.value || newStatus.value === appeal.value.status) return
  if (!canUpdateStatus.value) return
  await dbApi.updateAppealStatus(appeal.value.id, newStatus.value as any, userStore.currentUser?.id)
  await loadAppeal()
}

async function handleAddTimeline() {
  if (!timelineNote.value.trim() || !appeal.value) return
  await dbApi.addAppealTimeline(appeal.value.id, '添加备注', timelineNote.value.trim(), userStore.currentUser?.id)
  timelineNote.value = ''
  await loadTimeline()
}

async function handleAssign() {
  if (!appeal.value || !canAssign.value) return
  await dbApi.assignAppeal(appeal.value.id, selectedAssignee.value!, userStore.currentUser?.id)
  await loadAppeal()
}

function quickAction(action: string) {
  const statusMap: Record<string, any> = {
    start: 'investigating',
    resolve: 'resolved',
    escalate: 'escalated',
    reject: 'rejected'
  }
  newStatus.value = statusMap[action]
  handleStatusChange()
}

async function loadAppeal() {
  const id = Number(route.params.id)
  appeal.value = await dbApi.getAppealById(id)
  if (appeal.value) {
    newStatus.value = appeal.value.status
    selectedAssignee.value = appeal.value.assignee_id
  }
  await loadTimeline()
}

async function loadTimeline() {
  const id = Number(route.params.id)
  timeline.value = await dbApi.getAppealTimeline(id)
}

async function loadUsers() {
  users.value = await dbApi.getUsers()
}

onMounted(() => {
  loadAppeal()
  loadUsers()
})

watch(() => route.params.id, () => {
  loadAppeal()
})
</script>

<style scoped>
.appeal-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.back-btn {
  flex-shrink: 0;
}

.appeal-info {
  min-width: 0;
}

.appeal-title {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.appeal-no {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.appeal-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-text {
  font-size: 12px;
  color: #64748b;
  margin-left: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: flex-start;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.card-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.card-body {
  padding: 16px;
}

.description-text {
  color: #cbd5e1;
  line-height: 1.6;
  font-size: 13px;
}

.timeline {
  position: relative;
  padding-left: 24px;
  margin-bottom: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: rgba(148, 163, 184, 0.15);
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  border: 3px solid #1e293b;
}

.timeline-dot.last {
  background: #4ade80;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.timeline-action {
  font-weight: 500;
  color: #e2e8f0;
  font-size: 13px;
}

.timeline-time {
  font-size: 11px;
  color: #64748b;
}

.timeline-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.timeline-note {
  font-size: 12px;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.4);
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 2px solid #3b82f6;
}

.timeline-input {
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  padding-top: 16px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.related-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  font-size: 13px;
}

.related-item:not(:last-child) {
  border-bottom: 1px dashed rgba(148, 163, 184, 0.1);
}

.related-label {
  color: #64748b;
  flex-shrink: 0;
}

.related-item span:last-child {
  color: #e2e8f0;
  text-align: right;
}

.patrol-desc {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 0;
}

.assign-card .form-group {
  margin-bottom: 10px;
}

.quick-actions .card-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  color: #94a3b8;
  transition: all 0.15s ease;
}

.action-btn:hover:not(:disabled) {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(59, 130, 246, 0.3);
  color: #e2e8f0;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-icon {
  font-size: 18px;
}
</style>
