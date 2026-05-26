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
        <button class="btn btn-primary" @click="showCreateModal = true">
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
    
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal" style="width: 560px;">
        <div class="modal-header">
          <div class="modal-title">新建申诉</div>
          <button class="btn-ghost" @click="showCreateModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="label">申诉类型</label>
              <select v-model="createForm.type" class="select">
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
                <option v-for="l in lockers" :key="l.id" :value="l.id">{{ l.locker_no }} ({{ l.zone }}区)</option>
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
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateModal = false">取消</button>
          <button class="btn btn-primary" @click="handleCreate" :disabled="!canCreate">
            提交申诉
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dbApi from '@/db'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'
import { APPEAL_TYPE_LABELS, APPEAL_STATUS_LABELS, APPEAL_PRIORITY_LABELS } from '@/types'

const userStore = useUserStore()

const appeals = ref<any[]>([])
const lockers = ref<any[]>([])
const courses = ref<any[]>([])
const activeTab = ref('all')
const filterType = ref('')
const showCreateModal = ref(false)

const createForm = ref({
  type: 'locker_issue' as any,
  priority: 'normal' as any,
  title: '',
  description: '',
  related_locker_id: null as number | null,
  related_course_id: null as number | null
})

const typeLabels = APPEAL_TYPE_LABELS
const statusLabels = APPEAL_STATUS_LABELS
const priorityLabels = APPEAL_PRIORITY_LABELS

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

async function handleCreate() {
  if (!canCreate.value) return
  
  await dbApi.createAppeal(createForm.value, userStore.currentUser?.id)
  showCreateModal.value = false
  resetCreateForm()
  await loadAppeals()
}

function resetCreateForm() {
  createForm.value = {
    type: 'locker_issue',
    priority: 'normal',
    title: '',
    description: '',
    related_locker_id: null,
    related_course_id: null
  }
}

async function loadAppeals() {
  appeals.value = await dbApi.getAppeals()
}

async function loadData() {
  await loadAppeals()
  lockers.value = await dbApi.getLockers()
  courses.value = await dbApi.getCourses(dayjs().subtract(7, 'day').valueOf(), dayjs().add(7, 'day').valueOf())
}

onMounted(loadData)
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
</style>
