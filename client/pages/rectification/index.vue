<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">整改追踪</h1>
        <p class="text-gray-500 mt-1">管理和跟踪所有整改任务</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div class="flex flex-wrap gap-4">
        <div class="min-w-[180px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="overdue">已逾期</option>
          </select>
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
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
          <div class="flex gap-2">
            <input
              v-model="filters.startDeadline"
              type="date"
              class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span class="flex items-center text-gray-400">至</span>
            <input
              v-model="filters.endDeadline"
              type="date"
              class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
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
        <p class="text-sm text-gray-500">待处理</p>
        <p class="text-2xl font-bold text-yellow-600 mt-1">{{ stats.pending }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">进行中</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">{{ stats.inProgress }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">已逾期</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ stats.overdue }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">已完成</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ stats.completed }}</p>
      </div>
    </div>

    <div class="space-y-4">
      <div
        v-for="rect in filteredRectifications"
        :key="rect.id"
        class="bg-white rounded-xl shadow-sm border transition-all duration-200 overflow-hidden"
        :class="[
          rect.status === 'overdue' ? 'border-red-300 bg-red-50' : 'border-gray-100 hover:border-primary-200'
        ]"
      >
        <div class="p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <h3 class="font-semibold text-gray-900">{{ getProjectName(rect.projectId) }}</h3>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getRectificationStatusColor(rect.status)"
                >
                  {{ getRectificationStatusText(rect.status) }}
                </span>
                <span v-if="rect.status === 'overdue'" class="text-red-500 text-xs">⚠️ 已逾期</span>
              </div>
              <p class="text-sm text-gray-500">
                共 {{ rect.items.length }} 项整改 · 截止日期：{{ rect.deadline }}
              </p>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <button
                @click="handleViewDetail(rect)"
                class="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
              >
                查看详情
              </button>
            </div>
          </div>

          <div class="mb-3">
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="text-gray-500">整改进度</span>
              <span class="font-medium text-gray-900">{{ getProgress(rect) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-500"
                :class="getProgressColor(rect)"
                :style="{ width: `${getProgress(rect)}%` }"
              ></div>
            </div>
          </div>

          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span v-if="rect.assigneeId" class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              负责人：{{ getStaffName(rect.assigneeId) }}
            </span>
            <span v-if="rect.completedDate" class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              完成日期：{{ rect.completedDate }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="filteredRectifications.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <span class="text-4xl mb-3 block">✅</span>
        <p class="text-gray-500">暂无整改任务</p>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="detailModalVisible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click.self="detailModalVisible = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-gray-900">整改详情</h2>
              <p class="text-sm text-gray-500 mt-1" v-if="selectedRect">
                {{ getProjectName(selectedRect.projectId) }} · 截止日期：{{ selectedRect.deadline }}
              </p>
            </div>
            <button
              @click="detailModalVisible = false"
              class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div v-if="selectedRect" class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div class="flex items-center gap-3 mb-3">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    :class="getRectificationStatusColor(selectedRect.status)"
                  >
                    {{ getRectificationStatusText(selectedRect.status) }}
                  </span>
                  <span v-if="isOverdue(selectedRect)" class="text-red-500 text-sm font-medium">
                    ⚠️ 已逾期 {{ daysOverdue(selectedRect) }} 天
                  </span>
                </div>
                <div class="space-y-2 text-sm">
                  <p><span class="text-gray-500">整改项目数：</span>{{ selectedRect.items.length }} 项</p>
                  <p><span class="text-gray-500">整改进度：</span>{{ getProgress(selectedRect) }}%</p>
                  <p v-if="selectedRect.assigneeId"><span class="text-gray-500">负责人：</span>{{ getStaffName(selectedRect.assigneeId) }}</p>
                  <p v-if="selectedRect.completedDate"><span class="text-gray-500">完成日期：</span>{{ selectedRect.completedDate }}</p>
                </div>
              </div>

              <div>
                <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    class="h-3 rounded-full transition-all duration-500"
                    :class="getProgressColor(selectedRect)"
                    :style="{ width: `${getProgress(selectedRect)}%` }"
                  ></div>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">
                    已完成：{{ completedCount(selectedRect) }} / {{ selectedRect.items.length }}
                  </span>
                  <span class="text-gray-500">
                    剩余：{{ selectedRect.items.length - completedCount(selectedRect) }} 项
                  </span>
                </div>

                <div v-if="canAssign && selectedRect.status !== 'completed'" class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">分配负责人</label>
                  <div class="flex gap-2">
                    <select
                      v-model="assignForm.assigneeId"
                      class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">选择负责人</option>
                      <option v-for="staff in projectSupervisors" :key="staff.id" :value="staff.id">
                        {{ staff.name }}
                      </option>
                    </select>
                    <button
                      @click="handleAssign"
                      class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      分配
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">整改项</h3>
              <div class="space-y-3">
                <RectificationItem
                  v-for="(item, index) in selectedRect.items"
                  :key="index"
                  :item="item"
                  :item-index="index"
                  :rect-id="selectedRect.id"
                  :readonly="!canEditItems"
                  @update="handleItemUpdate"
                />
              </div>
            </div>

            <div v-if="canEditItems && selectedRect.status !== 'completed'" class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">上传整改照片</h3>
              <div class="flex flex-wrap gap-3">
                <div
                  v-for="(photo, index) in selectedRect.photos"
                  :key="index"
                  class="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100"
                >
                  <img :src="photo" class="w-full h-full object-cover" />
                </div>
                <button
                  @click="handleAddPhoto"
                  class="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
                >
                  <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span class="text-sm">添加照片</span>
                </button>
              </div>
            </div>

            <div v-if="selectedRect.photos.length > 0 && selectedRect.status === 'completed'" class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">整改后照片</h3>
              <div class="grid grid-cols-3 gap-3">
                <div
                  v-for="(photo, index) in selectedRect.photos"
                  :key="index"
                  class="aspect-video rounded-lg overflow-hidden bg-gray-100"
                >
                  <img :src="photo" class="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <div v-if="canReview && selectedRect.status === 'completed'" class="mb-6">
              <div class="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">复查确认</h3>
                <p class="text-sm text-gray-600 mb-4">请检查整改是否符合要求，确认后完成整改流程。</p>
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">复查意见</label>
                  <textarea
                    v-model="reviewForm.note"
                    rows="2"
                    placeholder="请输入复查意见..."
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  ></textarea>
                </div>
                <div class="flex gap-3">
                  <button
                    @click="handleReview(true)"
                    class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    ✅ 整改通过
                  </button>
                  <button
                    @click="handleReview(false)"
                    class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    ❌ 重新整改
                  </button>
                </div>
              </div>
            </div>

            <div v-if="selectedRect.note" class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">备注</h3>
              <p class="text-gray-600">{{ selectedRect.note }}</p>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button
              @click="detailModalVisible = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useDataStore } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import {
  getRectificationStatusText,
  getRectificationStatusColor
} from '~/utils/formatters'
import { formatDate, isPast, daysBetween } from '~/utils/date'
import RectificationItem from '~/components/RectificationItem.vue'
import type { RectificationRecord } from '~/types'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const authStore = useAuthStore()

const filters = reactive({
  status: '',
  projectId: '',
  startDeadline: '',
  endDeadline: ''
})

const detailModalVisible = ref(false)
const selectedRect = ref<RectificationRecord | null>(null)

const assignForm = reactive({
  assigneeId: ''
})

const reviewForm = reactive({
  note: ''
})

const canAssign = computed(() => {
  return authStore.currentRole === 'project_manager'
})

const canReview = computed(() => {
  return authStore.currentRole === 'quality_inspector'
})

const canEditItems = computed(() => {
  return authStore.currentRole !== 'quality_inspector'
})

const projectSupervisors = computed(() => {
  if (!selectedRect.value) return []
  const project = dataStore.getProjectById(selectedRect.value.projectId)
  if (!project) return []
  return dataStore.staff.filter(s => 
    s.projects.includes(selectedRect.value!.projectId) && s.position === 'supervisor' && s.status === 'active'
  )
})

const filteredRectifications = computed(() => {
  return dataStore.rectifications.filter(rect => {
    if (filters.status && rect.status !== filters.status) return false
    if (filters.projectId && rect.projectId !== filters.projectId) return false
    if (filters.startDeadline && rect.deadline < filters.startDeadline) return false
    if (filters.endDeadline && rect.deadline > filters.endDeadline) return false
    return true
  }).sort((a, b) => {
    const statusOrder: Record<string, number> = { overdue: 0, pending: 1, in_progress: 2, completed: 3 }
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
  })
})

const stats = computed(() => {
  const rects = dataStore.rectifications
  return {
    pending: rects.filter(r => r.status === 'pending').length,
    inProgress: rects.filter(r => r.status === 'in_progress').length,
    overdue: rects.filter(r => r.status === 'overdue').length,
    completed: rects.filter(r => r.status === 'completed').length
  }
})

function getProjectName(projectId: string): string {
  const project = dataStore.getProjectById(projectId)
  return project?.name || '未知项目'
}

function getStaffName(staffId: string | null): string {
  if (!staffId) return '未分配'
  const staff = dataStore.staff.find(s => s.id === staffId)
  return staff?.name || '未知'
}

function getProgress(rect: RectificationRecord): number {
  if (rect.items.length === 0) return 0
  const completed = rect.items.filter(item => item.completed).length
  return Math.round((completed / rect.items.length) * 100)
}

function completedCount(rect: RectificationRecord): number {
  return rect.items.filter(item => item.completed).length
}

function getProgressColor(rect: RectificationRecord): string {
  const progress = getProgress(rect)
  if (rect.status === 'overdue') return 'bg-red-500'
  if (progress === 100) return 'bg-green-500'
  if (progress >= 50) return 'bg-blue-500'
  return 'bg-yellow-500'
}

function isOverdue(rect: RectificationRecord): boolean {
  return rect.status === 'overdue' || (rect.status !== 'completed' && isPast(rect.deadline))
}

function daysOverdue(rect: RectificationRecord): number {
  return daysBetween(rect.deadline, formatDate(new Date()))
}

function handleViewDetail(rect: RectificationRecord) {
  selectedRect.value = rect
  assignForm.assigneeId = rect.assigneeId || ''
  reviewForm.note = ''
  detailModalVisible.value = true
}

async function handleItemUpdate(itemIndex: number, completed: boolean, note: string) {
  if (!selectedRect.value) return
  
  if (selectedRect.value.status === 'pending' && canEditItems.value) {
    await dataStore.updateRectificationStatus(selectedRect.value.id, 'in_progress')
  }
  
  await dataStore.updateRectificationItem(selectedRect.value.id, itemIndex, completed, note)
}

async function handleAssign() {
  if (!selectedRect.value || !assignForm.assigneeId) return
  await dataStore.assignRectification(selectedRect.value.id, assignForm.assigneeId)
}

async function handleAddPhoto() {
  if (!selectedRect.value) return
  const randomId = Date.now()
  const photoUrl = `https://picsum.photos/400/300?random=${randomId}`
  await dataStore.addRectificationPhoto(selectedRect.value.id, photoUrl)
}

async function handleReview(passed: boolean) {
  if (!selectedRect.value || !authStore.currentUser) return
  
  await dataStore.reviewRectification(
    selectedRect.value.id,
    passed,
    authStore.currentUser.id,
    reviewForm.note || (passed ? '整改符合要求' : '整改未达标，需重新整改')
  )
  
  detailModalVisible.value = false
}

function handleReset() {
  filters.status = ''
  filters.projectId = ''
  filters.startDeadline = ''
  filters.endDeadline = ''
}

onMounted(() => {
  const inspectionId = route.query.inspectionId as string
  if (inspectionId) {
    const rect = dataStore.rectifications.find(r => r.inspectionId === inspectionId)
    if (rect) {
      handleViewDetail(rect)
      router.replace({ path: '/rectification', query: {} })
    }
  }
})
</script>
