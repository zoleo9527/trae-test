<template>
  <div class="task-detail">
    <div class="flex-between mb-20">
      <div class="flex-center gap-16">
        <button class="btn btn-default" @click="goBack">← 返回</button>
        <h1 class="page-title" style="margin: 0">{{ task?.plotName }} - {{ task?.type }}</h1>
        <span :class="['status-tag', `status-${task?.status}`]">
          {{ getStatusText(task?.status) }}
        </span>
      </div>
    </div>
    
    <div class="detail-grid">
      <div class="card">
        <h2 class="section-title">任务信息</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">地块</span>
            <span class="info-value">{{ task?.plotName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">作业类型</span>
            <span class="info-value">{{ task?.type }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">机手</span>
            <span class="info-value">{{ task?.operatorName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">计划日期</span>
            <span class="info-value">{{ task?.planDate }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">实际完成</span>
            <span class="info-value">{{ task?.actualDate || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ task?.createTime }}</span>
          </div>
        </div>
        
        <div class="progress-section">
          <div class="flex-between mb-8">
            <span class="info-label">作业进度</span>
            <span class="progress-text">{{ task?.progress }}%</span>
          </div>
          <div class="progress-bar-large">
            <div class="progress-fill" :style="{ width: (task?.progress || 0) + '%' }"></div>
          </div>
        </div>
        
        <div class="info-item mt-16">
          <span class="info-label">备注</span>
          <div class="remark-box">{{ task?.remark || '暂无备注' }}</div>
        </div>
      </div>
      
      <div class="card">
        <h2 class="section-title">油料消耗</h2>
        <div class="fuel-summary">
          <div class="fuel-stat">
            <span class="fuel-value">{{ task?.fuelUsed || 0 }}L</span>
            <span class="fuel-label">已消耗</span>
          </div>
        </div>
        <div class="fuel-records">
          <div v-for="record in taskFuelRecords" :key="record.id" class="fuel-item">
            <div class="fuel-info">
              <span class="fuel-amount">{{ record.amount }}L {{ record.fuelType }}</span>
              <span class="fuel-price">¥{{ record.totalPrice }}</span>
            </div>
            <div class="fuel-meta">
              <span>{{ record.fillDate }}</span>
              <span>单价: ¥{{ record.unitPrice }}/L</span>
            </div>
          </div>
          <div v-if="taskFuelRecords.length === 0" class="empty-state">
            暂无加油记录
          </div>
        </div>
      </div>
      
      <div class="card" v-if="canEdit">
        <h2 class="section-title">更新进度</h2>
        <div class="form-item">
          <label class="form-label">任务状态</label>
          <select v-model="editForm.status" class="form-select">
            <option value="pending">待执行</option>
            <option value="progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="delayed">已延误</option>
          </select>
        </div>
        <div class="form-item">
          <label class="form-label">作业进度 ({{ editForm.progress }}%)</label>
          <input 
            v-model.number="editForm.progress" 
            type="range" 
            min="0" 
            max="100" 
            class="progress-slider"
          />
        </div>
        <div class="form-item">
          <label class="form-label">油料消耗 (L)</label>
          <input 
            v-model.number="editForm.fuelUsed" 
            type="number" 
            class="form-input"
            min="0"
          />
        </div>
        <div class="form-item">
          <label class="form-label">添加备注</label>
          <textarea v-model="editForm.remark" class="form-textarea" placeholder="请输入备注信息"></textarea>
        </div>
        <button class="btn btn-primary" @click="handleUpdate">保存更新</button>
      </div>
      
      <div class="card">
        <h2 class="section-title">操作历史</h2>
        <div class="history-list">
          <div v-for="log in taskHistory" :key="log.id" class="history-item">
            <div class="history-icon">{{ getHistoryIcon(log.action) }}</div>
            <div class="history-content">
              <div class="history-text">{{ log.content }}</div>
              <div class="history-meta">
                <span>{{ log.operatorName }}</span>
                <span>{{ log.createTime }}</span>
              </div>
            </div>
          </div>
          <div v-if="taskHistory.length === 0" class="empty-state">
            暂无操作记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useTaskStore } from '../stores/task'
import { useFuelStore } from '../stores/fuel'
import { useHistoryStore } from '../stores/history'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const taskStore = useTaskStore()
const fuelStore = useFuelStore()
const historyStore = useHistoryStore()
const toastStore = useToastStore()

const taskId = route.params.id

const currentUser = computed(() => userStore.currentUser)
const task = computed(() => taskStore.tasks.find(t => t.id === taskId))
const taskFuelRecords = computed(() => fuelStore.records.filter(r => r.taskId === taskId))
const taskHistory = computed(() => historyStore.logs.filter(l => l.targetId === taskId))

const canEdit = computed(() => {
  if (!currentUser.value || !task.value) return false
  return currentUser.value.role !== 'director' || 
         currentUser.value.id === task.value.operatorId
})

const editForm = ref({
  status: 'pending',
  progress: 0,
  fuelUsed: 0,
  remark: ''
})

function getStatusText(status) {
  const map = { pending: '待执行', progress: '进行中', completed: '已完成', delayed: '已延误' }
  return map[status] || status
}

function getHistoryIcon(action) {
  const icons = { create: '➕', status_change: '🔄', remark: '📝', approve: '✅', reject: '❌' }
  return icons[action] || '📌'
}

function goBack() {
  router.back()
}

async function handleUpdate() {
  const updates = {}
  if (editForm.value.status !== task.value.status) {
    updates.status = editForm.value.status
    if (editForm.value.status === 'completed') {
      updates.actualDate = new Date().toISOString().split('T')[0]
    }
  }
  if (editForm.value.progress !== task.value.progress) {
    updates.progress = editForm.value.progress
  }
  if (editForm.value.fuelUsed !== task.value.fuelUsed) {
    updates.fuelUsed = editForm.value.fuelUsed
  }
  if (editForm.value.remark && editForm.value.remark !== task.value.remark) {
    updates.remark = editForm.value.remark
  }
  
  await taskStore.updateTask(taskId, updates, currentUser.value)
  toastStore.success('更新成功')
  editForm.value.remark = ''
}

onMounted(async () => {
  await taskStore.loadTasks()
  await fuelStore.loadRecords()
  await historyStore.loadLogs()
  
  if (task.value) {
    editForm.value = {
      status: task.value.status,
      progress: task.value.progress,
      fuelUsed: task.value.fuelUsed,
      remark: ''
    }
  }
})
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.progress-section {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.progress-bar-large {
  height: 12px;
  background: #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  transition: width 0.3s;
}

.progress-text {
  font-size: 14px;
  font-weight: 500;
  color: #1890ff;
}

.remark-box {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.mt-16 {
  margin-top: 16px;
}

.fuel-summary {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 16px;
}

.fuel-stat {
  text-align: center;
  color: #fff;
}

.fuel-value {
  display: block;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 4px;
}

.fuel-label {
  font-size: 14px;
  opacity: 0.9;
}

.fuel-records {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fuel-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.fuel-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.fuel-amount {
  font-weight: 500;
  color: #333;
}

.fuel-price {
  color: #52c41a;
  font-weight: 500;
}

.fuel-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.progress-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  background: #e8e8e8;
  border-radius: 3px;
  outline: none;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #1890ff;
  border-radius: 50%;
  cursor: pointer;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.history-icon {
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e6f7ff;
  border-radius: 50%;
  flex-shrink: 0;
}

.history-content {
  flex: 1;
}

.history-text {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
}

.history-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 13px;
}
</style>
