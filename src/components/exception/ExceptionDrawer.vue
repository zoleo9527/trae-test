<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useExceptionStore } from '@/stores/exception'
import { useAppStore } from '@/stores/app'
import StatusTag from '@/components/common/StatusTag.vue'
import PriorityTag from '@/components/common/PriorityTag.vue'
import { X, User, Clock, MessageSquare, CheckCircle, Archive, ExternalLink } from 'lucide-vue-next'

const router = useRouter()

const exceptionStore = useExceptionStore()
const appStore = useAppStore()

const newRemark = ref('')
const showAddRemark = ref(false)
const showResolveForm = ref(false)
const resolveRemark = ref('')

const exceptionTypeLabels: Record<string, string> = {
  overdue: '展品逾期',
  mismatch: '核销不符',
  low_checkin: '签到异常',
  location_mismatch: '位置不符',
  schedule_conflict: '进度冲突'
}

const canClaim = computed(() => {
  const exception = exceptionStore.currentException
  if (!exception) return false
  if (exception.status !== 'pending') return false
  return appStore.currentRole === 'executor' || appStore.currentRole === 'manager'
})

const canResolve = computed(() => {
  const exception = exceptionStore.currentException
  if (!exception) return false
  if (exception.status !== 'processing') return false
  if (appStore.currentRole === 'manager') return true
  if (appStore.currentRole === 'executor') {
    if (!exception.handler) return true
    if (exception.handler.startsWith(appStore.roleNames[appStore.currentRole])) return true
  }
  return false
})

const canAddRemark = computed(() => {
  const exception = exceptionStore.currentException
  if (!exception) return false
  if (exception.status === 'closed') return false
  return appStore.currentRole === 'executor' || appStore.currentRole === 'manager'
})

const canClose = computed(() => {
  const exception = exceptionStore.currentException
  if (!exception) return false
  if (exception.status !== 'resolved') return false
  return appStore.currentRole === 'manager'
})

const claimException = () => {
  if (exceptionStore.currentException) {
    exceptionStore.claimException(
      exceptionStore.currentException.id,
      appStore.roleNames[appStore.currentRole]
    )
  }
}

const resolveException = () => {
  if (exceptionStore.currentException && resolveRemark.value.trim()) {
    exceptionStore.resolveException(
      exceptionStore.currentException.id,
      appStore.roleNames[appStore.currentRole],
      resolveRemark.value
    )
    resolveRemark.value = ''
    showResolveForm.value = false
  }
}

const addRemark = () => {
  if (exceptionStore.currentException && newRemark.value.trim()) {
    exceptionStore.addHandleRecord(
      exceptionStore.currentException.id,
      appStore.roleNames[appStore.currentRole],
      '添加备注',
      newRemark.value
    )
    newRemark.value = ''
    showAddRemark.value = false
  }
}

const closeException = () => {
  if (exceptionStore.currentException) {
    exceptionStore.closeException(
      exceptionStore.currentException.id,
      appStore.roleNames[appStore.currentRole],
      '异常已解决，归档关闭'
    )
  }
}

const cancelResolve = () => {
  resolveRemark.value = ''
  showResolveForm.value = false
}

