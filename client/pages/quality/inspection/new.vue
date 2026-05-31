<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">创建质检记录</h1>
        <p class="text-gray-500 mt-1">填写质检信息，生成分项评分</p>
      </div>
      <button
        @click="handleCancel"
        class="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        返回
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择项目 <span class="text-red-500">*</span></label>
          <select
            v-model="form.projectId"
            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">请选择项目</option>
            <option v-for="project in dataStore.projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">质检日期 <span class="text-red-500">*</span></label>
          <input
            v-model="form.date"
            type="date"
            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">分项评分</h3>
          <button
            @click="addInspectionItem"
            class="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加分项
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="p-4 bg-gray-50 rounded-xl border border-gray-100"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <input
                  v-model="item.name"
                  type="text"
                  placeholder="分项名称"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                />
              </div>
              <button
                v-if="form.items.length > 1"
                @click="removeInspectionItem(index)"
                class="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">满分</label>
                <input
                  v-model.number="item.maxScore"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">实际得分</label>
                <input
                  v-model.number="item.score"
                  type="number"
                  min="0"
                  :max="item.maxScore"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  @input="updateItemPassed(index)"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">是否通过</label>
                <div class="flex items-center h-10">
                  <span
                    class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium"
                    :class="item.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  >
                    {{ item.passed ? '✅ 通过' : '❌ 不通过' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-3">
              <input
                v-model="item.note"
                type="text"
                placeholder="备注（可选）"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-3">总体评价</h3>
          <div class="space-y-3">
            <div class="flex items-end gap-3">
              <span class="text-5xl font-bold" :class="getScoreColor(totalScore)">{{ totalScore }}</span>
              <span class="text-gray-400 mb-2">/ {{ maxTotalScore }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div
                class="h-3 rounded-full transition-all duration-500"
                :class="getScoreBgColor(totalScore)"
                :style="{ width: `${scorePercentage}%` }"
              ></div>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold"
                :class="getOverallStatusColor(overallStatus)"
              >
                {{ getOverallStatusText(overallStatus) }}
              </span>
              <span v-if="hasFailedItems" class="text-sm text-red-600 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                存在不合格项，需整改
              </span>
            </div>
          </div>
        </div>

        <div v-if="hasFailedItems" class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">整改设置</h3>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">整改截止日期 <span class="text-red-500">*</span></label>
            <input
              v-model="form.rectificationDeadline"
              type="date"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div v-if="canAssign">
            <label class="block text-sm font-medium text-gray-700 mb-2">整改负责人</label>
            <select
              v-model="form.assigneeId"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">暂不分配</option>
              <option v-for="staff in projectSupervisors" :key="staff.id" :value="staff.id">
                {{ staff.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="pt-4 border-t border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">上传照片（模拟）</h3>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="(photo, index) in form.photos"
            :key="index"
            class="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100"
          >
            <img :src="photo" class="w-full h-full object-cover" />
            <button
              @click="removePhoto(index)"
              class="absolute top-1 right-1 w-6 h-6 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            @click="addPhoto"
            class="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
          >
            <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-sm">添加照片</span>
          </button>
        </div>
      </div>

      <div class="pt-4 border-t border-gray-100">
        <label class="block text-sm font-medium text-gray-700 mb-2">总体备注</label>
        <textarea
          v-model="form.note"
          rows="3"
          placeholder="请输入质检总体评价和备注..."
          class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        ></textarea>
      </div>
    </div>

    <div class="flex justify-end gap-3">
      <button
        @click="handleCancel"
        class="px-6 py-3 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors"
      >
        取消
      </button>
      <button
        @click="handleSubmit"
        :disabled="!isFormValid || submitting"
        class="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        <svg v-if="submitting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ submitting ? '提交中...' : '提交质检' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useDataStore } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import {
  getOverallStatusText,
  getOverallStatusColor
} from '~/utils/formatters'
import { formatDate, addDays } from '~/utils/date'
import type { InspectionItem } from '~/types'

const dataStore = useDataStore()
const authStore = useAuthStore()
const router = useRouter()

const submitting = ref(false)

const defaultItems = (): InspectionItem[] => [
  { name: '大堂清洁', score: 20, maxScore: 20, passed: true, note: '' },
  { name: '卫生间清洁', score: 20, maxScore: 20, passed: true, note: '' },
  { name: '公共区域', score: 20, maxScore: 20, passed: true, note: '' },
  { name: '垃圾清运', score: 20, maxScore: 20, passed: true, note: '' },
  { name: '消毒工作', score: 20, maxScore: 20, passed: true, note: '' }
]

const form = reactive({
  projectId: '',
  date: formatDate(new Date()),
  items: defaultItems(),
  photos: [] as string[],
  rectificationDeadline: addDays(formatDate(new Date()), 3),
  assigneeId: '',
  note: ''
})

const canAssign = computed(() => {
  return authStore.currentRole === 'project_manager'
})

const projectSupervisors = computed(() => {
  if (!form.projectId) return []
  const project = dataStore.getProjectById(form.projectId)
  if (!project) return []
  return dataStore.staff.filter(s => 
    s.projects.includes(form.projectId) && s.position === 'supervisor' && s.status === 'active'
  )
})

const totalScore = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.score || 0), 0)
})

