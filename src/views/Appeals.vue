<template>
  <div class="appeals-page">
    <div class="page-header">
      <div class="filter-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>
      <div class="header-actions">
        <select v-model="filterType" class="select" style="width: 140px;">
          <option value="">全部类型</option>
          <option v-for="(label, value) in typeLabels" :key="value" :value="value">{{ label }}</option>
        </select>
        <button 
          v-if="userStore.hasRole(['director', 'head_coach', 'reception'])" 
          class="btn btn-primary" 
          @click="openCreateModal()"
        >
          + 新建申诉
        </button>
      </div>
    </div>
    
    <div class="appeals-list card">
      <table class="table">
        <thead>
          <tr>
            <th>编号</th>
            <th>类型</th>
            <th>标题</th>
            <th>关联</th>
            <th>优先级</th>
            <th>状态</th>
            <th>报告人</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="appeal in filteredAppeals"
            :key="appeal.id"
            class="appeal-row"
            @click="$router.push(`/appeals/${appeal.id}`)"
          >
            <td><span class="appeal-no">{{ appeal.appeal_no }}</span></td>
            <td><span class="badge badge-info">{{ typeLabels[appeal.type] }}</span></td>
            <td class="appeal-title-cell">{{ appeal.title }}</td>
            <td>
              <span v-if="appeal.locker_no" class="tag">储物柜 {{ appeal.locker_no }}</span>
              <span v-else-if="appeal.course_name" class="tag">{{ appeal.course_name }}</span>
              <span v-else-if="appeal.transaction_id" class="tag">交易 #{{ appeal.transaction_id }}</span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span class="badge" :class="priorityClass(appeal.priority)">
                {{ priorityLabels[appeal.priority] }}
              </span>
            </td>
            <td>
              <span class="badge" :class="statusClass(appeal.status)">
                {{ statusLabels[appeal.status] }}
              </span>
            </td>
            <td>{{ appeal.reporter_name || '-' }}</td>
            <td>{{ formatDateTime(appeal.created_at) }}</td>
            <td>
              <button class="btn btn-sm btn-secondary" @click.stop>查看</button>
            </td>
          </tr>
          <tr v-if="!filteredAppeals.length">
            <td colspan="9">
              <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-text">暂无申诉记录</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal" style="width: 600px;">
        <div class="modal-header">
          <div class="modal-title">新建申诉</div>
          <button class="btn-ghost" @click="closeCreateModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="prefillInfo" class="prefill-banner">
            <span class="prefill-icon">🔗</span>
            <span>{{ prefillInfo }}</span>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="label">申诉类型</label>
              <select v-model="createForm.type" class="select" @change="onTypeChange">
                <option v-for="(label, value) in typeLabels" :key="value" :value="value">{{ label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">优先级</label>
              <select v-model="createForm.priority" class="select">
                <option v-for="(label, value) in priorityLabels" :key="value" :value="value">{{ label }}</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="label">标题</label>
            <input v-model="createForm.title" type="text" class="input" placeholder="简要描述问题" />
          </div>
          
          <div class="form-group">
            <label class="label">详细描述</label>
            <textarea v-model="createForm.description" class="textarea" placeholder="请详细描述问题情况..."></textarea>
          </div>
          
          <div class="form-grid" v-if="createForm.type === 'locker_issue'">
            <div class="form-group">
              <label class="label">关联储物柜</label>
              <select v-model="createForm.related_locker_id" class="select">
                <option :value="null">不关联</option>
                <option v-for="l in lockers" :key="l.id" :value="l.id">{{ l.locker_no }} ({{ l.zone }}区, {{ lockerStatusLabel(l.status) }})</option>
              </select>
            </div>
            <div class="form-group" v-if="createForm.related_locker_id">
              <label class="label">分配操作人</label>
              <select v-model="createForm.related_assignment_id" class="select">
                <option :value="null">不指定</option>
                <option v-for="a in assignmentsForLocker" :key="a.id" :value="a.id">
                  {{ a.operator_name }} · {{ a.member_name || a.guest_name }} · {{ formatDateTime(a.assigned_at) }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="form-grid" v-if="createForm.type === 'course_leave'">
            <div class="form-group">
              <label class="label">关联课程</label>
              <select v-model="createForm.related_course_id" class="select">
                <option :value="null">不关联</option>
                <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }} ({{ formatTime(c.start_time) }})</option>
              </select>
            </div>
          </div>

          <div class="form-grid" v-if="createForm.type === 'billing_error'">
            <div class="form-group">
              <label class="label">关联储值记录</label>
              <select v-model="createForm.related_transaction_id" class="select">
                <option :value="null">不关联</option>
                <option v-for="t in transactions" :key="t.id" :value="t.id">
                  #{{ t.id }} {{ t.member_name }} {{ t.type === 'recharge' ? '充值' : t.type === 'consume' ? '消费' : '退款' }} ¥{{ Math.abs(t.amount) }} · {{ formatDateTime(t.created_at) }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-grid" v-if="createForm.type === 'water_quality'">
            <div class="form-group">
              <label class="label">关联巡场记录</label>
              <select v-model="createForm.related_patrol_id" class="select">
                <option :value="null">不关联</option>
                <option v-for="p in patrolPhotos" :key="p.id" :value="p.id">
                  #{{ p.id }} {{ p.location }} - {{ p.description?.slice(0, 30) }} · {{ formatDateTime(p.created_at) }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeCreateModal">取消</button>
          <button class="btn btn-primary" @click="handleCreate" :disabled="!canCreate">
            提交申诉
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dbApi from '@/db'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'
import { APPEAL_TYPE_LABELS, APPEAL_STATUS_LABELS, APPEAL_PRIORITY_LABELS, LOCKER_STATUS_LABELS } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const appeals = ref<any[]>([])
const lockers = ref<any[]>([])
const courses = ref<any[]>([])
const transactions = ref<any[]>([])
const patrolPhotos = ref<any[]>([])
const activeAssignments = ref<any[]>([])
const activeTab = ref('all')
const filterType = ref('')
const showCreateModal = ref(false)
const prefillInfo = ref<string | null>(null)

const createForm = ref({
  type: 'locker_issue' as any,
  priority: 'normal' as any,
  title: '',
  description: '',
  related_locker_id: null as number | null,
  related_course_id: null as number | null,
  related_transaction_id: null as number | null,
  related_patrol_id: null as number | null,
  related_assignment_id: null as number | null
})

const typeLabels = APPEAL_TYPE_LABELS
const statusLabels = APPEAL_STATUS_LABELS
const priorityLabels = APPEAL_PRIORITY_LABELS

const assignmentsForLocker = computed(() => {
  if (!createForm.value.related_locker_id) return []
  return activeAssignments.value.filter(a => a.locker_id === createForm.value.related_locker_id)
})

const statusTabs = computed(() => [
  { value: 'all', label: '全部', count: appeals.value.length },
  { value: 'pending', label: '待处理', count: appeals.value.filter(a => a.status === 'pending').length },
  { value: 'investigating', label: '处理中', count: appeals.value.filter(a => a.status === 'investigating').length },
  { value: 'resolved', label: '已解决', count: appeals.value.filter(a => a.status === 'resolved').length },
  { value: 'escalated', label: '已升级', count: appeals.value.filter(a => a.status === 'escalated').length }
])

const filteredAppeals = computed(() => {
  return appeals.value.filter(a => {
    if (activeTab.value !== 'all' && a.status !== activeTab.value) return false
    if (filterType.value && a.type !== filterType.value) return false
    return true
  })
})

const canCreate = computed(() => {
  return createForm.value.title.trim() && createForm.value.description.trim()
})

function lockerStatusLabel(status: string): string {
  return LOCKER_STATUS_LABELS[status as keyof typeof LOCKER_STATUS_LABELS] || status
}

function priorityClass(priority: string): string {
  const map: Record<string, string> = {
    urgent: 'badge-urgent',
    high: 'badge-error',
    normal: 'badge-warning',
    low: 'badge-muted'
  }
  return map[priority] || 'badge-muted'
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'badge-warning',
    investigating: 'badge-info',
    resolved: 'badge-success',
    rejected: 'badge-error',
    escalated: 'badge-urgent'
  }
  return map[status] || 'badge-muted'
}

