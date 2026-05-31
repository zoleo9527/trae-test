<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">历史记录查询</h1>
        <p class="text-gray-500 mt-1">统一查询各类业务记录</p>
      </div>
      <button
        v-if="filteredRecords.length > 0"
        @click="handleExport"
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center gap-2"
      >
        <span>📤</span>
        导出数据
      </button>
    </div>

    <HistoryFilterBar
      :types="recordTypes"
      :auto-sync="isInitialized"
      @filter-change="handleFilterChange"
    />

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">
            共 <span class="font-semibold text-gray-900">{{ filteredRecords.length }}</span> 条记录
          </span>
          <div v-if="activeType" class="text-sm text-gray-500">
            当前显示: <span class="font-medium text-primary-600">{{ activeTypeLabel }}</span>
          </div>
        </div>
      </div>

      <div class="divide-y divide-gray-50">
        <div
          v-for="record in filteredRecords"
          :key="record.id"
          class="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
          @click="openRecordDetail(record)"
        >
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              :class="getRecordTypeBg(record.type)"
            >
              <span class="text-2xl">{{ getRecordIcon(record.type) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 flex-shrink-0"
                >
                  {{ getRecordTypeLabel(record.type) }}
                </span>
                <h3 class="font-medium text-gray-900">{{ record.title }}</h3>
                <span
                  class="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                  :class="getStatusBadgeClass(record.status)"
                >
                  {{ getStatusText(record.status) }}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ record.description }}</p>
              <div class="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                <span v-if="record.projectName">
                  项目: {{ record.projectName }}
                </span>
                <span v-if="record.staffName">
                  人员: {{ record.staffName }}
                </span>
                <span>
                  时间: {{ record.date }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-300">→</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredRecords.length === 0" class="px-6 py-12 text-center text-gray-400">
        <span class="text-4xl mb-3 block">📭</span>
        <p>暂无符合条件的记录</p>
      </div>
    </div>

    <div
      v-if="detailModal.visible"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="detailModal.visible = false"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="getRecordTypeBg(detailModal.record?.type || '')"
            >
              <span class="text-xl">{{ getRecordIcon(detailModal.record?.type || '') }}</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ detailModal.record?.title }}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-gray-500">{{ getRecordTypeLabel(detailModal.record?.type || '') }}</span>
                <span
                  class="px-2 py-0.5 text-xs rounded-full"
                  :class="getStatusBadgeClass(detailModal.record?.status || '')"
                >
                  {{ getStatusText(detailModal.record?.status || '') }}
                </span>
              </div>
            </div>
          </div>
          <button
            @click="detailModal.visible = false"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span class="text-xl">✕</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <div class="bg-gray-50 rounded-xl p-5">
            <h4 class="font-medium text-gray-900 mb-3">记录详情</h4>
            <div class="space-y-3">
              <div v-for="(value, key) in detailModal.record?.detail" :key="key" class="flex items-start gap-2">
                <span class="text-gray-500 text-sm w-32 flex-shrink-0">{{ getDetailLabel(key as string) }}:</span>
                <span class="text-gray-900 text-sm">{{ formatDetailValue(key as string, value) }}</span>
              </div>
            </div>
          </div>

          <div v-if="detailModal.record?.extra && Object.keys(detailModal.record.extra).length > 0" class="bg-white border border-gray-200 rounded-xl p-5">
            <h4 class="font-medium text-gray-900 mb-3">扩展信息</h4>
            <div class="space-y-2">
              <div
                v-for="(value, key) in detailModal.record.extra" :key="key" class="flex items-start gap-2">
                <span class="text-gray-500 text-sm w-32 flex-shrink-0">{{ getDetailLabel(key as string) }}:</span>
                <span class="text-gray-900 text-sm">{{ formatDetailValue(key as string, value) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-100">
          <button
            @click="detailModal.visible = false"
            class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="toast.visible"
      class="fixed top-6 right-6 z-50 animate-fade-in"
    >
      <div
        class="px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
        :class="{
          'bg-green-500 text-white': toast.type === 'success',
          'bg-red-500 text-white': toast.type === 'error',
          'bg-blue-500 text-white': toast.type === 'info'
        }"
      >
        <span>{{ toast.icon }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </div>

    <div
      v-if="exportConfirmVisible"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="exportConfirmVisible = false"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">确认导出</h3>
        </div>
        <div class="px-6 py-4">
          <p class="text-gray-600">
            确定要导出当前筛选条件下的 <span class="font-semibold text-primary-600">{{ filteredRecords.length }}</span> 条记录吗？
          </p>
          <p class="text-sm text-gray-500 mt-2">将导出为 CSV 格式文件（模拟）</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            @click="exportConfirmVisible = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="executeExport"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            确认导出
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from '~/stores/data'
import { useFilterStore } from '~/stores/filter'
import { formatDate, formatDateTime } from '~/utils/date'
import {
  getStatusText,
  getTaskTypeText,
  getAlertTypeText,
  getCategoryText
} from '~/utils/formatters'
import type {
  Schedule,
  PunchRecord,
  QualityInspection,
  SupplyRequisition,
  Alert
} from '~/types'
import HistoryFilterBar from '~/components/HistoryFilterBar.vue'

interface HistoryRecord {
  id: string
  type: 'schedule' | 'punch' | 'inspection' | 'requisition' | 'alert'
  title: string
  description: string
  status: string
  date: string
  projectName: string
  staffName?: string
  detail: Record<string, unknown>
  extra: Record<string, unknown>
}

const route = useRoute()
const router = useRouter()

const dataStore = useDataStore()
const filterStore = useFilterStore()

const isInitialized = ref(false)

onMounted(() => {
  filterStore.clearAllFilters()
  
  const projectId = route.query.projectId as string
  if (projectId) {
    filterStore.global.projectIds = [projectId]
  }
  
  isInitialized.value = true
})

watch(
  () => filterStore.global.projectIds,
  (projectIds) => {
    if (!isInitialized.value) return
    const query = { ...route.query }
    if (projectIds.length > 0) {
      query.projectId = projectIds[0]
    } else {
      delete query.projectId
    }
    router.replace({ query })
  }
)

const recordTypes = [
  { value: 'schedule', label: '排班记录', icon: '📅', bgClass: 'bg-blue-50', textClass: 'text-blue-700', borderClass: 'border-blue-300' },
  { value: 'punch', label: '打卡记录', icon: '🕐', bgClass: 'bg-red-50', textClass: 'text-red-700', borderClass: 'border-red-300' },
  { value: 'inspection', label: '质检记录', icon: '✅', bgClass: 'bg-green-50', textClass: 'text-green-700', borderClass: 'border-green-300' },
  { value: 'requisition', label: '耗材申领', icon: '📦', bgClass: 'bg-purple-50', textClass: 'text-purple-700', borderClass: 'border-purple-300' },
  { value: 'alert', label: '预警处理', icon: '🚨', bgClass: 'bg-orange-50', textClass: 'text-orange-700', borderClass: 'border-orange-300' }
]

const detailModal = ref({
  visible: false,
  record: null as HistoryRecord | null
})

const toast = ref({
  visible: false,
  type: 'success' as 'success' | 'error' | 'info',
  message: '',
  icon: ''
})

const exportConfirmVisible = ref(false)

const activeType = computed(() => {
  const types = filterStore.global.types
  return types.length === 1 ? types[0] : null
})

const activeTypeLabel = computed(() => {
  if (!activeType.value) {
    return '全部类型'
  }
  const typeConfig = recordTypes.find(t => t.value === activeType.value)
  return typeConfig?.label || '全部类型'
})

const allRecords = computed<HistoryRecord[]>(() => {
  const records: HistoryRecord[] = []
  const types = filterStore.global.types

  if (types.length === 0 || types.includes('schedule')) {
    dataStore.schedules.forEach(schedule => {
      const project = dataStore.getProjectById(schedule.projectId)
      const staffName = dataStore.getUserNameById(schedule.staffId)
      records.push({
        id: `schedule-${schedule.id}`,
        type: 'schedule',
        title: `${staffName} - ${project?.name || '未知项目'}`,
        description: `${getTaskTypeText(schedule.taskType)} ${schedule.startTime}-${schedule.endTime}`,
        status: schedule.status,
        date: schedule.date,
        projectName: project?.name || '未知项目',
        staffName,
        detail: {
          taskType: schedule.taskType,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          status: schedule.status,
          note: schedule.note || '-'
        },
        extra: {}
      })
    })
  }

  if (types.length === 0 || types.includes('punch')) {
    dataStore.punchRecords.forEach(punch => {
      const project = dataStore.getProjectById(punch.projectId)
      const staffName = dataStore.getUserNameById(punch.staffId)
      records.push({
        id: `punch-${punch.id}`,
        type: 'punch',
        title: `${staffName} - 打卡记录`,
        description: punch.status === 'normal' ? '正常打卡' :
                     punch.status === 'late' ? '迟到' :
                     punch.status === 'early_leave' ? '早退' : '缺勤',
        status: punch.status,
        date: punch.date,
        projectName: project?.name || '未知项目',
        staffName,
        detail: {
          checkInTime: punch.checkInTime || '-',
          checkOutTime: punch.checkOutTime || '-',
          locationVerified: punch.locationVerified ? '是' : '否',
          status: punch.status,
          note: punch.note || '-'
        },
        extra: {}
      })
    })
  }

  if (types.length === 0 || types.includes('inspection')) {
    dataStore.inspections.forEach(inspection => {
      const project = dataStore.getProjectById(inspection.projectId)
      const inspectorName = dataStore.getUserNameById(inspection.inspectorId)
      records.push({
        id: `inspection-${inspection.id}`,
        type: 'inspection',
        title: `质检 - ${project?.name || '未知项目'}`,
        description: `评分: ${inspection.score}分 - ${inspection.overallStatus === 'excellent' ? '优秀' :
                     inspection.overallStatus === 'good' ? '良好' :
                     inspection.overallStatus === 'pass' ? '合格' : '不合格'}`,
        status: inspection.overallStatus,
        date: inspection.date,
        projectName: project?.name || '未知项目',
        staffName: inspectorName,
        detail: {
          score: `${inspection.score}分`,
          overallStatus: inspection.overallStatus,
          rectificationRequired: inspection.rectificationRequired ? '需要' : '不需要',
          rectificationDeadline: inspection.rectificationDeadline || '-',
          note: inspection.note || '-',
          inspector: inspectorName
        },
        extra: {
          itemCount: `${inspection.items.length}项检查项`
        }
      })
    })
  }

  if (types.length === 0 || types.includes('requisition')) {
    dataStore.requisitions.forEach(requisition => {
      const project = dataStore.getProjectById(requisition.projectId)
      const applicantName = dataStore.getUserNameById(requisition.applicantId)
      const approverName = requisition.approverId ? dataStore.getUserNameById(requisition.approverId) : '未审批'
      records.push({
        id: `requisition-${requisition.id}`,
        type: 'requisition',
        title: `耗材申领 - ${project?.name || '未知项目'}`,
        description: `${requisition.items.length}项耗材`,
        status: requisition.status,
        date: requisition.applicationDate,
        projectName: project?.name || '未知项目',
        staffName: applicantName,
        detail: {
          applicationDate: requisition.applicationDate,
          status: requisition.status,
          itemsCount: `${requisition.items.length}项`,
          applicant: applicantName,
          approver: approverName,
          approvalDate: requisition.approvalDate || '-',
          deliveryDate: requisition.deliveryDate || '-',
          rejectReason: requisition.rejectReason || '-'
        },
        extra: {}
      })
    })
  }

  if (types.length === 0 || types.includes('alert')) {
    dataStore.alerts.forEach(alert => {
      const project = alert.projectId ? dataStore.getProjectById(alert.projectId) : null
      records.push({
        id: `alert-${alert.id}`,
        type: 'alert',
        title: alert.title,
        description: alert.description,
        status: alert.status,
        date: formatDate(alert.createdAt),
        projectName: project?.name || '无',
        detail: {
          alertType: getAlertTypeText(alert.type),
          severity: alert.severity === 'critical' ? '紧急' : alert.severity === 'warning' ? '警告' : '提示',
          status: alert.status,
          createdAt: formatDateTime(alert.createdAt),
          updatedAt: formatDateTime(alert.updatedAt),
          resolvedAt: alert.resolvedAt ? formatDateTime(alert.resolvedAt) : '-',
          resolutionNote: alert.resolutionNote || '-'
        },
        extra: {
          historyCount: `${alert.history.length}条处理记录`
        }
      })
    })
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const filteredRecords = computed<HistoryRecord[]>(() => {
  return allRecords.value.filter(record => {
    if (filterStore.global.dateRange) {
      const [start, end] = filterStore.global.dateRange
      if (record.date < start || record.date > end) {
        return false
      }
    }

    if (filterStore.global.projectIds.length > 0) {
      const project = dataStore.projects.find(p => p.name === record.projectName)
      if (!project || !filterStore.global.projectIds.includes(project.id)) {
        return false
      }
    }

    if (filterStore.global.statuses.length > 0) {
      if (!filterStore.global.statuses.includes(record.status)) {
        return false
      }
    }

    if (filterStore.global.searchText) {
      const search = filterStore.global.searchText.toLowerCase()
      const searchStr = `${record.title} ${record.description} ${record.projectName} ${record.staffName || ''}`
      if (!searchStr.toLowerCase().includes(search)) {
        return false
      }
    }

    return true
  })
})

function handleFilterChange() {
}

function openRecordDetail(record: HistoryRecord) {
  detailModal.value = {
    visible: true,
    record
  }
}

function handleExport() {
  exportConfirmVisible.value = true
}

function executeExport() {
  exportConfirmVisible.value = false
  showToast('success', `导出成功，共导出 ${filteredRecords.value.length} 条记录`, '📤')
}

function showToast(type: 'success' | 'error' | 'info', message: string, icon: string) {
  toast.value = { visible: true, type, message, icon }
  setTimeout(() => {
    toast.value.visible = false
  }, 3000)
}

function getRecordIcon(type: string): string {
  const iconMap: Record<string, string> = {
    schedule: '📅',
    punch: '🕐',
    inspection: '✅',
    requisition: '📦',
    alert: '🚨'
  }
  return iconMap[type] || '📄'
}

function getRecordTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    schedule: '排班记录',
    punch: '打卡记录',
    inspection: '质检记录',
    requisition: '耗材申领',
    alert: '预警处理'
  }
  return labelMap[type] || '其他'
}

function getRecordTypeBg(type: string): string {
  const bgMap: Record<string, string> = {
    schedule: 'bg-blue-100',
    punch: 'bg-red-100',
    inspection: 'bg-green-100',
    requisition: 'bg-purple-100',
    alert: 'bg-orange-100'
  }
  return bgMap[type] || 'bg-gray-100'
}

function getStatusBadgeClass(status: string): string {
  const classMap: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
    normal: 'bg-green-100 text-green-700',
    late: 'bg-yellow-100 text-yellow-700',
    early_leave: 'bg-yellow-100 text-yellow-700',
    absent: 'bg-red-100 text-red-700',
    excellent: 'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    pass: 'bg-green-100 text-green-700',
    fail: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    delivered: 'bg-blue-100 text-blue-700',
    open: 'bg-red-100 text-red-700',
    resolved: 'bg-green-100 text-green-700'
  }
  return classMap[status] || 'bg-gray-100 text-gray-700'
}

function getDetailLabel(key: string): string {
  const labelMap: Record<string, string> = {
    taskType: '任务类型',
    startTime: '开始时间',
    endTime: '结束时间',
    checkInTime: '打卡时间',
    checkOutTime: '签退时间',
    locationVerified: '位置验证',
    score: '评分',
    overallStatus: '整体评价',
    rectificationRequired: '需要整改',
    rectificationDeadline: '整改截止',
    applicationDate: '申请日期',
    itemsCount: '项数',
    approver: '审批人',
    approvalDate: '审批日期',
    deliveryDate: '发货日期',
    rejectReason: '拒绝原因',
    alertType: '预警类型',
    severity: '严重程度',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    resolvedAt: '解决时间',
    resolutionNote: '处理结果',
    itemCount: '检查项',
    historyCount: '处理记录',
    status: '状态',
    note: '备注'
  }
  return labelMap[key] || key
}

function formatDetailValue(key: string, value: unknown): string {
  if (key === 'taskType' && typeof value === 'string') {
    return getTaskTypeText(value)
  }
  if (key === 'overallStatus' && typeof value === 'string') {
    const statusMap: Record<string, string> = {
      excellent: '优秀',
      good: '良好',
      pass: '合格',
      fail: '不合格'
    }
    return statusMap[value] || value
  }
  if (key === 'severity' && typeof value === 'string') {
    const severityMap: Record<string, string> = {
      critical: '紧急',
      warning: '警告',
      info: '提示'
    }
    return severityMap[value] || value
  }
  return String(value)
}

</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