const maxTotalScore = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.maxScore || 0), 0)
})

const scorePercentage = computed(() => {
  if (maxTotalScore.value === 0) return 0
  return Math.round((totalScore.value / maxTotalScore.value) * 100)
})

const overallStatus = computed((): 'excellent' | 'good' | 'pass' | 'fail' => {
  const score = scorePercentage.value
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
})

const hasFailedItems = computed(() => {
  return form.items.some(item => !item.passed)
})

const isFormValid = computed(() => {
  if (!form.projectId || !form.date) return false
  if (form.items.some(item => !item.name || item.maxScore <= 0 || item.score < 0 || item.score > item.maxScore)) return false
  if (hasFailedItems.value && !form.rectificationDeadline) return false
  return true
})

function updateItemPassed(index: number) {
  const item = form.items[index]
  const passThreshold = item.maxScore * 0.6
  item.passed = item.score >= passThreshold
}

function addInspectionItem() {
  form.items.push({
    name: '',
    score: 0,
    maxScore: 20,
    passed: true,
    note: ''
  })
}

function removeInspectionItem(index: number) {
  form.items.splice(index, 1)
}

function addPhoto() {
  const randomId = Date.now()
  form.photos.push(`https://picsum.photos/400/300?random=${randomId}`)
}

function removePhoto(index: number) {
  form.photos.splice(index, 1)
}

function getScoreColor(score: number): string {
  const percentage = maxTotalScore.value > 0 ? (score / maxTotalScore.value) * 100 : 0
  if (percentage >= 90) return 'text-green-600'
  if (percentage >= 80) return 'text-blue-600'
  if (percentage >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreBgColor(score: number): string {
  const percentage = maxTotalScore.value > 0 ? (score / maxTotalScore.value) * 100 : 0
  if (percentage >= 90) return 'bg-green-500'
  if (percentage >= 80) return 'bg-blue-500'
  if (percentage >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

async function handleSubmit() {
  if (!isFormValid.value) return
  
  submitting.value = true
  
  try {
    const rectificationRequired = hasFailedItems.value
    
    const inspectionData = {
      projectId: form.projectId,
      inspectorId: authStore.currentUser?.id || '',
      date: form.date,
      score: totalScore.value,
      items: form.items.map(item => ({
        name: item.name,
        score: item.score,
        maxScore: item.maxScore,
        passed: item.passed,
        note: item.note
      })),
      overallStatus: overallStatus.value,
      photos: [...form.photos],
      rectificationRequired,
      rectificationDeadline: rectificationRequired ? form.rectificationDeadline : null,
      note: form.note
    }
    
    const newInspection = await dataStore.createInspection(inspectionData)
    
    if (form.assigneeId && rectificationRequired) {
      const rect = dataStore.rectifications.find(r => r.inspectionId === newInspection.id)
      if (rect) {
        await dataStore.assignRectification(rect.id, form.assigneeId)
      }
    }
    
    router.push('/quality')
  } catch (error) {
    console.error('提交质检失败:', error)
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  router.push('/quality')
}
</script>