function formatDateTime(ts: number): string {
  return dayjs(ts).format('MM-DD HH:mm')
}

function formatTime(ts: number): string {
  return dayjs(ts).format('MM-DD HH:mm')
}

function onTypeChange() {
  createForm.value.related_locker_id = null
  createForm.value.related_course_id = null
  createForm.value.related_transaction_id = null
  createForm.value.related_patrol_id = null
  createForm.value.related_assignment_id = null
}

function openCreateModal(prefill?: { lockerId?: number; assignmentId?: number; type?: string }) {
  resetCreateForm()
  prefillInfo.value = null
  
  if (prefill) {
    if (prefill.lockerId) {
      createForm.value.type = 'locker_issue'
      createForm.value.related_locker_id = prefill.lockerId
      const locker = lockers.value.find(l => l.id === prefill.lockerId)
      const assignment = activeAssignments.value.find(a => a.locker_id === prefill.lockerId)
      if (locker && assignment) {
        createForm.value.related_assignment_id = assignment.id
        prefillInfo.value = `已关联储物柜 ${locker.locker_no}，分配操作人：${assignment.operator_name}，分配时间：${formatDateTime(assignment.assigned_at)}`
        createForm.value.description = `储物柜 ${locker.locker_no}（${locker.zone}区）\n使用人：${assignment.member_name || assignment.guest_name || '未知'}\n分配操作人：${assignment.operator_name}\n分配时间：${dayjs(assignment.assigned_at).format('YYYY-MM-DD HH:mm')}\n\n问题描述：`
      } else if (locker) {
        prefillInfo.value = `已关联储物柜 ${locker.locker_no}（${locker.zone}区）`
      }
    }
    if (prefill.type) {
      createForm.value.type = prefill.type
    }
  }
  
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  prefillInfo.value = null
  resetCreateForm()
}

