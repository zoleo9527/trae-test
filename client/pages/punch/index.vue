<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">打卡管理</h1>
        <p class="text-gray-500 mt-1">查看和管理员工打卡记录，处理异常打卡</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div class="px-4 py-3 border-b border-gray-200">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700">日期范围:</label>
              <input
                v-model="filterStartDate"
                type="date"
                class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <span class="text-gray-500">至</span>
              <input
                v-model="filterEndDate"
                type="date"
                class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700">项目:</label>
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
              <label class="text-sm font-medium text-gray-700">员工:</label>
              <select
                v-model="filterStaffId"
                class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">全部员工</option>
                <option v-for="staff in staff" :key="staff.id" :value="staff.id">
                  {{ staff.name }}
                </option>
              </select>
            </div>

            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700">状态:</label>
              <select
                v-model="filterStatus"
                class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">全部状态</option>
                <option value="normal">正常</option>
                <option value="late">迟到</option>
                <option value="early_leave">早退</option>
                <option value="absent">缺勤</option>
                <option value="pending">待确认</option>
              </select>
            </div>

            <div class="flex items-center gap-2 ml-auto">
              <button
                v-if="hasActiveFilters"
                @click="clearFilters"
                class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                清除筛选
              </button>
              <button
                @click="exportData"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出
              </button>
            </div>
          </div>
        </div>

        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center gap-6 text-sm">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-green-500"></span>
              <span class="text-gray-600">正常: {{ stats.normal }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span class="text-gray-600">迟到: {{ stats.late }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span class="text-gray-600">早退: {{ stats.early_leave }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-red-500"></span>
              <span class="text-gray-600">缺勤: {{ stats.absent }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-gray-400"></span>
              <span class="text-gray-600">待确认: {{ stats.pending }}</span>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">员工</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上班打卡</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下班打卡</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置验证</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预警</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="record in filteredRecords"
                :key="record.id"
                :class="[
                  'cursor-pointer transition-colors',
                  getRowHighlightClass(record.status)
                ]"
                @click="viewDetail(record)"
              >
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ record.date }}</div>
                  <div class="text-xs text-gray-500">{{ getWeekDay(record.date) }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span class="text-primary-600 font-semibold text-xs">{{ getStaffName(record.staffId).charAt(0) }}</span>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ getStaffName(record.staffId) }}</div>
                      <div class="text-xs text-gray-500">{{ getStaffPosition(record.staffId) }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ getProjectName(record.projectId) }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div :class="['text-sm font-medium', getCheckInTimeClass(record)]">
                    {{ record.checkInTime || '--:--' }}
                  </div>
                  <div v-if="record.checkInTime" class="text-xs text-gray-400">
                    应到: {{ getScheduleStartTime(record.scheduleId) }}
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div :class="['text-sm font-medium', getCheckOutTimeClass(record)]">
                    {{ record.checkOutTime || '--:--' }}
                  </div>
                  <div v-if="record.checkOutTime" class="text-xs text-gray-400">
                    应退: {{ getScheduleEndTime(record.scheduleId) }}
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusClass(record.status)
                    ]"
                  >
                    {{ getStatusText(record.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 text-xs',
                      record.locationVerified ? 'text-green-600' : 'text-red-600'
                    ]"
                  >
                    <svg v-if="record.locationVerified" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {{ record.locationVerified ? '通过' : '失败' }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div v-if="hasAlert(record.id)" class="flex items-center gap-1 text-xs text-red-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    已预警
                  </div>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right">
                  <button
                    @click.stop="viewDetail(record)"
                    class="text-sm text-primary-600 hover:text-primary-700"
                  >
                    查看详情
                  </button>
                </td>
              </tr>
              <tr v-if="filteredRecords.length === 0">
                <td colspan="9" class="px-4 py-12 text-center">
                  <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p class="text-gray-500">暂无打卡记录</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-500">
            共 {{ totalRecords }} 条记录，第 {{ currentPage }} / {{ totalPages }} 页
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'px-3 py-1 text-sm rounded-lg transition-colors',
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              ]"
            >
              {{ page }}
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <PunchDetailModal
        :visible="detailModalVisible"
        :punch="selectedRecord"
        @close="detailModalVisible = false"
        @updated="handleRecordUpdated"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PunchRecord } from '~/types'

const dataStore = useDataStore()
const authStore = useAuthStore()

const today = formatDate(new Date())
const thirtyDaysAgo = addDays(today, -30)

const filterStartDate = ref(thirtyDaysAgo)
const filterEndDate = ref(today)
const filterProjectId = ref('')
const filterStaffId = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = 20
const detailModalVisible = ref(false)
const selectedRecord = ref<PunchRecord | null>(null)

const projects = computed(() => dataStore.projects)
const staff = computed(() => dataStore.staff)

const allRecords = computed(() => {
  return [...dataStore.punchRecords].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return (b.checkInTime || '').localeCompare(a.checkInTime || '')
  })
})

