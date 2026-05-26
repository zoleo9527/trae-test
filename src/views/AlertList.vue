<template>
  <div class="alert-list">
    <div class="flex-between mb-20">
      <h1 class="page-title">提醒预警</h1>
      <div class="flex gap-12">
        <select v-model="filterStatus" class="form-select" style="width: 120px">
          <option value="">全部状态</option>
          <option value="unread">未读</option>
          <option value="read">已读</option>
          <option value="handled">已处理</option>
        </select>
        <button class="btn btn-default" @click="handleMarkAllRead" v-if="unreadCount > 0">
          全部已读
        </button>
      </div>
    </div>
    
    <div class="stats-row">
      <div class="stat-card danger">
        <div class="stat-icon">🔴</div>
        <div>
          <div class="stat-value">{{ delayCount }}</div>
          <div class="stat-label">进度延误</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">🟡</div>
        <div>
          <div class="stat-value">{{ materialCount }}</div>
          <div class="stat-label">材料不齐</div>
        </div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon">🔵</div>
        <div>
          <div class="stat-value">{{ badReviewCount }}</div>
          <div class="stat-label">差评回访</div>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">🟢</div>
        <div>
          <div class="stat-value">{{ maintenanceCount }}</div>
          <div class="stat-label">维修提醒</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="alerts-container">
        <div 
          v-for="alert in filteredAlerts" 
          :key="alert.id" 
          class="alert-item"
          :class="[`alert-${alert.type}`, { unread: alert.status === 'unread', handled: alert.status === 'handled' }]"
        >
          <div class="alert-icon">{{ getAlertIcon(alert.type) }}</div>
          <div class="alert-content">
            <div class="alert-title">
              {{ alert.title }}
              <span v-if="alert.status === 'unread'" class="new-badge">新</span>
              <span v-if="alert.status === 'handled'" class="handled-badge">已处理</span>
            </div>
            <div class="alert-desc">{{ alert.content }}</div>
            <div class="alert-meta">
              <span>{{ alert.createTime }}</span>
              <span v-if="alert.handledByName" class="handled-info">
                · {{ alert.handledByName }}处理于 {{ alert.handledTime }}
                <span v-if="alert.handleRemark">（{{ alert.handleRemark }}）</span>
              </span>
            </div>
          </div>
          <div class="alert-actions">
            <button v-if="alert.status === 'unread'" class="btn btn-sm btn-default" @click.stop="handleMarkAsRead(alert)">
              已读
            </button>
            <button v-if="alert.status !== 'handled'" class="btn btn-sm btn-primary" @click.stop="showHandleModal(alert)">
              处理
            </button>
            <button class="btn btn-sm btn-link" @click="handleAlertClick(alert)">
              查看 ›
            </button>
          </div>
        </div>
        
        <div v-if="filteredAlerts.length === 0" class="empty-state">
          暂无提醒
        </div>
      </div>
    </div>
    
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>处理提醒</h3>
          <button class="close-btn" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="alert-preview">
            <div class="alert-type">{{ currentAlert?.title }}</div>
            <div class="alert-content-text">{{ currentAlert?.content }}</div>
          </div>
          <div class="form-item">
            <label class="form-label">处理备注</label>
            <textarea v-model="handleRemark" class="form-textarea" placeholder="请输入处理说明（可选）"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmHandle">确认处理</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAlertStore } from '../stores/alert'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const userStore = useUserStore()
const alertStore = useAlertStore()
const toastStore = useToastStore()

const currentUser = computed(() => userStore.currentUser)
const filterStatus = ref('')
const showModal = ref(false)
const currentAlert = ref(null)
const handleRemark = ref('')

const userAlerts = computed(() => {
  if (!currentUser.value) return []
  if (currentUser.value.role === 'director') {
    return alertStore.alerts
  }
  return alertStore.alerts.filter(a => a.assignee === currentUser.value.id)
})

