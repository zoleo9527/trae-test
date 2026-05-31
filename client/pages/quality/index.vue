<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">质检管理</h1>
        <p class="text-gray-500 mt-1">管理所有项目的质检记录</p>
      </div>
      <button
        v-if="canCreate"
        @click="handleCreate"
        class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建质检
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">日期范围</label>
          <div class="flex gap-2">
            <input
              v-model="filters.startDate"
              type="date"
              class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span class="flex items-center text-gray-400">至</span>
            <input
              v-model="filters.endDate"
              type="date"
              class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div class="min-w-[180px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">项目</label>
          <select
            v-model="filters.projectId"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部项目</option>
            <option v-for="project in dataStore.projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>
        <div class="min-w-[150px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">评分等级</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部</option>
            <option value="excellent">优秀</option>
            <option value="good">良好</option>
            <option value="pass">合格</option>
            <option value="fail">不合格</option>
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button
            @click="handleReset"
            class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            重置
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">总质检次数</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ filteredInspections.length }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">优秀/良好</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ stats.excellentGood }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">合格率</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">{{ stats.passRate }}%</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">需整改</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ stats.needRectification }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">日期</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">项目</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">质检员</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">评分</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">总体评价</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">整改状态</th>
              <th class="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="inspection in filteredInspections"
              :key="inspection.id"
              class="transition-colors hover:bg-gray-50"
              :class="{ 'bg-red-50': inspection.overallStatus === 'fail' }"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ inspection.date }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ getProjectName(inspection.projectId) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ getInspectorName(inspection.inspectorId) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-lg font-bold" :class="getScoreColor(inspection.score)">{{ inspection.score }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getOverallStatusColor(inspection.overallStatus)"
                >
                  {{ getOverallStatusText(inspection.overallStatus) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="inspection.rectificationRequired" class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getRectificationStatusColor(inspection.rectificationStatus)"
                  >
                    {{ getRectificationStatusText(inspection.rectificationStatus) }}
                  </span>
                  <span v-if="inspection.rectificationStatus === 'overdue'" class="text-red-500 text-xs">⚠️ 逾期</span>
                </div>
                <span v-else class="text-sm text-gray-400">无需整改</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                <button
                  @click="handleViewDetail(inspection)"
                  class="text-primary-600 hover:text-primary-800 font-medium"
                >
                  查看详情
                </button>
              </td>
            </tr>
            <tr v-if="filteredInspections.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-gray-400">
                <span class="text-4xl mb-3 block">📋</span>
                <p>暂无质检记录</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <InspectionDetailModal
      :visible="detailModalVisible"
      :inspection="selectedInspection"
      @close="detailModalVisible = false"
      @view-rectification="handleViewRectification"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useDataStore } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import {
  getOverallStatusText,
  getOverallStatusColor,
  getRectificationStatusText,
  getRectificationStatusColor
} from '~/utils/formatters'
import { formatDate, addDays } from '~/utils/date'
import InspectionDetailModal from '~/components/InspectionDetailModal.vue'
import type { QualityInspection } from '~/types'

const dataStore = useDataStore()
const authStore = useAuthStore()
const router = useRouter()

const filters = reactive({
  startDate: addDays(formatDate(new Date()), -30),
  endDate: formatDate(new Date()),
  projectId: '',
  status: ''
})

const detailModalVisible = ref(false)
const selectedInspection = ref<QualityInspection | null>(null)

const canCreate = computed(() => {
  return authStore.hasPermission(['quality_inspector', 'project_manager'])
})

const filteredInspections = computed(() => {
  return dataStore.inspections.filter(inspection => {
    if (filters.startDate && inspection.date < filters.startDate) return false
    if (filters.endDate && inspection.date > filters.endDate) return false
    if (filters.projectId && inspection.projectId !== filters.projectId) return false
    if (filters.status && inspection.overallStatus !== filters.status) return false
    return true
  }).sort((a, b) => b.date.localeCompare(a.date))
})

const stats = computed(() => {
  const inspections = filteredInspections.value
  const excellentGood = inspections.filter(i => i.overallStatus === 'excellent' || i.overallStatus === 'good').length
  const passed = inspections.filter(i => i.overallStatus !== 'fail').length
  const needRectification = inspections.filter(i => i.rectificationRequired).length
  
  return {
    excellentGood,
    passRate: inspections.length > 0 ? Math.round((passed / inspections.length) * 100) : 0,
    needRectification
  }
})

function getProjectName(projectId: string): string {
  const project = dataStore.getProjectById(projectId)
  return project?.name || '未知项目'
}

function getInspectorName(inspectorId: string): string {
  const staff = dataStore.staff.find(s => s.id === inspectorId)
  return staff?.name || '未知质检员'
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function handleCreate() {
  router.push('/quality/inspection/new')
}

function handleViewDetail(inspection: QualityInspection) {
  selectedInspection.value = inspection
  detailModalVisible.value = true
}

function handleViewRectification(inspectionId: string) {
  detailModalVisible.value = false
  router.push({ path: '/rectification', query: { inspectionId } })
}

function handleReset() {
  filters.startDate = addDays(formatDate(new Date()), -30)
  filters.endDate = formatDate(new Date())
  filters.projectId = ''
  filters.status = ''
}
</script>
