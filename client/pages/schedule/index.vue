<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">排班管理</h1>
        <p class="text-gray-500 mt-1">管理员工排班，支持拖拽创建和冲突检测</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div class="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700">项目筛选:</label>
            <select
              v-model="filterProjectId"
              class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">全部项目</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700">员工筛选:</label>
            <select
              v-model="filterStaffId"
              class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">全部员工</option>
              <option v-for="staff in activeStaff" :key="staff.id" :value="staff.id">
                {{ staff.name }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2 ml-auto">
            <button
              @click="navigatePrevWeek"
              class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="text-base font-semibold text-gray-900 min-w-[200px] text-center">
              {{ weekLabel }}
            </span>
            <button
              @click="navigateNextWeek"
              class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              @click="goToToday"
              class="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              本周
            </button>
          </div>

          <button
            @click="openCreateForm"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            新建排班
          </button>
        </div>
      </div>

      <div class="flex gap-6">
        <div class="w-64 flex-shrink-0">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 class="font-medium text-gray-900">员工列表</h3>
              <p class="text-xs text-gray-500 mt-1">拖拽员工到日历创建排班</p>
            </div>
            <div class="p-3 space-y-2 max-h-[600px] overflow-y-auto">
              <div
                v-for="staff in activeStaff"
                :key="staff.id"
                draggable="true"
                @dragstart="handleDragStart($event, staff)"
                class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-primary-50 hover:border-primary-300 border border-gray-200 transition-colors"
              >
                <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-primary-600 font-semibold text-sm">{{ staff.name.charAt(0) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 text-sm truncate">{{ staff.name }}</p>
                  <p class="text-xs text-gray-500">{{ staff.position === 'supervisor' ? '主管' : '保洁员' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">图例</h4>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded bg-blue-100 border border-blue-300"></span>
                <span class="text-xs text-gray-600">已排期</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded bg-green-100 border border-green-300"></span>
                <span class="text-xs text-gray-600">已完成</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span>
                <span class="text-xs text-gray-600">进行中</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded bg-gray-100 border border-gray-300"></span>
                <span class="text-xs text-gray-600">已取消</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="grid grid-cols-7 border-b border-gray-200">
              <div
                v-for="(day, index) in weekDays"
                :key="index"
                :class="[
                  'py-3 text-center',
                  day.isToday ? 'bg-primary-50' : 'bg-gray-50'
                ]"
              >
                <p :class="['text-sm font-medium', day.isToday ? 'text-primary-600' : 'text-gray-700']">
                  {{ day.label }}
                </p>
                <p :class="['text-xs', day.isToday ? 'text-primary-500' : 'text-gray-500']">
                  {{ day.month }}/{{ day.day }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-7">
              <div
                v-for="(day, dayIndex) in weekDays"
                :key="dayIndex"
                :class="[
                  'min-h-[500px] p-2 border-r border-gray-100 transition-colors',
                  day.isToday ? 'bg-primary-50/30' : 'bg-white',
                  dragOverIndex === dayIndex ? 'bg-primary-100/50' : ''
                ]"
                @dragover.prevent="handleDragOver(dayIndex)"
                @dragleave="handleDragLeave"
                @drop="handleDrop($event, day)"
              >
                <div class="space-y-2">
                  <div
                    v-for="schedule in getSchedulesForDate(day.date)"
                    :key="schedule.id"
                    :class="[
                      'p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                      getScheduleColorClass(schedule.status)
                    ]"
                    @click="editSchedule(schedule)"
                  >
                    <div class="flex items-start justify-between mb-1">
                      <p class="font-medium text-xs text-gray-900 truncate">{{ getStaffName(schedule.staffId) }}</p>
                      <button
                        @click.stop="deleteSchedule(schedule.id)"
                        class="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg class="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p class="text-xs text-gray-600 truncate mb-1">{{ getProjectName(schedule.projectId) }}</p>
                    <p class="text-xs text-gray-500 mb-1">{{ schedule.startTime }} - {{ schedule.endTime }}</p>
                    <span
                      :class="[
                        'inline-block px-1.5 py-0.5 text-xs rounded',
                        getTaskTypeClass(schedule.taskType)
                      ]"
                    >
                      {{ getTaskTypeText(schedule.taskType) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScheduleForm
        :visible="formVisible"
        :schedule="editingSchedule"
        :initial-date="initialFormDate"
        :initial-staff-id="initialFormStaffId"
        @close="closeForm"
        @submit="handleFormSubmit"
        @update="handleFormUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Schedule, Staff } from '~/types'

const dataStore = useDataStore()
const authStore = useAuthStore()

const currentWeekStart = ref(getWeekStart(new Date()))
const filterProjectId = ref('')
const filterStaffId = ref('')
const formVisible = ref(false)
const editingSchedule = ref<Schedule | null>(null)
const initialFormDate = ref('')
const initialFormStaffId = ref('')
const dragOverIndex = ref(-1)
const draggedStaff = ref<Staff | null>(null)

const weekDaysLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const projects = computed(() => dataStore.projects)
const activeStaff = computed(() => dataStore.staff.filter(s => s.status === 'active'))

const weekDays = computed(() => {
  const days = []
  const startDate = new Date(currentWeekStart.value)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    days.push({
      date: formatDate(date),
      label: weekDaysLabels[i],
      day: date.getDate(),
      month: date.getMonth() + 1,
      isToday: isToday(date)
    })
  }
  return days
})

const weekLabel = computed(() => {
  const days = weekDays.value
  if (days.length === 0) return ''
  const start = days[0]
  const end = days[6]
  if (start.month === end.month) {
    return `${start.month}月${start.day}日 - ${end.day}日`
  } else {
    return `${start.month}月${start.day}日 - ${end.month}月${end.day}日`
  }
})

const filteredSchedules = computed(() => {
  let schedules = dataStore.getSchedulesByWeek(currentWeekStart.value)
  
  if (filterProjectId.value) {
    schedules = schedules.filter(s => s.projectId === filterProjectId.value)
  }
  if (filterStaffId.value) {
    schedules = schedules.filter(s => s.staffId === filterStaffId.value)
  }
  
  return schedules
})

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return formatDate(monday)
}

