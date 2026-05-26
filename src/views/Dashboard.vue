<template>
  <div class="dashboard">
    <h1 class="page-title">工作台</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🌱</div>
        <div class="stat-content">
          <div class="stat-value">{{ plotStats.total }}</div>
          <div class="stat-label">地块总数</div>
        </div>
        <div class="stat-footer">
          <span class="text-success">已完成 {{ plotStats.completed }}</span>
          <span class="text-warning">进行中 {{ plotStats.progress }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-value">{{ taskStats.total }}</div>
          <div class="stat-label">作业任务</div>
        </div>
        <div class="stat-footer">
          <span class="text-success">已完成 {{ taskStats.completed }}</span>
          <span class="text-danger">延误 {{ taskStats.delayed }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⛽</div>
        <div class="stat-content">
          <div class="stat-value">{{ fuelStats.totalAmount }}L</div>
          <div class="stat-label">油料消耗</div>
        </div>
        <div class="stat-footer">
          <span>共计 {{ fuelStats.totalPrice }} 元</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">{{ subsidyStats.approvedAmount }}</div>
          <div class="stat-label">已批补贴(元)</div>
        </div>
        <div class="stat-footer">
          <span class="text-warning">待审核 {{ subsidyStats.pending }}</span>
        </div>
      </div>
    </div>
    
    <div class="dashboard-content">
      <div class="dashboard-left">
        <div class="card">
          <div class="flex-between mb-16">
            <h2 class="section-title">作业进度概览</h2>
            <router-link to="/tasks" class="btn btn-default btn-sm">查看全部</router-link>
          </div>
          <div class="task-list">
            <div 
              v-for="task in recentTasks" 
              :key="task.id" 
              class="task-item"
              @click="goToTask(task.id)"
            >
              <div class="task-info">
                <div class="task-name">{{ task.plotName }} - {{ task.type }}</div>
                <div class="task-meta">
                  <span>机手：{{ task.operatorName }}</span>
                  <span>计划：{{ task.planDate }}</span>
                </div>
              </div>
              <div class="task-right">
                <span :class="['status-tag', `status-${task.status}`]">
                  {{ getStatusText(task.status) }}
                </span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
                </div>
                <span class="progress-text">{{ task.progress }}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card" v-if="currentUser.role !== 'operator'">
          <div class="flex-between mb-16">
            <h2 class="section-title">待处理预警</h2>
            <router-link to="/alerts" class="btn btn-default btn-sm">查看全部</router-link>
          </div>
          <div class="alert-list">
            <div 
              v-for="alert in pendingAlerts" 
              :key="alert.id" 
              class="alert-item"
              :class="`alert-${alert.type}`"
              @click="handleAlert(alert)"
            >
              <div class="alert-icon">{{ getAlertIcon(alert.type) }}</div>
              <div class="alert-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-desc">{{ alert.content }}</div>
                <div class="alert-time">{{ alert.createTime }}</div>
              </div>
              <span v-if="alert.status === 'unread'" class="badge">新</span>
            </div>
            <div v-if="pendingAlerts.length === 0" class="empty-state">
              暂无待处理预警
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-right">
        <div class="card">
          <h2 class="section-title">地块状态分布</h2>
          <div class="plot-status-chart">
            <div class="chart-item">
              <div class="chart-bar">
                <div class="chart-fill completed" :style="{ height: getChartHeight(plotStats.completed) }"></div>
              </div>
              <div class="chart-label">已完成</div>
              <div class="chart-value">{{ plotStats.completed }}</div>
            </div>
            <div class="chart-item">
              <div class="chart-bar">
                <div class="chart-fill progress" :style="{ height: getChartHeight(plotStats.progress) }"></div>
              </div>
              <div class="chart-label">进行中</div>
              <div class="chart-value">{{ plotStats.progress }}</div>
            </div>
            <div class="chart-item">
              <div class="chart-bar">
                <div class="chart-fill pending" :style="{ height: getChartHeight(plotStats.pending) }"></div>
              </div>
              <div class="chart-label">待执行</div>
              <div class="chart-value">{{ plotStats.pending }}</div>
            </div>
            <div class="chart-item">
              <div class="chart-bar">
                <div class="chart-fill delayed" :style="{ height: getChartHeight(plotStats.delayed) }"></div>
              </div>
              <div class="chart-label">已延误</div>
              <div class="chart-value">{{ plotStats.delayed }}</div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <h2 class="section-title">近期回访评价</h2>
          <div class="review-list">
            <div v-for="review in recentReviews" :key="review.id" class="review-item">
              <div class="review-header">
                <span class="reviewer">{{ review.reviewer }}</span>
                <div class="rating">
                  <span v-for="i in 5" :key="i" :class="['star', i <= review.rating ? 'active' : '']">★</span>
                </div>
              </div>
              <div class="review-content">{{ review.content }}</div>
              <div class="review-footer">
                <span>{{ review.reviewDate }}</span>
                <span v-if="review.reply" class="text-success">已回复</span>
              </div>
            </div>
            <div v-if="recentReviews.length === 0" class="empty-state">
              暂无评价
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePlotStore } from '../stores/plot'
import { useTaskStore } from '../stores/task'
import { useFuelStore } from '../stores/fuel'
import { useSubsidyStore } from '../stores/subsidy'
import { useAlertStore } from '../stores/alert'
import { useReviewStore } from '../stores/review'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const userStore = useUserStore()
const plotStore = usePlotStore()
const taskStore = useTaskStore()
const fuelStore = useFuelStore()
const subsidyStore = useSubsidyStore()
const alertStore = useAlertStore()
const reviewStore = useReviewStore()
const toastStore = useToastStore()

const currentUser = computed(() => userStore.currentUser)
const plotStats = computed(() => plotStore.stats)
const taskStats = computed(() => taskStore.stats)
const fuelStats = computed(() => fuelStore.stats)
const subsidyStats = computed(() => subsidyStore.stats)

const recentTasks = computed(() => {
  let tasks = [...taskStore.tasks]
  if (currentUser.value.role === 'operator') {
    tasks = tasks.filter(t => t.operatorId === currentUser.value.id)
  }
  return tasks.slice(0, 5)
})

const pendingAlerts = computed(() => {
  return alertStore.alerts
    .filter(a => a.assignee === currentUser.value.id)
    .slice(0, 3)
})

const recentReviews = computed(() => {
  return [...reviewStore.reviews].slice(0, 3)
})

function getStatusText(status) {
  const map = { pending: '待执行', progress: '进行中', completed: '已完成', delayed: '已延误' }
  return map[status] || status
}

function getAlertIcon(type) {
  const icons = { delay: '⏰', material: '📋', bad_review: '💬', maintenance: '🔧' }
  return icons[type] || '📢'
}

function getChartHeight(value) {
  const max = Math.max(plotStats.value.total, 1)
  return (value / max * 100) + '%'
}

function goToTask(id) {
  router.push(`/tasks/${id}`)
}

async function handleAlert(alert) {
  await alertStore.markAsRead(alert.id, currentUser.value)
  toastStore.info('已标记为已读')
}

onMounted(async () => {
  await plotStore.loadPlots()
  await taskStore.loadTasks()
  await fuelStore.loadRecords()
  await subsidyStore.loadRecords()
  await alertStore.loadAlerts()
  await reviewStore.loadReviews()
})
</script>

<style scoped>
.stats-grid {
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
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.stat-content {
  margin-bottom: 12px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.stat-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  background: #f0f7ff;
}

.task-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.task-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 16px;
}

.task-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 120px;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background: #e8e8e8;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.alert-delay {
  background: #fff7e6;
  border-left: 3px solid #faad14;
}

.alert-material {
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.alert-bad_review {
  background: #fff1f0;
  border-left: 3px solid #ff4d4f;
}

.alert-maintenance {
  background: #f6ffed;
  border-left: 3px solid #52c41a;
}

.alert-icon {
  font-size: 20px;
}

.alert-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.alert-time {
  font-size: 11px;
  color: #999;
}

.plot-status-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 160px;
  padding-top: 20px;
}

.chart-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.chart-bar {
  width: 40px;
  height: 100px;
  background: #f0f0f0;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.chart-fill {
  width: 100%;
  transition: height 0.3s;
}

.chart-fill.completed {
  background: #52c41a;
}

.chart-fill.progress {
  background: #1890ff;
}

.chart-fill.pending {
  background: #faad14;
}

.chart-fill.delayed {
  background: #ff4d4f;
}

.chart-label {
  font-size: 12px;
  color: #666;
}

.chart-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reviewer {
  font-weight: 500;
  color: #333;
}

.star {
  color: #e8e8e8;
  font-size: 14px;
}

.star.active {
  color: #faad14;
}

.review-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}
</style>
