<template>
  <div class="patrol-page">
    <div class="page-header">
      <div class="filter-bar">
        <select v-model="filterStatus" class="select" style="width: 140px;">
          <option value="">全部状态</option>
          <option value="reported">已上报</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
          <option value="ignored">已忽略</option>
        </select>
        <select v-model="filterIssueType" class="select" style="width: 140px;">
          <option value="">全部类型</option>
          <option value="water_quality">水质问题</option>
          <option value="equipment">设备故障</option>
          <option value="cleanliness">卫生问题</option>
          <option value="safety">安全隐患</option>
          <option value="other">其他</option>
        </select>
      </div>
    </div>
    
    <div class="stats-row">
      <div class="stat-item card">
        <div class="stat-icon red">⚠️</div>
        <div>
          <div class="stat-value">{{ stats.reported }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      <div class="stat-item card">
        <div class="stat-icon blue">🔧</div>
        <div>
          <div class="stat-value">{{ stats.processing }}</div>
          <div class="stat-label">处理中</div>
        </div>
      </div>
      <div class="stat-item card">
        <div class="stat-icon green">✅</div>
        <div>
          <div class="stat-value">{{ stats.resolved }}</div>
          <div class="stat-label">已解决</div>
        </div>
      </div>
    </div>
    
    <div class="photos-grid">
      <div
        v-for="photo in filteredPhotos"
        :key="photo.id"
        class="photo-card card"
        :class="photo.status"
      >
        <div class="photo-preview">
          <div class="photo-placeholder">
            <span class="photo-icon">📷</span>
            <span class="photo-location">{{ photo.location }}</span>
          </div>
          <span class="status-badge" :class="photo.status">
            {{ statusLabels[photo.status] }}
          </span>
        </div>
        <div class="photo-info">
          <div class="photo-header">
            <span class="issue-type">{{ issueTypeLabels[photo.issue_type as keyof typeof issueTypeLabels] || '其他' }}</span>
            <span class="photo-time">{{ formatDateTime(photo.created_at) }}</span>
          </div>
          <div class="photo-desc">{{ photo.description || '暂无描述' }}</div>
          <div class="photo-footer">
            <span class="reporter">{{ photo.reporter_name || '匿名' }}</span>
            <div class="actions">
              <button
                v-if="photo.status === 'reported'"
                class="btn btn-sm btn-secondary"
                @click="updateStatus(photo.id, 'processing')"
              >
                开始处理
              </button>
              <button
                v-if="photo.status === 'processing'"
                class="btn btn-sm btn-primary"
                @click="updateStatus(photo.id, 'resolved')"
              >
                标记解决
              </button>
              <button
                v-if="photo.status !== 'resolved'"
                class="btn btn-sm btn-ghost"
                @click="updateStatus(photo.id, 'ignored')"
              >
                忽略
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="!filteredPhotos.length" class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">📷</div>
        <div class="empty-text">暂无巡场记录</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dbApi from '@/db'

const photos = ref<any[]>([])
const filterStatus = ref('')
const filterIssueType = ref('')

const statusLabels: Record<string, string> = {
  reported: '已上报',
  processing: '处理中',
  resolved: '已解决',
  ignored: '已忽略'
}

const issueTypeLabels: Record<string, string> = {
  water_quality: '水质问题',
  equipment: '设备故障',
  cleanliness: '卫生问题',
  safety: '安全隐患',
  other: '其他'
}

const stats = computed(() => ({
  reported: photos.value.filter(p => p.status === 'reported').length,
  processing: photos.value.filter(p => p.status === 'processing').length,
  resolved: photos.value.filter(p => p.status === 'resolved').length
}))

const filteredPhotos = computed(() => {
  return photos.value.filter(p => {
    if (filterStatus.value && p.status !== filterStatus.value) return false
    if (filterIssueType.value && p.issue_type !== filterIssueType.value) return false
    return true
  })
})

function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function updateStatus(id: number, status: string) {
  await window.db.run('UPDATE patrol_photos SET status = ? WHERE id = ?', [status, id])
  await loadPhotos()
}

async function loadPhotos() {
  photos.value = await dbApi.getPatrolPhotos()
}

onMounted(loadPhotos)
</script>

<style scoped>
.patrol-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-icon.red { background: rgba(239, 68, 68, 0.15); }
.stat-icon.blue { background: rgba(59, 130, 246, 0.15); }
.stat-icon.green { background: rgba(34, 197, 94, 0.15); }

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.photo-card {
  padding: 0;
  overflow: hidden;
  transition: all 0.2s ease;
}

.photo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.photo-preview {
  position: relative;
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #64748b;
}

.photo-icon {
  font-size: 40px;
  opacity: 0.5;
}

.photo-location {
  font-size: 13px;
  color: #94a3b8;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.reported {
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
}

.status-badge.processing {
  background: rgba(59, 130, 246, 0.9);
  color: #fff;
}

.status-badge.resolved {
  background: rgba(34, 197, 94, 0.9);
  color: #fff;
}

.status-badge.ignored {
  background: rgba(100, 116, 139, 0.9);
  color: #fff;
}

.photo-info {
  padding: 14px 16px;
}

.photo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.issue-type {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(148, 163, 184, 0.15);
  border-radius: 4px;
  color: #94a3b8;
}

.photo-time {
  font-size: 11px;
  color: #64748b;
}

.photo-desc {
  font-size: 13px;
  color: #cbd5e1;
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.photo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
}

.reporter {
  font-size: 12px;
  color: #64748b;
}

.actions {
  display: flex;
  gap: 6px;
}
</style>
