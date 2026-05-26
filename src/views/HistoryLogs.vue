<template>
  <div class="history-logs">
    <div class="flex-between mb-20">
      <h1 class="page-title">历史记录</h1>
      <div class="filter-bar">
        <select v-model="filterType" class="form-select" style="width: 120px">
          <option value="">全部类型</option>
          <option value="task">作业任务</option>
          <option value="subsidy">补贴申请</option>
          <option value="review">回访评价</option>
          <option value="alert">系统提醒</option>
        </select>
      </div>
    </div>
    
    <div class="card">
      <div class="timeline">
        <div v-for="log in filteredLogs" :key="log.id" class="timeline-item">
          <div class="timeline-dot" :class="`dot-${log.type}`">
            {{ getLogIcon(log.action) }}
          </div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="log-target">{{ log.targetName }}</span>
              <span class="log-type-tag">{{ getTypeText(log.type) }}</span>
            </div>
            <div class="log-content">{{ log.content }}</div>
            <div class="log-meta">
              <span class="log-operator">{{ log.operatorName }}</span>
              <span class="log-time">{{ log.createTime }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="filteredLogs.length === 0" class="empty-state">
          暂无历史记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHistoryStore } from '../stores/history'

const historyStore = useHistoryStore()

const filterType = ref('')

const filteredLogs = computed(() => {
  let logs = [...historyStore.logs]
  if (filterType.value) {
    logs = logs.filter(l => l.type === filterType.value)
  }
  return logs
})

function getTypeText(type) {
  const map = { task: '作业', subsidy: '补贴', review: '评价', alert: '提醒' }
  return map[type] || type
}

function getLogIcon(action) {
  const icons = { create: '➕', status_change: '🔄', remark: '📝', approve: '✅', reject: '❌' }
  return icons[action] || '📌'
}

onMounted(async () => {
  await historyStore.loadLogs()
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
}

.timeline {
  position: relative;
  padding-left: 40px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e8e8e8;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-dot {
  position: absolute;
  left: -40px;
  top: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: #fff;
  border: 2px solid #e8e8e8;
}

.dot-task {
  border-color: #1890ff;
  background: #e6f7ff;
}

.dot-subsidy {
  border-color: #52c41a;
  background: #f6ffed;
}

.dot-review {
  border-color: #faad14;
  background: #fff7e6;
}

.dot-alert {
  border-color: #ff4d4f;
  background: #fff1f0;
}

.timeline-content {
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-target {
  font-weight: 500;
  color: #333;
}

.log-type-tag {
  padding: 2px 8px;
  background: #e8e8e8;
  border-radius: 4px;
  font-size: 11px;
  color: #666;
}

.log-content {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.log-meta {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