const filteredRecords = computed(() => {
  let records = allRecords.value

  if (filterStartDate.value) {
    records = records.filter(r => r.date >= filterStartDate.value)
  }
  if (filterEndDate.value) {
    records = records.filter(r => r.date <= filterEndDate.value)
  }
  if (filterProjectId.value) {
    records = records.filter(r => r.projectId === filterProjectId.value)
  }
  if (filterStaffId.value) {
    records = records.filter(r => r.staffId === filterStaffId.value)
  }
  if (filterStatus.value) {
    records = records.filter(r => r.status === filterStatus.value)
  }

  const start = (currentPage.value - 1) * pageSize
  return records.slice(start, start + pageSize)
})

const totalRecords = computed(() => {
  let records = allRecords.value

  if (filterStartDate.value) {
    records = records.filter(r => r.date >= filterStartDate.value)
  }
  if (filterEndDate.value) {
    records = records.filter(r => r.date <= filterEndDate.value)
  }
  if (filterProjectId.value) {
    records = records.filter(r => r.projectId === filterProjectId.value)
  }
  if (filterStaffId.value) {
    records = records.filter(r => r.staffId === filterStaffId.value)
  }
  if (filterStatus.value) {
    records = records.filter(r => r.status === filterStatus.value)
  }

  return records.length
})

const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize))

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value
  
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(5, total)
    } else {
      start = Math.max(1, total - 4)
    }
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const stats = computed(() => {
  const records = allRecords.value.filter(r => {
    if (filterStartDate.value && r.date < filterStartDate.value) return false
    if (filterEndDate.value && r.date > filterEndDate.value) return false
    if (filterProjectId.value && r.projectId !== filterProjectId.value) return false
    if (filterStaffId.value && r.staffId !== filterStaffId.value) return false
    return true
  })

  return {
    normal: records.filter(r => r.status === 'normal').length,
    late: records.filter(r => r.status === 'late').length,
    early_leave: records.filter(r => r.status === 'early_leave').length,
    absent: records.filter(r => r.status === 'absent').length,
    pending: records.filter(r => r.status === 'pending').length
  }
})

const hasActiveFilters = computed(() => {
  return filterStartDate.value !== thirtyDaysAgo ||
         filterEndDate.value !== today ||
         filterProjectId.value !== '' ||
         filterStaffId.value !== '' ||
         filterStatus.value !== ''
})

function getStaffName(staffId: string): string {
  const s = staff.value.find(s => s.id === staffId)
  return s?.name || '未知'
}

function getStaffPosition(staffId: string): string {
  const s = staff.value.find(s => s.id === staffId)
  return s?.position === 'supervisor' ? '主管' : '保洁员'
}

function getProjectName(projectId: string): string {
  const p = projects.value.find(p => p.id === projectId)
  return p?.name || '未知项目'
}

function getScheduleStartTime(scheduleId: string): string {
  const s = dataStore.schedules.find(s => s.id === scheduleId)
  return s?.startTime || '--:--'
}

function getScheduleEndTime(scheduleId: string): string {
  const s = dataStore.schedules.find(s => s.id === scheduleId)
  return s?.endTime || '--:--'
}

function getWeekDay(dateStr: string): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const date = new Date(dateStr)
  return days[date.getDay()]
}

function getRowHighlightClass(status: string): string {
  if (status === 'absent') return 'bg-red-50 hover:bg-red-100'
  if (status === 'late' || status === 'early_leave') return 'bg-yellow-50 hover:bg-yellow-100'
  return 'hover:bg-gray-50'
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    normal: 'bg-green-100 text-green-700',
    late: 'bg-yellow-100 text-yellow-700',
    early_leave: 'bg-yellow-100 text-yellow-700',
    absent: 'bg-red-100 text-red-700',
    pending: 'bg-gray-100 text-gray-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function getCheckInTimeClass(record: PunchRecord): string {
  if (!record.checkInTime) return 'text-gray-400'
  const schedule = dataStore.schedules.find(s => s.id === record.scheduleId)
  if (!schedule) return 'text-gray-900'
  if (record.checkInTime > schedule.startTime) return 'text-yellow-600'
  return 'text-gray-900'
}

function getCheckOutTimeClass(record: PunchRecord): string {
  if (!record.checkOutTime) return 'text-gray-400'
  const schedule = dataStore.schedules.find(s => s.id === record.scheduleId)
  if (!schedule) return 'text-gray-900'
  if (record.checkOutTime < schedule.endTime) return 'text-yellow-600'
  return 'text-gray-900'
}

function hasAlert(punchId: string): boolean {
  return dataStore.alerts.some(a => 
    a.relatedId === punchId && a.relatedType === 'punch' && a.status !== 'resolved'
  )
}

function viewDetail(record: PunchRecord) {
  selectedRecord.value = record
  detailModalVisible.value = true
}

function clearFilters() {
  filterStartDate.value = thirtyDaysAgo
  filterEndDate.value = today
  filterProjectId.value = ''
  filterStaffId.value = ''
  filterStatus.value = ''
  currentPage.value = 1
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function exportData() {
  alert('导出功能开发中...')
}

function handleRecordUpdated() {
}
</script>
