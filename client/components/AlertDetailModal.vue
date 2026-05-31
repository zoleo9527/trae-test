<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center"
            :class="getAlertSeverityBg(alert.severity)"
          >
            <span class="text-2xl">{{ getAlertIcon(alert.type) }}</span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">{{ alert.title }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span
                class="px-2 py-0.5 text-xs rounded-full"
                :class="getSeverityBadgeClass(alert.severity)"
              >
                {{ getSeverityText(alert.severity) }}
              </span>
              <span
                class="px-2 py-0.5 text-xs rounded-full"
                :class="getStatusBadgeClass(alert.status)"
              >
                {{ getStatusText(alert.status) }}
              </span>
              <span class="text-xs text-gray-500">{{ getAlertTypeText(alert.type) }}</span>
            </div>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span class="text-xl">✕</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <div class="bg-gray-50 rounded-xl p-5">
          <h4 class="font-medium text-gray-900 mb-3">预警信息</h4>
          <p class="text-gray-600 leading-relaxed">{{ alert.description }}</p>
          <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <span class="text-gray-500">关联项目:</span>
              <span class="text-gray-900 ml-2">{{ projectName }}</span>
            </div>
            <div>
              <span class="text-gray-500">创建时间:</span>
              <span class="text-gray-900 ml-2">{{ formatDateTime(alert.createdAt) }}</span>
            </div>
            <div>
              <span class="text-gray-500">更新时间:</span>
              <span class="text-gray-900 ml-2">{{ formatDateTime(alert.updatedAt) }}</span>
            </div>
            <div v-if="alert.resolvedAt">
              <span class="text-gray-500">解决时间:</span>
              <span class="text-gray-900 ml-2">{{ formatDateTime(alert.resolvedAt) }}</span>
            </div>
          </div>
          <div v-if="alert.resolutionNote" class="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <span class="text-sm font-medium text-green-800">处理结果:</span>
            <p class="text-sm text-green-700 mt-1">{{ alert.resolutionNote }}</p>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h4 class="font-medium text-gray-900 mb-3">关联数据</h4>
          <div v-if="relatedData" class="space-y-3">
            <div v-for="(value, key) in relatedData" :key="key" class="flex items-start gap-2">
              <span class="text-gray-500 text-sm w-24 flex-shrink-0">{{ getFieldLabel(key as string) }}:</span>
              <span class="text-gray-900 text-sm">{{ formatFieldValue(key as string, value) }}</span>
            </div>
          </div>
          <div v-else class="text-gray-400 text-sm text-center py-4">
            暂无关联数据详情
          </div>
          
          <div v-if="alert.type === 'contract_expiry' && alert.status !== 'resolved'" class="mt-4 pt-4 border-t border-gray-100">
            <button
              @click="handleRenewalFollowUp"
              class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>📋</span>
              续约跟进
            </button>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-gray-900 mb-4">处理时间线</h4>
          <div class="relative">
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div class="space-y-4">
              <div
                v-for="(item, index) in alert.history"
                :key="index"
                class="relative pl-10"
              >
                <div
                  class="absolute left-2 w-5 h-5 rounded-full border-4 border-white"
                  :class="getTimelineDotClass(item.status)"
                ></div>
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span
                        class="px-2 py-0.5 text-xs rounded-full"
                        :class="getStatusBadgeClass(item.status)"
                      >
                        {{ getStatusText(item.status) }}
                      </span>
                      <span class="text-sm text-gray-500">{{ getOperatorName(item.operatorId) }}</span>
                    </div>
                    <span class="text-xs text-gray-400">{{ formatDateTime(item.timestamp) }}</span>
                  </div>
                  <p class="text-sm text-gray-600">{{ item.note }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <div v-if="alert.status !== 'resolved'" class="space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">处理操作</label>
            <textarea
              v-model="actionNote"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请输入处理备注..."
            ></textarea>
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="$emit('close')"
              class="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              关闭
            </button>
            <button
              v-if="alert.status === 'open'"
              @click="handleStatusChange('in_progress')"
              class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
            >
              <span>⏳</span>
              开始处理
            </button>
            <button
              v-if="alert.status === 'in_progress'"
              @click="handleStatusChange('resolved')"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <span>✅</span>
              标记解决
            </button>
          </div>
        </div>
        <div v-else class="flex justify-end gap-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            关闭
          </button>
          <button
            @click="handleStatusChange('open')"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            重新打开
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="confirmDialog.visible"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
      @click.self="confirmDialog.visible = false"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">{{ confirmDialog.title }}</h3>
        </div>
        <div class="px-6 py-4">
          <p class="text-gray-600">{{ confirmDialog.message }}</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            @click="confirmDialog.visible = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="confirmDialog.onConfirm"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import { formatDateTime } from '~/utils/date'
import {
  getAlertTypeText,
  getStatusText
} from '~/utils/formatters'
import type { Alert, AlertType, AlertSeverity, AlertStatus } from '~/types'

const props = defineProps<{
  alert: Alert
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  'status-change': []
}>()

const dataStore = useDataStore()
const authStore = useAuthStore()

const actionNote = ref('')

const confirmDialog = ref({
  visible: false,
  title: '',
  message: '',
  onConfirm: () => {}
})

const projectName = computed(() => {
  if (!props.alert.projectId) return '无'
  return dataStore.getProjectById(props.alert.projectId)?.name || '未知项目'
})

const relatedData = computed(() => {
  const { relatedType, relatedId } = props.alert
  
  if (relatedType === 'punch') {
    const punch = dataStore.punchRecords.find(p => p.id === relatedId)
    if (punch) {
      const staff = dataStore.getStaffById(punch.staffId)
      return {
        staffName: staff?.name || '未知',
        date: punch.date,
        status: getStatusText(punch.status),
        checkInTime: punch.checkInTime || '-',
        checkOutTime: punch.checkOutTime || '-',
        note: punch.note || '-'
      }
    }
  } else if (relatedType === 'supply') {
    const supply = dataStore.supplies.find(s => s.id === relatedId)
    if (supply) {
      return {
        supplyName: supply.name,
        category: supply.category,
        currentStock: `${supply.currentStock}${supply.unit}`,
        warningStock: `${supply.warningStock}${supply.unit}`,
        safeStock: `${supply.safeStock}${supply.unit}`,
        supplier: supply.supplier
      }
    }
  } else if (relatedType === 'rectification') {
    const rect = dataStore.rectifications.find(r => r.id === relatedId)
    if (rect) {
      const project = dataStore.getProjectById(rect.projectId)
      const completedItems = rect.items.filter(i => i.completed).length
      return {
        projectName: project?.name || '未知',
        deadline: rect.deadline,
        status: getStatusText(rect.status),
        progress: `${completedItems}/${rect.items.length} 项`,
        assignee: rect.assigneeId ? dataStore.getStaffById(rect.assigneeId)?.name : '未指定'
      }
    }
  } else if (relatedType === 'project') {
    const project = dataStore.getProjectById(relatedId)
    if (project) {
      return {
        projectName: project.name,
        clientName: project.clientName,
        contractStartDate: project.contractStartDate,
        contractEndDate: project.contractEndDate,
        status: getStatusText(project.status)
      }
    }
  } else if (relatedType === 'requisition') {
    const req = dataStore.requisitions.find(r => r.id === relatedId)
    if (req) {
      const project = dataStore.getProjectById(req.projectId)
      const applicant = dataStore.getStaffById(req.applicantId)
      return {
        projectName: project?.name || '未知',
        applicant: applicant?.name || '未知',
        applicationDate: req.applicationDate,
        status: getStatusText(req.status),
        itemsCount: `${req.items.length} 项`
      }
    }
  }
  
  return null
})

function getFieldLabel(key: string): string {
  const labelMap: Record<string, string> = {
    staffName: '员工姓名',
    date: '日期',
    checkInTime: '打卡时间',
    checkOutTime: '签退时间',
    supplyName: '耗材名称',
    category: '分类',
    currentStock: '当前库存',
    warningStock: '预警库存',
    safeStock: '安全库存',
    supplier: '供应商',
    projectName: '项目名称',
    clientName: '客户名称',
    contractStartDate: '合同开始',
    contractEndDate: '合同结束',
    deadline: '截止日期',
    progress: '整改进度',
    assignee: '负责人',
    applicant: '申请人',
    applicationDate: '申请日期',
    itemsCount: '申请项数'
  }
  return labelMap[key] || key
}

function formatFieldValue(key: string, value: unknown): string {
  if (key === 'category' && typeof value === 'string') {
    const categoryMap: Record<string, string> = {
      detergent: '清洁剂',
      tool: '清洁工具',
      disposable: '一次性用品',
      protective: '防护用品'
    }
    return categoryMap[value] || value
  }
  return String(value)
}

function getOperatorName(operatorId: string): string {
  if (operatorId === 'system') return '系统'
  return dataStore.getUserNameById(operatorId)
}

function handleStatusChange(status: AlertStatus) {
  const note = actionNote.value || (status === 'in_progress' ? '开始处理' : status === 'resolved' ? '已解决' : '重新打开')
  
  const statusTextMap: Record<AlertStatus, string> = {
    open: '重新打开',
    in_progress: '开始处理',
    resolved: '标记已解决'
  }
  
  confirmDialog.value = {
    visible: true,
    title: `确认${statusTextMap[status]}`,
    message: `确定要将预警「${props.alert.title}」${statusTextMap[status]}吗？`,
    onConfirm: async () => {
      await dataStore.updateAlertStatus(props.alert.id, status, note, getCurrentUserId())
      confirmDialog.value.visible = false
      actionNote.value = ''
      emit('status-change')
    }
  }
}

function getAlertIcon(type: AlertType): string {
  const iconMap: Record<AlertType, string> = {
    missing_punch: '🕐',
    rectification: '🔧',
    low_stock: '📦',
    contract_expiry: '📄',
    overdue_task: '⚠️'
  }
  return iconMap[type]
}

function getAlertSeverityBg(severity: AlertSeverity): string {
  const bgMap: Record<AlertSeverity, string> = {
    critical: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100'
  }
  return bgMap[severity]
}

function getSeverityBadgeClass(severity: AlertSeverity): string {
  const classMap: Record<AlertSeverity, string> = {
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
    info: 'bg-blue-100 text-blue-700'
  }
  return classMap[severity]
}

function getStatusBadgeClass(status: AlertStatus): string {
  const classMap: Record<AlertStatus, string> = {
    open: 'bg-red-100 text-red-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700'
  }
  return classMap[status]
}

function getSeverityText(severity: AlertSeverity): string {
  const textMap: Record<AlertSeverity, string> = {
    critical: '紧急',
    warning: '警告',
    info: '提示'
  }
  return textMap[severity]
}

function getTimelineDotClass(status: AlertStatus): string {
  const classMap: Record<AlertStatus, string> = {
    open: 'bg-red-500',
    in_progress: 'bg-yellow-500',
    resolved: 'bg-green-500'
  }
  return classMap[status]
}

const router = useRouter()

function handleRenewalFollowUp() {
  confirmDialog.value = {
    visible: true,
    title: '续约跟进',
    message: '是否跳转到历史记录页面查看项目详情并进行续约跟进？',
    onConfirm: () => {
      confirmDialog.value.visible = false
      router.push('/history')
      emit('close')
    }
  }
}

function getCurrentUserId(): string {
  return authStore.currentUser?.id || 'system'
}
</script>
