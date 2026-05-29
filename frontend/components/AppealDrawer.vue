<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="drawer-overlay" @click="handleClose"></div>
    </Transition>
    <Transition name="slide">
      <div v-if="visible" class="drawer-content open">
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">申诉详情</h2>
            <p class="text-sm text-gray-500">订单号: {{ appeal?.order_no }}</p>
          </div>
          <button @click="handleClose" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p class="text-gray-500 mt-2">加载中...</p>
        </div>

        <div v-else-if="appeal" class="p-6 space-y-6">
          <div class="bg-gray-50 rounded-xl p-4">
            <h3 class="font-medium text-gray-900 mb-3 flex items-center">
              <svg class="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              基本信息
            </h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">商家名称</span>
                <p class="font-medium text-gray-900 mt-1">{{ appeal.merchant_name }}</p>
              </div>
              <div>
                <span class="text-gray-500">申诉类型</span>
                <p class="font-medium text-gray-900 mt-1">{{ getAppealTypeText(appeal.type) }}</p>
              </div>
              <div>
                <span class="text-gray-500">申诉原因</span>
                <p class="font-medium text-gray-900 mt-1">{{ appeal.reason }}</p>
              </div>
              <div>
                <span class="text-gray-500">当前状态</span>
                <p class="mt-1">
                  <span :class="`status-badge status-${appeal.status}`">{{ getStatusText(appeal.status) }}</span>
                </p>
              </div>
              <div class="col-span-2">
                <span class="text-gray-500">申诉时间</span>
                <p class="font-medium text-gray-900 mt-1">{{ formatDate(appeal.created_at) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-blue-50 rounded-xl p-4">
            <h3 class="font-medium text-gray-900 mb-3 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              申诉描述
            </h3>
            <p class="text-sm text-gray-700 leading-relaxed">{{ appeal.description }}</p>
          </div>

          <div v-if="appeal.screenshot_urls && appeal.screenshot_urls.length > 0" class="bg-yellow-50 rounded-xl p-4">
            <h3 class="font-medium text-gray-900 mb-3 flex items-center">
              <svg class="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              申诉截图
            </h3>
            <div class="grid grid-cols-3 gap-3">
              <div v-for="(url, index) in appeal.screenshot_urls" :key="index" class="relative group">
                <div class="aspect-square bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span class="absolute bottom-2 left-2 text-xs text-gray-500">截图{{ index + 1 }}</span>
              </div>
            </div>
          </div>

          <div v-if="appeal.status !== 'pending'" class="bg-green-50 rounded-xl p-4">
            <h3 class="font-medium text-gray-900 mb-3 flex items-center">
              <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              处理记录
            </h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">处理人</span>
                <span class="font-medium text-gray-900">{{ appeal.processor }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">处理时间</span>
                <span class="font-medium text-gray-900">{{ appeal.processed_at ? formatDate(appeal.processed_at) : '-' }}</span>
              </div>
              <div>
                <span class="text-gray-500">处理备注</span>
                <p class="font-medium text-gray-900 mt-1">{{ appeal.process_note }}</p>
              </div>
              <div v-if="appeal.subsidy_amount" class="flex justify-between">
                <span class="text-gray-500">补贴金额</span>
                <span class="font-medium text-green-600">¥{{ appeal.subsidy_amount }}</span>
              </div>
            </div>
          </div>

          <div class="bg-purple-50 rounded-xl p-4">
            <h3 class="font-medium text-gray-900 mb-3 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              操作留痕
            </h3>
            <div v-if="operationLogs.length > 0" class="space-y-3">
              <div v-for="log in operationLogs" :key="log.id" class="flex text-sm">
                <div class="flex-shrink-0 w-20 text-gray-500">{{ formatTime(log.created_at) }}</div>
                <div class="flex-1">
                  <span class="font-medium text-gray-900">{{ log.operator }}</span>
                  <span class="text-gray-500">（{{ log.operator_role }}）</span>
                  <span class="text-gray-700 ml-2">{{ log.description }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500">
              暂无操作记录
            </div>
          </div>

          <div v-if="appeal.status === 'pending' || appeal.status === 'need_review'" class="bg-white border-2 border-gray-200 rounded-xl p-4">
            <h3 class="font-medium text-gray-900 mb-4">处理申诉</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">处理结果</label>
                <div class="grid grid-cols-3 gap-3">
                  <button 
                    @click="processStatus = 'approved'"
                    :class="['px-4 py-2 rounded-lg text-sm font-medium transition-colors', processStatus === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                  >
                    通过
                  </button>
                  <button 
                    @click="processStatus = 'rejected'"
                    :class="['px-4 py-2 rounded-lg text-sm font-medium transition-colors', processStatus === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                  >
                    驳回
                  </button>
                  <button 
                    @click="processStatus = 'need_review'"
                    :class="['px-4 py-2 rounded-lg text-sm font-medium transition-colors', processStatus === 'need_review' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                  >
                    需回查
                  </button>
                </div>
              </div>

              <div v-if="processStatus === 'approved'">
                <label class="block text-sm font-medium text-gray-700 mb-2">补贴金额（元）</label>
                <input 
                  v-model="subsidyAmount" 
                  type="number" 
                  step="0.01"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入补贴金额"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">处理备注</label>
                <textarea 
                  v-model="processNote" 
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="请输入处理备注，说明处理理由..."
                ></textarea>
              </div>

              <div class="flex space-x-3">
                <button 
                  @click="processAppeal"
                  :disabled="!processStatus || !processNote || processing"
                  class="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <svg v-if="processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ processing ? '处理中...' : '确认处理' }}
                </button>
                <button 
                  @click="handleClose"
                  class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Appeal, OperationLog } from '~/types'

const props = defineProps<{
  appealId: string
}>()

const emit = defineEmits<{
  close: []
  processed: []
}>()

const visible = ref(false)
const loading = ref(false)
const processing = ref(false)
const appeal = ref<Appeal | null>(null)
const operationLogs = ref<OperationLog[]>([])
const processStatus = ref('')
const processNote = ref('')
const subsidyAmount = ref<number | null>(null)

const { get, post } = useApi()

const loadAppeal = async () => {
  if (!props.appealId) return
  
  loading.value = true
  try {
    appeal.value = await get<Appeal>(`/appeals/${props.appealId}`)
    const logsData = await get<any>(`/operation-logs?appeal_id=${props.appealId}`)
    operationLogs.value = logsData.data
  } catch (error) {
    console.error('Failed to load appeal:', error)
  } finally {
    loading.value = false
  }
}

const processAppeal = async () => {
  if (!processStatus.value || !processNote.value) return
  
  if (processStatus.value === 'approved' && (!subsidyAmount.value || subsidyAmount.value <= 0)) {
    alert('请输入有效的补贴金额')
    return
  }
  
  processing.value = true
  try {
    await post(`/appeals/${props.appealId}/process`, {
      status: processStatus.value,
      process_note: processNote.value,
      subsidy_amount: processStatus.value === 'approved' ? Number(subsidyAmount.value) : undefined
    })
    emit('processed')
    handleClose()
  } catch (error) {
    console.error('Failed to process appeal:', error)
    alert('处理失败，请重试')
  } finally {
    processing.value = false
  }
}

const handleClose = () => {
  visible.value = false
  setTimeout(() => {
    appeal.value = null
    operationLogs.value = []
    processStatus.value = ''
    processNote.value = ''
    subsidyAmount.value = null
  }, 300)
}

const getAppealTypeText = (type: string) => {
  const types: Record<string, string> = {
    subsidy: '补贴申请',
    refund: '退款申请',
    other: '其他'
  }
  return types[type] || type
}

const getStatusText = (status: string) => {
  const statuses: Record<string, string> = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已驳回',
    need_review: '需回查'
  }
  return statuses[status] || status
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const lastAppealId = ref('')

watch(() => props.appealId, (newId) => {
  if (newId) {
    if (newId === lastAppealId.value && !visible.value) {
      visible.value = true
      loadAppeal()
    } else if (newId !== lastAppealId.value) {
      visible.value = true
      loadAppeal()
    }
    lastAppealId.value = newId
  }
}, { immediate: true })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
