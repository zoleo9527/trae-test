<template>
  <div class="courses-page">
    <div class="page-header">
      <div class="date-nav">
        <button class="date-btn" @click="prevWeek">←</button>
        <span class="date-range">{{ dateRangeText }}</span>
        <button class="date-btn" @click="nextWeek">→</button>
        <button class="btn btn-sm btn-secondary" @click="goToday">今天</button>
      </div>
    </div>
    
    <div class="timetable card">
      <div class="timetable-header">
        <div class="time-col"></div>
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="day-col"
          :class="{ today: day.isToday }"
        >
          <div class="day-name">{{ day.name }}</div>
          <div class="day-date">{{ day.dateText }}</div>
        </div>
      </div>
      <div class="timetable-body">
        <div v-for="slot in timeSlots" :key="slot" class="time-row">
          <div class="time-label">{{ slot }}</div>
          <div
            v-for="day in weekDays"
            :key="day.date + '-' + slot"
            class="cell"
          >
            <div
              v-for="course in getCoursesAt(day.date, slot)"
              :key="course.id"
              class="course-card"
              :class="course.status"
            >
              <div class="course-time">{{ formatTime(course.start_time) }} - {{ formatTime(course.end_time) }}</div>
              <div class="course-name">{{ course.name }}</div>
              <div class="course-coach">{{ course.coach_name }}</div>
              <div class="course-meta">
                <span>{{ course.enrolled }}/{{ course.capacity }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="courses-list card">
      <div class="card-header">
        <h3>所有课程</h3>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>课程名称</th>
            <th>教练</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>人数</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in courses" :key="course.id">
            <td>{{ course.name }}</td>
            <td>{{ course.coach_name || '-' }}</td>
            <td>{{ formatDateTime(course.start_time) }}</td>
            <td>{{ formatDateTime(course.end_time) }}</td>
            <td>{{ course.enrolled }}/{{ course.capacity }}</td>
            <td>
              <span class="badge" :class="courseStatusClass(course.status)">
                {{ courseStatusLabels[course.status] }}
              </span>
            </td>
          </tr>
          <tr v-if="!courses.length">
            <td colspan="6">
              <div class="empty-state">
                <div class="empty-icon">📅</div>
                <div class="empty-text">暂无课程安排</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dbApi from '@/db'
import dayjs from 'dayjs'

const weekStart = ref(dayjs().startOf('week'))
const courses = ref<any[]>([])

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
]

const courseStatusLabels: Record<string, string> = {
  scheduled: '已排课',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

const weekDays = computed(() => {
  const days = []
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  for (let i = 0; i < 7; i++) {
    const date = weekStart.value.add(i, 'day')
    days.push({
      date: date.format('YYYY-MM-DD'),
      name: dayNames[i],
      dateText: date.format('MM/DD'),
      isToday: date.isSame(dayjs(), 'day')
    })
  }
  return days
})

const dateRangeText = computed(() => {
  const end = weekStart.value.add(6, 'day')
  return `${weekStart.value.format('YYYY年MM月DD日')} - ${end.format('MM月DD日')}`
})

function prevWeek() {
  weekStart.value = weekStart.value.subtract(7, 'day')
  loadCourses()
}

function nextWeek() {
  weekStart.value = weekStart.value.add(7, 'day')
  loadCourses()
}

function goToday() {
  weekStart.value = dayjs().startOf('week')
  loadCourses()
}

function getCoursesAt(date: string, timeSlot: string) {
  const slotStart = dayjs(`${date} ${timeSlot}`).valueOf()
  const slotEnd = dayjs(`${date} ${timeSlot}`).add(1, 'hour').valueOf()
  
  return courses.value.filter(c => {
    return c.start_time < slotEnd && c.end_time > slotStart
  })
}

function courseStatusClass(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'badge-info',
    in_progress: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-muted'
  }
  return map[status] || 'badge-muted'
}

function formatTime(ts: number): string {
  return dayjs(ts).format('HH:mm')
}

function formatDateTime(ts: number): string {
  return dayjs(ts).format('MM-DD HH:mm')
}

async function loadCourses() {
  const start = weekStart.valueOf()
  const end = weekStart.value.add(7, 'day').valueOf()
  courses.value = await dbApi.getCourses(start, end)
}

onMounted(loadCourses)
</script>

<style scoped>
.courses-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 6px;
  color: #94a3b8;
  transition: all 0.15s ease;
}

.date-btn:hover {
  background: rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
}

.date-range {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
  min-width: 240px;
  text-align: center;
}

.timetable {
  padding: 0;
  overflow: auto;
}

.timetable-header {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  background: rgba(15, 23, 42, 0.6);
  position: sticky;
  top: 0;
  z-index: 10;
}

.time-col {
  padding: 12px 8px;
  border-right: 1px solid rgba(148, 163, 184, 0.1);
}

.day-col {
  padding: 12px 8px;
  text-align: center;
  border-right: 1px solid rgba(148, 163, 184, 0.1);
}

.day-col:last-child {
  border-right: none;
}

.day-col.today {
  background: rgba(59, 130, 246, 0.1);
}

.day-name {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 2px;
}

.day-col.today .day-name {
  color: #60a5fa;
}

.day-date {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.day-col.today .day-date {
  color: #60a5fa;
}

.timetable-body {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
}

.time-row {
  display: contents;
}

.time-label {
  grid-column: 1;
  padding: 10px 8px;
  font-size: 11px;
  color: #64748b;
  text-align: right;
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
}

.cell {
  padding: 4px;
  border-right: 1px solid rgba(148, 163, 184, 0.05);
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
  min-height: 60px;
}

.course-card {
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.course-card:hover {
  background: rgba(59, 130, 246, 0.25);
}

.course-card.completed {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
  opacity: 0.7;
}

.course-card.in_progress {
  background: rgba(234, 179, 8, 0.15);
  border-color: rgba(234, 179, 8, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.course-time {
  font-size: 10px;
  color: #60a5fa;
  margin-bottom: 2px;
}

.course-name {
  font-size: 12px;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-coach {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 2px;
}

.course-meta {
  font-size: 10px;
  color: #64748b;
}

.courses-list {
  padding: 0;
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
</style>