async function handleCreate() {
  if (!canCreate.value) return
  
  const data: any = {
    type: createForm.value.type,
    priority: createForm.value.priority,
    title: createForm.value.title,
    description: createForm.value.description,
    related_locker_id: createForm.value.related_locker_id,
    related_course_id: createForm.value.related_course_id,
    related_transaction_id: createForm.value.related_transaction_id,
    related_patrol_id: createForm.value.related_patrol_id,
    related_assignment_id: createForm.value.related_assignment_id
  }
  
  const newId = await dbApi.createAppeal(data, userStore.currentUser?.id)
  showCreateModal.value = false
  resetCreateForm()
  prefillInfo.value = null
  await loadAppeals()
  
  if (route.path === '/appeals/new') {
    router.replace(`/appeals/${newId}`)
  }
}

function resetCreateForm() {
  createForm.value = {
    type: 'locker_issue',
    priority: 'normal',
    title: '',
    description: '',
    related_locker_id: null,
    related_course_id: null,
    related_transaction_id: null,
    related_patrol_id: null,
    related_assignment_id: null
  }
}

async function loadAppeals() {
  appeals.value = await dbApi.getAppeals()
}

async function loadData() {
  await loadAppeals()
  lockers.value = await dbApi.getLockers()
  courses.value = await dbApi.getCourses(dayjs().subtract(7, 'day').valueOf(), dayjs().add(7, 'day').valueOf())
  transactions.value = await dbApi.getTransactions()
  patrolPhotos.value = await dbApi.getPatrolPhotos()
  activeAssignments.value = await dbApi.getActiveLockerAssignments()
}

onMounted(async () => {
  await loadData()
  
  if (route.path === '/appeals/new') {
    const lockerId = route.query.locker_id ? Number(route.query.locker_id) : undefined
    const type = route.query.type as string | undefined
    if (lockerId || type) {
      openCreateModal({ lockerId, type })
    } else {
      openCreateModal()
    }
  }
})

watch(() => route.path, (newPath) => {
  if (newPath === '/appeals/new' && !showCreateModal.value) {
    openCreateModal()
  }
})

defineExpose({ openCreateModal })
</script>

<style scoped>
.appeals-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: rgba(15, 23, 42, 0.6);
  padding: 4px;
  border-radius: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  color: #64748b;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: #e2e8f0;
}

.tab-btn.active {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  font-weight: 500;
}

.tab-count {
  padding: 1px 6px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  font-size: 10px;
}

.tab-btn.active .tab-count {
  background: rgba(59, 130, 246, 0.25);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.appeals-list {
  padding: 0;
}

.appeal-row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.appeal-no {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  color: #60a5fa;
}

.appeal-title-cell {
  color: #e2e8f0;
  font-weight: 500;
}

.text-muted {
  color: #64748b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.prefill-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 8px;
  font-size: 12px;
  color: #93c5fd;
  margin-bottom: 16px;
}

.prefill-icon {
  font-size: 14px;
}
</style>
