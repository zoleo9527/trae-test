<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">打卡详情</h3>
        <button @click="$emit('close')" class="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="punch" class="flex-1 overflow-y-auto p-6">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-primary-600 font-semibold">{{ staffName.charAt(0) }}</span>
            </div>
            <div>
              <h4 class="font-medium text-gray-900">{{ staffName }}</h4>
              <p class="text-sm text-gray-500">{{ projectName }}</p>
            </div>
          </div>
          <span
            :class="[
              'px-3 py-1 text-sm font-medium rounded-full',
              statusClass
            ]"
          >
            {{ getStatusText(punch.status) }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-500 mb-1">上班打卡</p>
            <p class="text-xl font-semibold text-gray-900">{{ punch.checkInTime || '--:--' }}</p>
            <p class="text-xs text-gray-400 mt-1">应到: {{ schedule?.startTime || '--:--' }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-500 mb-1">下班打卡</p>
            <p class="text-xl font-semibold text-gray-900">{{ punch.checkOutTime || '--:--' }}</p>
            <p class="text-xs text-gray-400 mt-1">应退: {{ schedule?.endTime || '--:--' }}</p>
          </div>
        </div>

        <div class="space-y-4 mb-6">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-sm text-gray-600">{{ punch.date }}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span
                :class="[
                  'text-sm',
                  punch.locationVerified ? 'text-green-600' : 'text-red-600'
                ]"
              >
                {{ punch.locationVerified ? '位置验证通过' : '位置验证失败' }}
              </span>
            </div>
          </div>

          <div v-if="punch.note" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-yellow-800">{{ punch.note }}</p>
          </div>
        </div>

        <div v-if="punch.checkInPhoto || punch.checkOutPhoto" class="mb-6">
          <h5 class="text-sm font-medium text-gray-700 mb-3">打卡照片</h5>
          <div class="grid grid-cols-2 gap-4">
            <div v-if="punch.checkInPhoto" class="relative">
              <p class="text-xs text-gray-500 mb-1">上班打卡照片</p>
              <img
                :src="punch.checkInPhoto"
                alt="上班打卡照片"
                class="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
            <div v-if="punch.checkOutPhoto" class="relative">
              <p class="text-xs text-gray-500 mb-1">下班打卡照片</p>
              <img
                :src="punch.checkOutPhoto"
                alt="下班打卡照片"
                class="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
          </div>
        </div>

        <div v-if="relatedAlert" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p class="text-sm font-medium text-red-800">关联预警</p>
              <p class="text-sm text-red-600">{{ relatedAlert.title }}</p>
              <p class="text-xs text-red-500 mt-1">{{ getAlertTypeText(relatedAlert.type) }} · {{ getSeverityText(relatedAlert.severity) }}</p>
            </div>
          </div>
        </div>

        <div v-if="canSupplement && !showSupplementForm" class="border-t border-gray-200 pt-4">
          <button
            @click="showSupplementForm = true"
            class="w-full py-2 px-4 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            人工补卡
          </button>
        </div>

        <div v-if="showSupplementForm" class="border-t border-gray-200 pt-4">
          <h5 class="text-sm font-medium text-gray-700 mb-3">人工补卡</h5>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">上班打卡时间</label>
                <input
                  v-model="supplementForm.checkInTime"
                  type="time"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">下班打卡时间</label>
                <input
                  v-model="supplementForm.checkOutTime"
                  type="time"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">补卡说明</label>
              <textarea
                v-model="supplementForm.note"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                placeholder="请填写补卡原因..."
              ></textarea>
            </div>
            <div class="flex gap-2">
              <button
                @click="showSupplementForm = false"
                class="flex-1 py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                @click="handleSupplement"
                :disabled="submitting"
                class="flex-1 py-2 px-4 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {{ submitting ? '提交中...' : '确认补卡' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PunchRecord } from '~/types'

interface Props {
  visible: boolean
  punch: PunchRecord | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const dataStore = useDataStore()
const authStore = useAuthStore()

const showSupplementForm = ref(false)
const submitting = ref(false)

const supplementForm = ref({
  checkInTime: '',
  checkOutTime: '',
  note: ''
})

const canSupplement = computed(() => {
  return authStore.isProjectManager && props.punch?.status !== 'normal'
})

const staffName = computed(() => {
  if (!props.punch) return ''
  const staff = dataStore.getStaffById(props.punch.staffId)
  return staff?.name || '未知员工'
})

const projectName = computed(() => {
  if (!props.punch) return ''
  const project = dataStore.getProjectById(props.punch.projectId)
  return project?.name || '未知项目'
})

const schedule = computed(() => {
  if (!props.punch) return null
  return dataStore.schedules.find(s => s.id === props.punch!.scheduleId)
})

const relatedAlert = computed(() => {
  if (!props.punch) return null
  return dataStore.alerts.find(a => 
    a.relatedId === props.punch!.id && a.relatedType === 'punch'
  )
})

const statusClass = computed(() => {
  if (!props.punch) return ''
  const status = props.punch.status
  const classes: Record<string, string> = {
    normal: 'bg-green-100 text-green-700',
    late: 'bg-yellow-100 text-yellow-700',
    early_leave: 'bg-yellow-100 text-yellow-700',
    absent: 'bg-red-100 text-red-700',
    pending: 'bg-gray-100 text-gray-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
})

const getSeverityText = (severity: string) => {
  const texts: Record<string, string> = {
    info: '提示',
    warning: '警告',
    critical: '严重'
  }
  return texts[severity] || severity
}

const handleSupplement = async () => {
  if (!props.punch || !authStore.currentUser) return
  
  submitting.value = true
  try {
    await dataStore.supplementPunch(
      props.punch.id,
      authStore.currentUser.id,
      supplementForm.value.checkInTime || undefined,
      supplementForm.value.checkOutTime || undefined,
      supplementForm.value.note || undefined
    )
    showSupplementForm.value = false
    supplementForm.value = { checkInTime: '', checkOutTime: '', note: '' }
    emit('updated')
  } catch (error) {
    console.error('补卡失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>
