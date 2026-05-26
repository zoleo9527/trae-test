<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-icon blue">🔐</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.activeLockers }}</div>
          <div class="stat-label">使用中储物柜</div>
        </div>
        <div class="stat-sub">空闲 {{ stats.availableLockers }} 个</div>
      </div>
      
      <div class="stat-card card">
        <div class="stat-icon green">🏊</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayCourses }}</div>
          <div class="stat-label">今日课程</div>
        </div>
        <div class="stat-sub">共 {{ stats.totalMembers }} 名活跃会员</div>
      </div>
      
      <div class="stat-card card">
        <div class="stat-icon orange">⚠️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingAppeals }}</div>
          <div class="stat-label">待处理申诉</div>
        </div>
        <div class="stat-sub" :class="{ urgent: stats.urgentAppeals > 0 }">
          紧急 {{ stats.urgentAppeals }} 件
        </div>
      </div>
      
      <div class="stat-card card">
        <div class="stat-icon purple">💰</div>
        <div class="stat-info">
          <div class="stat-value">¥{{ totalRevenue.toFixed(0) }}</div>
          <div class="stat-label">本月营收</div>
        </div>
        <div class="stat-sub">储值消费记录</div>
      </div>
    </div>
    
    <div class="dashboard-grid">
      <div class="card recent-appeals">
        <div class="card-header">
          <h3>最新申诉</h3>
          <router-link to="/appeals" class="view-all">查看全部</router-link>
        </div>
        <div class="appeal-list">
          <div v-if="!recentAppeals.length" class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-text">暂无申诉记录</div>
          </div>
          <div
            v-for="appeal in recentAppeals"
            :key="appeal.id"
            class="appeal-item"
            @click="$router.push(`/appeals/${appeal.id}`)"
          >
            <div class="appeal-left">
              <span class="appeal-type-tag">{{ typeLabels[appeal.type] }}</span>
              <span class="appeal-title">{{ appeal.title }}</span>
            </div>
            <div class="appeal-right">
              <span class="badge" :class="priorityClass(appeal.priority)">
                {{ priorityLabels[appeal.priority] }}
              </span>
              <span class="badge" :class="statusClass(appeal.status)">
                {{ statusLabels[appeal.status] }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card today-schedule">
        <div class="card-header">
          <h3>今日课程</h3>
        </div>
        <div class="schedule-list">
          <div v-if="!todayCourses.length" class="empty-state">
            <div class="empty-icon">📅</div>
            <div class="empty-text">今日暂无课程安排</div>
          </div>
          <div
            v-for="course in todayCourses"
            :key="course.id"
            class="schedule-item"
          >
            <div class="schedule-time">
              <span class="time-start">{{ formatTime(course.start_time) }}</span>
              <span class="time-arrow">→</span>
              <span class="time-end">{{ formatTime(course.end_time) }}</span>
            </div>
            <div class="schedule-info">
              <div class="course-name">{{ course.name }}</div>
              <div class="course-coach">{{ course.coach_name || '未分配教练' }}</div>
            </div>
            <div class="schedule-count">
              {{ course.enrolled }}/{{ course.capacity }}人
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card active-lockers">
      <div class="card-header">
        <h3>储物柜使用状态</h3>
      </div>
      <div class="locker-zones">
        <div v-for="zone in zones" :key="zone.name" class="locker-zone">
          <div class="zone-name">{{ zone.name }}</div>
          <div class="zone-lockers">
            <div
              v-for="locker in zone.lockers"
              :key="locker.id"
              class="locker-box"
              :class="locker.status"
              :title="`${locker.locker_no} - ${lockerStatusLabels[locker.status]}`"
            >
              {{ locker.locker_no }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import dbApi from '@/db'
import dayjs from 'dayjs'
import { APPEAL_TYPE_LABELS, APPEAL_STATUS_LABELS, APPEAL_PRIORITY_LABELS, LOCKER_STATUS_LABELS } from '@/types'

const stats = ref({
  activeLockers: 0,
  availableLockers: 0,
  todayCourses: 0,
  pendingAppeals: 0,
  urgentAppeals: 0,
  totalMembers: 0
})

const recentAppeals = ref<any[]>([])
const todayCourses = ref<any[]>([])
const allLockers = ref<any[]>([])
const transactions = ref<any[]>([])

const typeLabels = APPEAL_TYPE_LABELS
const statusLabels = APPEAL_STATUS_LABELS
const priorityLabels = APPEAL_PRIORITY_LABELS
const lockerStatusLabels = LOCKER_STATUS_LABELS

const totalRevenue = computed(() => {
  const monthStart = dayjs().startOf('month').valueOf()
  return transactions.value
    .filter(t => t.type === 'recharge' && t.created_at >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0)
})

const zones = computed(() => {
  const zoneMap = new Map<string, any[]>()
  allLockers.value.forEach(locker => {
    if (!zoneMap.has(locker.zone)) {
      zoneMap.set(locker.zone, [])
    }
    zoneMap.get(locker.zone)!.push(locker)
  })
  return Array.from(zoneMap.entries()).map(([name, lockers]) => ({ name, lockers }))
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

function formatTime(ts: number): string {
  return dayjs(ts).format('HH:mm')
}

async function loadData() {
  stats.value = await dbApi.getDashboardStats()
  recentAppeals.value = (await dbApi.getAppeals()).slice(0, 5)
  
  const todayStart = dayjs().startOf('day').valueOf()
  const todayEnd = dayjs().endOf('day').valueOf()
  todayCourses.value = await dbApi.getCourses(todayStart, todayEnd)
  
  allLockers.value = await dbApi.getLockers()
  transactions.value = await dbApi.getTransactions()
}

onMounted(loadData)
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  overflow: hidden;
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

.stat-icon.blue { background: rgba(59, 130, 246, 0.15); }
.stat-icon.green { background: rgba(34, 197, 94, 0.15); }
.stat-icon.orange { background: rgba(249, 115, 22, 0.15); }
.stat-icon.purple { background: rgba(139, 92, 246, 0.15); }

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.stat-sub {
  position: absolute;
  bottom: 12px;
  right: 16px;
  font-size: 11px;
  color: #64748b;
}

.stat-sub.urgent {
  color: #fb923c;
  font-weight: 500;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.card-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.view-all {
  font-size: 12px;
  color: #3b82f6;
  text-decoration: none;
}

.view-all:hover {
  text-decoration: underline;
}

.appeal-list,
.schedule-list {
  padding: 8px 0;
}

.appeal-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.appeal-item:hover {
  background: rgba(148, 163, 184, 0.05);
}

.appeal-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.appeal-type-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 4px;
  color: #94a3b8;
  flex-shrink: 0;
}

.appeal-title {
  font-size: 13px;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.appeal-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
}

.schedule-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  width: 110px;
}

.time-start { color: #e2e8f0; font-weight: 500; }
.time-arrow { color: #475569; }

.schedule-info {
  flex: 1;
  min-width: 0;
}

.course-name {
  font-size: 13px;
  color: #e2e8f0;
  margin-bottom: 2px;
}

.course-coach {
  font-size: 12px;
  color: #64748b;
}

.schedule-count {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

.active-lockers {
  padding: 0;
}

.locker-zones {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.locker-zone {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.zone-name {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  width: 60px;
  flex-shrink: 0;
  padding-top: 6px;
}

.zone-lockers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.locker-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}

.locker-box.available {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.locker-box.occupied {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.locker-box.maintenance {
  background: rgba(234, 179, 8, 0.15);
  border-color: rgba(234, 179, 8, 0.3);
  color: #fcd34d;
}

.locker-box.damaged {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.locker-box:hover {
  transform: translateY(-2px);
}
</style>
