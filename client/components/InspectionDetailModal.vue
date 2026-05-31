<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      @click.self="handleClose"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900">质检详情</h2>
            <p class="text-sm text-gray-500 mt-1">{{ projectName }} · {{ inspection?.date }}</p>
          </div>
          <button
            @click="handleClose"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="inspection" class="flex-1 overflow-y-auto p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="space-y-4">
              <div>
                <p class="text-sm text-gray-500">质检员</p>
                <p class="font-medium text-gray-900">{{ inspectorName }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">总体评分</p>
                <div class="flex items-end gap-2">
                  <span class="text-4xl font-bold" :class="getScoreColor(inspection.score)">{{ inspection.score }}</span>
                  <span class="text-gray-400 mb-1">/ 100</span>
                </div>
              </div>
              <div>
                <p class="text-sm text-gray-500">总体评价</p>
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1"
                  :class="getOverallStatusColor(inspection.overallStatus)"
                >
                  {{ getOverallStatusText(inspection.overallStatus) }}
                </span>
              </div>
            </div>

            <div class="space-y-4">
              <div v-if="inspection.rectificationRequired">
                <p class="text-sm text-gray-500">整改要求</p>
                <div class="mt-1 p-3 bg-red-50 rounded-lg border border-red-100">
                  <div class="flex items-center gap-2 text-red-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span class="font-medium">需要整改</span>
                  </div>
                  <p class="text-sm text-red-600 mt-1">截止日期：{{ inspection.rectificationDeadline }}</p>
                </div>
              </div>
              <div>
                <p class="text-sm text-gray-500">备注</p>
                <p class="text-gray-900 mt-1">{{ inspection.note || '无' }}</p>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">分项评分</h3>
            <div class="space-y-3">
              <div
                v-for="(item, index) in inspection.items"
                :key="index"
                class="p-4 rounded-xl border transition-colors"
                :class="item.passed ? 'bg-gray-50 border-gray-100' : 'bg-red-50 border-red-100'"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium text-gray-900">{{ item.name }}</h4>
                      <span
                        v-if="!item.passed"
                        class="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700"
                      >
                        不合格
                      </span>
                    </div>
                    <p v-if="item.note" class="text-sm text-gray-500 mt-1">{{ item.note }}</p>
                  </div>
                  <div class="text-right ml-4">
                    <span class="text-2xl font-bold" :class="item.passed ? 'text-green-600' : 'text-red-600'">
                      {{ item.score }}
                    </span>
                    <span class="text-gray-400"> / {{ item.maxScore }}</span>
                  </div>
                </div>
                <div class="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="item.passed ? 'bg-green-500' : 'bg-red-500'"
                    :style="{ width: `${(item.score / item.maxScore) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="inspection.photos.length > 0">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">质检照片</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div
                v-for="(photo, index) in inspection.photos"
                :key="index"
                class="aspect-video rounded-lg overflow-hidden bg-gray-100"
              >
                <img :src="photo" :alt="`质检照片 ${index + 1}`" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            @click="handleClose"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            关闭
          </button>
          <button
            v-if="canViewRectification && inspection?.rectificationRequired"
            @click="handleViewRectification"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            查看整改
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '~/stores/data'
import { useAuthStore } from '~/stores/auth'
import {
  getOverallStatusText,
  getOverallStatusColor
} from '~/utils/formatters'
import type { QualityInspection } from '~/types'

interface Props {
  visible: boolean
  inspection: QualityInspection | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  viewRectification: [inspectionId: string]
}>()

const dataStore = useDataStore()
const authStore = useAuthStore()

const projectName = computed(() => {
  if (!props.inspection) return ''
  const project = dataStore.getProjectById(props.inspection.projectId)
  return project?.name || '未知项目'
})

const inspectorName = computed(() => {
  if (!props.inspection) return ''
  const user = dataStore.staff.find(s => s.id === props.inspection!.inspectorId) || 
               dataStore.staff.find(s => s.id === props.inspection!.inspectorId)
  return user?.name || '未知质检员'
})

const canViewRectification = computed(() => {
  return authStore.hasPermission(['project_manager', 'quality_inspector'])
})

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function handleClose() {
  emit('close')
}

function handleViewRectification() {
  if (props.inspection) {
    emit('viewRectification', props.inspection.id)
  }
}
</script>