function navigatePrevWeek() {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() - 7)
  currentWeekStart.value = formatDate(date)
}

function navigateNextWeek() {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() + 7)
  currentWeekStart.value = formatDate(date)
}

function goToToday() {
  currentWeekStart.value = getWeekStart(new Date())
}

function getSchedulesForDate(date: string): Schedule[] {
  return filteredSchedules.value.filter(s => s.date === date)
}

function getStaffName(staffId: string): string {
  const staff = dataStore.getStaffById(staffId)
  return staff?.name || '未知'
}

function getProjectName(projectId: string): string {
  const project = dataStore.getProjectById(projectId)
  return project?.name || '未知项目'
}

function getScheduleColorClass(status: string): string {
  const classes: Record<string, string> = {
    scheduled: 'bg-blue-50 border-blue-300',
    in_progress: 'bg-yellow-50 border-yellow-300',
    completed: 'bg-green-50 border-green-300',
    cancelled: 'bg-gray-100 border-gray-300 opacity-60'
  }
  return classes[status] || 'bg-blue-50 border-blue-300'
}

function getTaskTypeClass(type: string): string {
  const classes: Record<string, string> = {
    daily: 'bg-blue-100 text-blue-700',
    deep: 'bg-purple-100 text-purple-700',
    special: 'bg-orange-100 text-orange-700'
  }
  return classes[type] || 'bg-gray-100 text-gray-700'
}

function handleDragStart(event: DragEvent, staff: Staff) {
  draggedStaff.value = staff
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }
}

function handleDragOver(index: number) {
  dragOverIndex.value = index
}

function handleDragLeave() {
  dragOverIndex.value = -1
}

function handleDrop(event: DragEvent, day: any) {
  event.preventDefault()
  dragOverIndex.value = -1
  
  if (draggedStaff.value) {
    initialFormDate.value = day.date
    initialFormStaffId.value = draggedStaff.value.id
    editingSchedule.value = null
    formVisible.value = true
    draggedStaff.value = null
  }
}

function openCreateForm() {
  editingSchedule.value = null
  initialFormDate.value = ''
  initialFormStaffId.value = ''
  formVisible.value = true
}

function editSchedule(schedule: Schedule) {
  editingSchedule.value = schedule
  initialFormDate.value = ''
  initialFormStaffId.value = ''
  formVisible.value = true
}

async function deleteSchedule(scheduleId: string) {
  if (confirm('确定要删除这个排班吗？')) {
    await dataStore.deleteSchedule(scheduleId)
  }
}

function closeForm() {
  formVisible.value = false
  editingSchedule.value = null
}

function handleFormSubmit(scheduleData: Omit<Schedule, 'id' | 'status'>) {
  dataStore.createSchedule(scheduleData)
  closeForm()
}

function handleFormUpdate(scheduleId: string, updates: Partial<Schedule>) {
  console.log('排班已更新:', scheduleId, updates)
}
</script>
