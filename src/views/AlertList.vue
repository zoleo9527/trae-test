<template>
  <div class="alert-list">
    <div class="flex-between mb-20">
      <h1 class="page-title">提醒预警</h1>
      <button class="btn btn-default" @click="handleMarkAllRead" v-if="unreadCount > 0">
        全部已读
      </button>
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
          <div class="stat-value">{{ subsidyCount }}</div>
          <div class="stat-label">材料不齐</div>
        </div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon">🔵</div>
        <div>
          <div class="stat-value">{{ reviewCount }}</div>
          <div class="stat-label">待处理评价</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="alerts-container">
        <div 
          v-for="alert in userAlerts" 
          :key="alert.id" 
          class="alert-item"
          :class="{ unread: alert.status === 'unread' }"
          @click="handleAlertClick(alert)"
        >
          <div class="alert-icon">{{ getAlertIcon(alert.type) }}</div>
          <div class="alert-content">
            <div class="alert-title">
              {{ alert.title }}
              <span v-if="alert.status === 'unread'" class="new-badge">新</span>
            </div>
            <div class="alert-desc">{{ alert.content }}</div>
            <div class="alert-time">{{ alert.createTime }}</div>
          </div>
          <div class="alert-arrow">›</div>
        </div>
        
        <div v-if="userAlerts.length === 0" class="empty-state">
          暂无提醒
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAlertStore } from '../stores/alert'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const userStore = useUserStore()
const alertStore = useAlertStore()
const toastStore = useToastStore()

const currentUser = computed(() => userStore.currentUser)
const userAlerts = computed(() => alertStore.alerts.filter(a => a.assignee === currentUser.value?.id))
const unreadCount = computed(() => userAlerts.value.filter(a => a.status === 'unread').length)
const delayCount = computed(() => userAlerts.value.filter(a => a.type === 'delay').length)
const subsidyCount = computed(() => userAlerts.value.filter(a => a.type === 'subsidy').length)
const reviewCount = computed(() => userAlerts.value.filter(a => a.type === 'review').length)

function getAlertIcon(type) {
  const icons = { delay: '⏰', subsidy: '📋', review: '💬', maintenance: '🔧' }
  return icons[type] || '📢'
}

async function handleAlertClick(alert) {
  await alertStore.markAsRead(alert.id)
  
  if (alert.relatedType === 'task') {
    router.push(`/tasks/${alert.relatedId}`)
  } else if (alert.relatedType === 'subsidy') {
    router.push('/subsidy')
  } else if (alert.relatedType === 'review') {
    router.push('/reviews')
  }
}

async function handleMarkAllRead() {
  await alertStore.markAllAsRead(currentUser.value.id)
  toastStore.success('已全部标记为已读')
}

onMounted(async () => {
  await alertStore.loadAlerts()
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.stat-card.danger .stat-value,
.stat-card.danger .stat-label,
.stat-card.warning .stat-value,
.stat-card.warning .stat-label,
.stat-card.info .stat-value,
.stat-card.info .stat-label {
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
  cursor: pointer;
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

.alert-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.alert-time {
  font-size: 11px;
  color: #999;
}

.alert-arrow {
  font-size: 20px;
  color: #ccc;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