const filteredAlerts = computed(() => {
  if (!filterStatus.value) return userAlerts.value
  return userAlerts.value.filter(a => a.status === filterStatus.value)
})

const unreadCount = computed(() => userAlerts.value.filter(a => a.status === 'unread').length)
const delayCount = computed(() => userAlerts.value.filter(a => a.type === 'delay').length)
const materialCount = computed(() => userAlerts.value.filter(a => a.type === 'material').length)
const badReviewCount = computed(() => userAlerts.value.filter(a => a.type === 'bad_review').length)
const maintenanceCount = computed(() => userAlerts.value.filter(a => a.type === 'maintenance').length)

function getAlertIcon(type) {
  const icons = { 
    delay: '⏰', 
    material: '📋', 
    bad_review: '💬', 
    maintenance: '🔧' 
  }
  return icons[type] || '📢'
}

async function handleMarkAsRead(alert) {
  await alertStore.markAsRead(alert.id, currentUser.value)
  toastStore.success('已标记为已读')
}

function showHandleModal(alert) {
  currentAlert.value = alert
  handleRemark.value = ''
  showModal.value = true
}

async function confirmHandle() {
  if (currentAlert.value) {
    await alertStore.markAsHandled(currentAlert.value.id, currentUser.value, handleRemark.value)
    toastStore.success('提醒已处理')
    showModal.value = false
  }
}

async function handleAlertClick(alert) {
  if (alert.status === 'unread') {
    await alertStore.markAsRead(alert.id, currentUser.value)
  }
  
  if (alert.relatedType === 'task') {
    router.push(`/tasks/${alert.relatedId}`)
  } else if (alert.relatedType === 'subsidy') {
    router.push('/subsidy')
  } else if (alert.relatedType === 'review') {
    router.push('/reviews')
  } else if (alert.relatedType === 'plot') {
    router.push(`/plots/${alert.relatedId}`)
  }
}

async function handleMarkAllRead() {
  await alertStore.markAllAsRead(currentUser.value.id, currentUser.value)
  toastStore.success('已全部标记为已读')
}

onMounted(async () => {
  await alertStore.loadAlerts()
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card.danger {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: #fff;
}

.stat-card.warning {
  background: linear-gradient(135deg, #faad14, #ffc53d);
  color: #fff;
}

.stat-card.info {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: #fff;
}

.stat-card.success {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #fff;
}

.stat-card.danger .stat-value,
.stat-card.danger .stat-label,
.stat-card.warning .stat-value,
.stat-card.warning .stat-label,
.stat-card.info .stat-value,
.stat-card.info .stat-label,
.stat-card.success .stat-value,
.stat-card.success .stat-label {
  color: #fff;
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.alerts-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.alert-item:hover {
  background: #f0f7ff;
}

.alert-item.unread {
  background: #e6f7ff;
  border-left-color: #1890ff;
}

.alert-item.handled {
  opacity: 0.7;
}

.alert-item.alert-delay {
  border-left-color: #ff4d4f;
}

.alert-item.alert-material {
  border-left-color: #faad14;
}

.alert-item.alert-bad_review {
  border-left-color: #722ed1;
}

.alert-item.alert-maintenance {
  border-left-color: #52c41a;
}

.alert-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.new-badge {
  padding: 1px 6px;
  background: #ff4d4f;
  color: #fff;
  border-radius: 10px;
  font-size: 10px;
}

.handled-badge {
  padding: 1px 6px;
  background: #52c41a;
  color: #fff;
  border-radius: 10px;
  font-size: 10px;
}

.alert-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.alert-meta {
  font-size: 11px;
  color: #999;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.handled-info {
  color: #52c41a;
}

.alert-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.btn-link {
  background: none;
  color: #1890ff;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}

.flex {
  display: flex;
}

.gap-12 {
  gap: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 480px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.alert-preview {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.alert-type {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.alert-content-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}
</style>