const goToRelatedOrder = () => {
  const exception = exceptionStore.currentException
  if (!exception) return
  
  exceptionStore.closeDrawer()
  
  if (exception.relatedOrderType === 'borrow') {
    router.push('/borrow')
  } else if (exception.relatedOrderType === 'ticket') {
    router.push('/ticket')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div 
        v-if="exceptionStore.drawerVisible && exceptionStore.currentException"
        class="fixed inset-0 z-50 flex justify-end"
      >
        <div 
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="exceptionStore.closeDrawer"
        ></div>
        
        <div class="relative w-full max-w-xl bg-white shadow-2xl animate-slide-in-right flex flex-col h-full">
          <div class="flex items-center justify-between p-6 border-b border-museum-gray-200">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm text-museum-gray-500 font-mono">
                  {{ exceptionStore.currentException.exceptionNo }}
                </span>
                <StatusTag 
                  :status="exceptionStore.currentException.status" 
                  type="exception" 
                />
                <PriorityTag :priority="exceptionStore.currentException.priority" />
              </div>
              <h2 class="text-lg font-semibold text-museum-gray-800 font-serif truncate">
                {{ exceptionStore.currentException.title }}
              </h2>
            </div>
            <button 
              @click="exceptionStore.closeDrawer"
              class="ml-4 p-2 rounded-lg hover:bg-museum-gray-100 transition-colors flex-shrink-0"
            >
              <X class="w-5 h-5 text-museum-gray-500" />
            </button>
          </div>

          <div class="flex-1 overflow-auto p-6 space-y-6">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-museum-gray-500 mb-2 block">异常类型</label>
                <span class="inline-flex items-center px-3 py-1.5 rounded-lg bg-museum-dark/5 text-museum-dark">
                  {{ exceptionTypeLabels[exceptionStore.currentException.type] }}
                </span>
              </div>

              <div>
                <label class="text-sm font-medium text-museum-gray-500 mb-2 block">异常描述</label>
                <div class="p-4 bg-museum-gray-50 rounded-lg border border-museum-gray-200">
                  <p class="text-sm text-museum-gray-700 leading-relaxed">
                    {{ exceptionStore.currentException.description }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-museum-gray-500 mb-2 block flex items-center gap-1">
                    <User class="w-4 h-4" />
                    上报人
                  </label>
                  <p class="text-museum-gray-800">{{ exceptionStore.currentException.reporter }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-museum-gray-500 mb-2 block flex items-center gap-1">
                    <Clock class="w-4 h-4" />
                    上报时间
                  </label>
                  <p class="text-museum-gray-800">{{ exceptionStore.currentException.reportTime }}</p>
                </div>
                <div v-if="exceptionStore.currentException.handler">
                  <label class="text-sm font-medium text-museum-gray-500 mb-2 block">处理人</label>
                  <p class="text-museum-gray-800">{{ exceptionStore.currentException.handler }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-museum-gray-500 mb-2 block">关联单据</label>
                  <button 
                    @click="goToRelatedOrder"
                    class="inline-flex items-center gap-1 text-museum-gold hover:underline text-sm"
                  >
                    {{ exceptionStore.currentException.relatedOrderNo }}
                    <ExternalLink class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div class="border-t border-museum-gray-200 pt-6">
              <h3 class="text-sm font-semibold text-museum-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare class="w-4 h-4" />
                处理记录
              </h3>
              
              <div v-if="exceptionStore.currentException.handleRecords.length > 0" class="relative">
                <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-museum-gray-200"></div>
                
                <div class="space-y-6">
                  <div 
                    v-for="(record, index) in exceptionStore.currentException.handleRecords"
                    :key="record.id"
                    class="relative pl-8"
                  >
                    <div class="absolute left-0 w-6 h-6 rounded-full bg-museum-gold border-4 border-white shadow flex items-center justify-center">
                      <div class="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    
                    <div class="bg-museum-gray-50 rounded-lg p-4 border border-museum-gray-100">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-museum-gray-800">
                          {{ record.action }}
                        </span>
                        <span class="text-xs text-museum-gray-500">{{ record.operateTime }}</span>
                      </div>
                      <p class="text-sm text-museum-gray-600">{{ record.remark }}</p>
                      <p class="text-xs text-museum-gray-400 mt-2">— {{ record.operator }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8 text-museum-gray-400">
                <p class="text-sm">暂无处理记录</p>
              </div>
            </div>

            <div v-if="showAddRemark" class="border-t border-museum-gray-200 pt-6">
              <h3 class="text-sm font-semibold text-museum-gray-800 mb-3">添加处理备注</h3>
              <textarea
                v-model="newRemark"
                class="w-full px-4 py-3 border border-museum-gray-300 rounded-lg focus:ring-2 focus:ring-museum-gold/50 focus:border-museum-gold transition-all resize-none"
                rows="3"
                placeholder="请输入处理备注..."
              ></textarea>
              <div class="flex justify-end gap-2 mt-3">
                <button 
                  @click="showAddRemark = false; newRemark = ''"
                  class="px-4 py-2 text-sm text-museum-gray-600 hover:bg-museum-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  @click="addRemark"
                  :disabled="!newRemark.trim()"
                  class="px-4 py-2 text-sm bg-museum-dark text-white rounded-lg hover:bg-museum-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加备注
                </button>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-museum-gray-200 space-y-3">
            <div v-if="showResolveForm" class="p-4 bg-museum-gray-50 rounded-lg border border-museum-gray-200">
              <h4 class="text-sm font-medium text-museum-gray-800 mb-3">确认解决异常</h4>
              <textarea
                v-model="resolveRemark"
                class="w-full px-4 py-3 border border-museum-gray-300 rounded-lg focus:ring-2 focus:ring-museum-gold/50 focus:border-museum-gold transition-all resize-none text-sm"
                rows="3"
                placeholder="请描述解决情况..."
              ></textarea>
              <div class="flex justify-end gap-2 mt-3">
                <button 
                  @click="cancelResolve"
                  class="px-4 py-2 text-sm text-museum-gray-600 hover:bg-museum-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  @click="resolveException"
                  :disabled="!resolveRemark.trim()"
                  class="px-4 py-2 text-sm bg-museum-green text-white rounded-lg hover:bg-museum-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认解决
                </button>
              </div>
            </div>

            <div class="flex gap-3">
              <button 
                v-if="canClaim"
                @click="claimException"
                class="flex-1 px-4 py-3 bg-museum-dark text-white rounded-lg hover:bg-museum-darker transition-colors font-medium flex items-center justify-center gap-2"
              >
                <User class="w-4 h-4" />
                领取处理
              </button>
              
              <button 
                v-if="canResolve && !showResolveForm"
                @click="showResolveForm = true"
                class="flex-1 px-4 py-3 bg-museum-green text-white rounded-lg hover:bg-museum-green/90 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle class="w-4 h-4" />
                标记解决
              </button>

              <button 
                v-if="canAddRemark && !showAddRemark && !showResolveForm"
                @click="showAddRemark = true"
                class="px-4 py-3 border border-museum-gray-300 text-museum-gray-700 rounded-lg hover:bg-museum-gray-50 transition-colors"
              >
                <MessageSquare class="w-4 h-4" />
              </button>
            </div>
            
            <button 
              v-if="canClose"
              @click="closeException"
              class="w-full px-4 py-3 border border-museum-gray-300 text-museum-gray-600 rounded-lg hover:bg-museum-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Archive class="w-4 h-4" />
              关闭归档
            </button>

            <p v-if="exceptionStore.currentException?.status === 'resolved' && !canClose" class="text-xs text-center text-museum-gray-400">
              待馆务经理确认后关闭归档
            </p>
            <p v-if="exceptionStore.currentException?.status === 'processing' && !canResolve && !canClaim" class="text-xs text-center text-museum-gray-400">
              当前异常已由 {{ exceptionStore.currentException?.handler }} 认领处理
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
</style>
