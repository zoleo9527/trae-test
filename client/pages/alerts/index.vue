<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">预警中心</h1>
        <p class="text-gray-500 mt-1">查看和处理所有预警信息</p>
      </div>
      <div class="flex items-center gap-3">
        <select
          v-model="viewMode"
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="grouped">按类型分组</option>
          <option value="list">全部列表</option>
        </select>
        <button
          v-if="selectedIds.length > 0"
          @click="showBatchModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center gap-2"
        >
          <span>批量操作</span>
          <span class="bg-primary-500 px-2 py-0.5 rounded-full text-xs">{{ selectedIds.length }}</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div
        v-for="stat in alertStats"
        :key="stat.type"
        class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
        :class="{ 'ring-2 ring-primary-500': activeTypeFilter === stat.type }"
        @click="toggleTypeFilter(stat.type)"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="stat.iconBg">
            <span class="text-xl">{{ stat.icon }}</span>
          </div>
          <div>
            <p class="text-sm text-gray-500">{{ stat.label }}</p>
            <p class="text-xl font-bold" :class="stat.countColor">{{ stat.count }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700">状态:</label>
        <div class="flex gap-2">
          <button
            v-for="status in statusFilters"
            :key="status.value"
            :class="[
              'px-3 py-1.5 text-sm rounded-lg border transition-colors',
              activeStatusFilter === status.value
                ? `${status.bgClass} ${status.textClass} ${status.borderClass}`
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            ]"
            @click="activeStatusFilter = status.value"
          >
            {{ status.label }} ({{ status.count }})
          </button>
        </div>
      </div>
      <div class="flex-1 max-w-md">
        <input
          v-model="searchText"
          type="text"
          placeholder="搜索预警标题或描述..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
      >
        清除筛选
      </button>
    </div>

    <div v-if="viewMode === 'grouped'">
      <div
        v-for="group in groupedAlerts"
        :key="group.type"
        class="space-y-4"
      >
        <div v-if="group.alerts.length > 0" class="flex items-center gap-3">
          <span class="text-2xl">{{ getAlertIcon(group.type) }}</span>
          <h2 class="text-lg font-semibold text-gray-900">{{ getAlertTypeText(group.type) }}</h2>
          <span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{{ group.alerts.length }}</span>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div v-if="group.alerts.length > 0" class="divide-y divide-gray-50">
            <div
              v-for="alert in group.alerts"
              :key="alert.id"
              class="hover:bg-gray-50 transition-colors"
              :class="{ 'bg-primary-50': selectedIds.includes(alert.id) }"
            >
              <div class="px-6 py-4">
                <div class="flex items-start gap-4">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(alert.id)"
                    @change="toggleSelect(alert.id)"
                    class="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                    :class="getAlertSeverityBg(alert.severity)"
                    @click="openDetail(alert)"
                  >
                    <span class="text-xl">{{ getAlertIcon(alert.type) }}</span>
                  </div>
                  <div class="flex-1 min-w-0 cursor-pointer" @click="openDetail(alert)">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="font-medium text-gray-900">{{ alert.title }}</h3>
                      <span
                        class="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                        :class="getSeverityBadgeClass(alert.severity)"
                      >
                        {{ getSeverityText(alert.severity) }}
                      </span>
                      <span
                        class="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                        :class="getStatusBadgeClass(alert.status)"
                      >
                        {{ getStatusText(alert.status) }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ alert.description }}</p>
                    <div class="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                      <span v-if="alert.projectId">
                        项目: {{ getProjectName(alert.projectId) }}
                      </span>
                      <span>创建时间: {{ formatDateTime(alert.createdAt) }}</span>
                      <span v-if="alert.updatedAt !== alert.createdAt">
                        更新时间: {{ formatDateTime(alert.updatedAt) }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="alert.status === 'open'"
                      @click.stop="handleStartProcessing(alert)"
                      class="px-3 py-1.5 text-sm text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    >
                      开始处理
                    </button>
                    <button
                      v-if="alert.status === 'in_progress'"
                      @click.stop="handleResolve(alert)"
                      class="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      标记解决
                    </button>
                    <button
                      v-if="alert.status === 'resolved'"
                      @click.stop="handleReopen(alert)"
                      class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      重新打开
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="px-6 py-12 text-center text-gray-400">
            <span class="text-4xl mb-3 block">✅</span>
            <p>暂无{{ getAlertTypeText(group.type) }}预警</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="divide-y divide-gray-50">
        <div
          v-for="alert in filteredAlerts"
          :key="alert.id"
          class="hover:bg-gray-50 transition-colors"
          :class="{ 'bg-primary-50': selectedIds.includes(alert.id) }"
        >
          <div class="px-6 py-4">
            <div class="flex items-start gap-4">
              <input
                type="checkbox"
                :checked="selectedIds.includes(alert.id)"
                @change="toggleSelect(alert.id)"
                class="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                :class="getAlertSeverityBg(alert.severity)"
                @click="openDetail(alert)"
              >
                <span class="text-xl">{{ getAlertIcon(alert.type) }}</span>
              </div>
              <div class="flex-1 min-w-0 cursor-pointer" @click="openDetail(alert)">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                    {{ getAlertTypeText(alert.type) }}
                  </span>
                  <h3 class="font-medium text-gray-900">{{ alert.title }}</h3>
                  <span
                    class="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                    :class="getSeverityBadgeClass(alert.severity)"
                  >
                    {{ getSeverityText(alert.severity) }}
                  </span>
                  <span
                    class="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                    :class="getStatusBadgeClass(alert.status)"
                  >
                    {{ getStatusText(alert.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ alert.description }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                  <span v-if="alert.projectId">
                    项目: {{ getProjectName(alert.projectId) }}
                  </span>
                  <span>创建时间: {{ formatDateTime(alert.createdAt) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="alert.status === 'open'"
                  @click.stop="handleStartProcessing(alert)"
                  class="px-3 py-1.5 text-sm text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                >
                  开始处理
                </button>
                <button
                  v-if="alert.status === 'in_progress'"
                  @click.stop="handleResolve(alert)"
                  class="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  标记解决
                </button>
                <button
                  v-if="alert.status === 'resolved'"
                  @click.stop="handleReopen(alert)"
                  class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  重新打开
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="filteredAlerts.length === 0" class="px-6 py-12 text-center text-gray-400">
        <span class="text-4xl mb-3 block">🎉</span>
        <p>暂无符合条件的预警</p>
      </div>
    </div>

    <AlertDetailModal
      v-if="detailModalVisible"
      :alert="selectedAlert!"
      :visible="detailModalVisible"
      @close="detailModalVisible = false"
      @status-change="handleStatusChange"
    />

    <div
      v-if="batchConfirmVisible"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="batchConfirmVisible = false"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">确认批量操作</h3>
        </div>
        <div class="px-6 py-4">
          <p class="text-gray-600 mb-4">
            确定要将选中的 <span class="font-semibold text-primary-600">{{ selectedIds.length }}</span> 条预警
            标记为 <span class="font-semibold">{{ getStatusText(batchAction) }}</span> 吗？
          </p>
          <div v-if="batchAction !== 'in_progress'" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">处理备注</label>
            <textarea
              v-model="batchNote"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请输入处理备注..."
            ></textarea>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            @click="batchConfirmVisible = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="executeBatchAction"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="confirmDialog.visible"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="confirmDialog.visible = false"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">{{ confirmDialog.title }}</h3>
        </div>
        <div class="px-6 py-4">
          <p class="text-gray-600 mb-4">{{ confirmDialog.message }}</p>
          <div v-if="confirmDialog.showNote" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">处理备注</label>
            <textarea
              v-model="confirmDialog.note"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="请输入处理备注..."
            ></textarea>
          </div>
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
      v-if="showBatchModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showBatchModal = false"
    >
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">批量操作</h3>
        </div>
        <div class="px-6 py-4 space-y-3">
          <button
            @click="openBatchConfirm('in_progress')"
            class="w-full px-4 py-3 text-left rounded-lg hover:bg-yellow-50 transition-colors flex items-center gap-3"
          >
            <span class="text-xl">⏳</span>
            <div>
              <p class="font-medium text-gray-900">标记处理中</p>
              <p class="text-sm text-gray-500">将选中的预警标记为处理中状态</p>
            </div>
          </button>
          <button
            @click="openBatchConfirm('resolved')"
            class="w-full px-4 py-3 text-left rounded-lg hover:bg-green-50 transition-colors flex items-center gap-3"
          >
            <span class="text-xl">✅</span>
            <div>
              <p class="font-medium text-gray-900">标记已解决</p>
              <p class="text-sm text-gray-500">将选中的预警标记为已解决状态</p>
            </div>
          </button>
        </div>
        <div class="px-6 py-4 border-t border-gray-100">
          <button
            @click="showBatchModal = false"
            class="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
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
import AlertDetailModal from '~/components/AlertDetailModal.vue'

const dataStore = useDataStore()
const authStore = useAuthStore()

const viewMode = ref<'grouped' | 'list'>('grouped')
const selectedIds = ref<string[]>([])
const activeTypeFilter = ref<AlertType | 'all'>('all')
const activeStatusFilter = ref<AlertStatus | 'all'>('all')
const searchText = ref('')
const detailModalVisible = ref(false)
const selectedAlert = ref<Alert | null>(null)
const showBatchModal = ref(false)
const batchConfirmVisible = ref(false)
const batchAction = ref<AlertStatus>('in_progress')
const batchNote = ref('')

const confirmDialog = ref({
  visible: false,
  title: '',
  message: '',
  showNote: false,
  note: '',
  onConfirm: () => {}
})

const toast = ref({
  visible: false,
  type: 'success' as 'success' | 'error' | 'info',
  message: '',
  icon: ''
})

const alertTypes: AlertType[] = ['missing_punch', 'rectification', 'low_stock', 'contract_expiry', 'overdue_task']

const alertStats = computed(() => {
  const alerts = dataStore.alerts
  return alertTypes.map(type => {
    const typeAlerts = alerts.filter(a => a.type === type)
    const criticalCount = typeAlerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length
    return {
      type,
      label: getAlertTypeText(type),
      icon: getAlertIcon(type),
      count: typeAlerts.filter(a => a.status !== 'resolved').length,
      iconBg: criticalCount > 0 ? 'bg-red-100' : getAlertSeverityBg(type === 'low_stock' ? 'warning' : 'info'),
      countColor: criticalCount > 0 ? 'text-red-600' : 'text-gray-900'
    }
  })
})

const statusFilters = computed(() => [
  { value: 'all' as const, label: '全部', count: dataStore.alerts.length, bgClass: 'bg-gray-100', textClass: 'text-gray-700', borderClass: 'border-gray-300' },
  { value: 'open' as const, label: '未处理', count: dataStore.alerts.filter(a => a.status === 'open').length, bgClass: 'bg-red-50', textClass: 'text-red-700', borderClass: 'border-red-300' },
  { value: 'in_progress' as const, label: '处理中', count: dataStore.alerts.filter(a => a.status === 'in_progress').length, bgClass: 'bg-yellow-50', textClass: 'text-yellow-700', borderClass: 'border-yellow-300' },
  { value: 'resolved' as const, label: '已解决', count: dataStore.alerts.filter(a => a.status === 'resolved').length, bgClass: 'bg-green-50', textClass: 'text-green-700', borderClass: 'border-green-300' }
])

const sortedAlerts = computed(() => {
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }
  return [...dataStore.alerts].sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const filteredAlerts = computed(() => {
  return sortedAlerts.value.filter(alert => {
    if (activeTypeFilter.value !== 'all' && alert.type !== activeTypeFilter.value) {
      return false
    }
    if (activeStatusFilter.value !== 'all' && alert.status !== activeStatusFilter.value) {
      return false
    }
    if (searchText.value) {
      const search = searchText.value.toLowerCase()
      if (!alert.title.toLowerCase().includes(search) && !alert.description.toLowerCase().includes(search)) {
        return false
      }
    }
    return true
  })
})

const groupedAlerts = computed(() => {
  return alertTypes.map(type => ({
    type,
    alerts: filteredAlerts.value.filter(a => a.type === type)
  }))
})

const hasActiveFilters = computed(() => {
  return activeTypeFilter.value !== 'all' || activeStatusFilter.value !== 'all' || searchText.value !== ''
})

function toggleTypeFilter(type: AlertType) {
  activeTypeFilter.value = activeTypeFilter.value === type ? 'all' : type
}

function clearFilters() {
  activeTypeFilter.value = 'all'
  activeStatusFilter.value = 'all'
  searchText.value = ''
}

function toggleSelect(id: string) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function openDetail(alert: Alert) {
  selectedAlert.value = alert
  detailModalVisible.value = true
}

function handleStartProcessing(alert: Alert) {
  confirmDialog.value = {
    visible: true,
    title: '确认开始处理',
    message: `确定要开始处理预警「${alert.title}」吗？`,
    showNote: false,
    note: '',
    onConfirm: async () => {
      await dataStore.updateAlertStatus(alert.id, 'in_progress', '开始处理', getCurrentUserId())
      confirmDialog.value.visible = false
      showToast('success', '已标记为处理中', '✅')
    }
  }
}

function handleResolve(alert: Alert) {
  confirmDialog.value = {
    visible: true,
    title: '确认标记已解决',
    message: `确定要将预警「${alert.title}」标记为已解决吗？`,
    showNote: true,
    note: '',
    onConfirm: async () => {
      const note = confirmDialog.value.note || '已解决'
      await dataStore.updateAlertStatus(alert.id, 'resolved', note, getCurrentUserId())
      confirmDialog.value.visible = false
      showToast('success', '已标记为已解决', '✅')
    }
  }
}

function handleReopen(alert: Alert) {
  confirmDialog.value = {
    visible: true,
    title: '确认重新打开',
    message: `确定要重新打开预警「${alert.title}」吗？`,
    showNote: true,
    note: '',
    onConfirm: async () => {
      const note = confirmDialog.value.note || '重新打开'
      await dataStore.updateAlertStatus(alert.id, 'open', note, getCurrentUserId())
      confirmDialog.value.visible = false
      showToast('success', '预警已重新打开', '🔄')
    }
  }
}

function handleStatusChange() {
  showToast('success', '预警状态已更新', '✅')
}

function openBatchConfirm(action: AlertStatus) {
  showBatchModal.value = false
  batchAction.value = action
  batchNote.value = ''
  batchConfirmVisible.value = true
}

async function executeBatchAction() {
  const note = batchNote.value || (batchAction.value === 'in_progress' ? '批量开始处理' : '批量标记已解决')
  for (const id of selectedIds.value) {
    await dataStore.updateAlertStatus(id, batchAction.value, note, getCurrentUserId())
  }
  batchConfirmVisible.value = false
  selectedIds.value = []
  showToast('success', `批量操作完成，共处理 ${selectedIds.value.length} 条预警`, '✅')
}

function showToast(type: 'success' | 'error' | 'info', message: string, icon: string) {
  toast.value = { visible: true, type, message, icon }
  setTimeout(() => {
    toast.value.visible = false
  }, 3000)
}

function getProjectName(projectId: string): string {
  return dataStore.getProjectById(projectId)?.name || '未知项目'
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

function getSeverityText(severity: AlertSeverity): string {
  const textMap: Record<AlertSeverity, string> = {
    critical: '紧急',
    warning: '警告',
    info: '提示'
  }
  return textMap[severity]
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

function getCurrentUserId(): string {
  return authStore.currentUser?.id || 'system'
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
