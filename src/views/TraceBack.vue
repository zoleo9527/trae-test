<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTraceStore } from '@/stores/trace'
import { useExceptionStore } from '@/stores/exception'
import StatusTag from '@/components/common/StatusTag.vue'
import { Search, Filter, Clock, User, FileText, ChevronRight, AlertCircle, ExternalLink } from 'lucide-vue-next'

const router = useRouter()
const traceStore = useTraceStore()
const exceptionStore = useExceptionStore()

const searchKeyword = ref('')
const moduleFilter = ref<string>('all')

const modules = [
  { value: 'all', label: '全部模块' },
  { value: '展品借调', label: '展品借调' },
  { value: '票务核销', label: '票务核销' },
  { value: '异常管理', label: '异常管理' }
]

const filteredLogs = computed(() => {
  let logs = traceStore.sortedLogs
  
  if (moduleFilter.value !== 'all') {
    logs = logs.filter(log => log.module === moduleFilter.value)
  }
  
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    logs = logs.filter(log => 
      log.action.toLowerCase().includes(kw) ||
      log.operator.toLowerCase().includes(kw) ||
      log.targetId.includes(kw) ||
      (log.afterChange && log.afterChange.toLowerCase().includes(kw))
    )
  }
  
  return logs
})

const viewRelatedException = (targetId: string) => {
  const exception = exceptionStore.exceptions.find(e => e.id === targetId)
  if (exception) {
    exceptionStore.openDrawer(exception.id)
  }
}

const goToBorrowOrder = (orderNo: string) => {
  router.push({
    path: '/borrow',
    query: { orderNo, highlight: 'true' }
  })
}

const goToTicketOrder = (orderNo: string) => {
  router.push({
    path: '/ticket',
    query: { orderNo, highlight: 'true' }
  })
}

const getTargetLink = (log: { targetType: string; targetId: string; action: string }) => {
  if (log.targetType === 'exception' && log.action !== '异常触发') {
    return true
  }
  return false
}

const getLinkType = (log: { targetType: string; targetId: string }) => {
  if (log.targetType === 'exception') return 'exception'
  if (log.targetType === 'borrow') return 'borrow'
  if (log.targetType === 'ticket') return 'ticket'
  return null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="relative flex-1 max-w-lg w-full">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-museum-gray-400" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索操作记录、操作人员、单据号..."
          class="w-full pl-10 pr-4 py-2.5 border border-museum-gray-300 rounded-lg focus:ring-2 focus:ring-museum-gold/50 focus:border-museum-gold transition-all"
        />
      </div>
      
      <div class="flex items-center gap-3">
        <select
          v-model="moduleFilter"
          class="px-4 py-2.5 border border-museum-gray-300 rounded-lg focus:ring-2 focus:ring-museum-gold/50 focus:border-museum-gold transition-all bg-white text-sm"
        >
          <option v-for="mod in modules" :key="mod.value" :value="mod.value">
            {{ mod.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-museum overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-museum-gray-50 border-b border-museum-gray-200">
            <tr>
              <th class="text-left px-6 py-4 text-sm font-semibold text-museum-gray-700">时间</th>
              <th class="text-left px-6 py-4 text-sm font-semibold text-museum-gray-700">模块</th>
              <th class="text-left px-6 py-4 text-sm font-semibold text-museum-gray-700">操作</th>
              <th class="text-left px-6 py-4 text-sm font-semibold text-museum-gray-700">操作人员</th>
              <th class="text-left px-6 py-4 text-sm font-semibold text-museum-gray-700">目标单据</th>
              <th class="text-left px-6 py-4 text-sm font-semibold text-museum-gray-700">变更详情</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-museum-gray-100">
            <tr 
              v-for="log in filteredLogs"
              :key="log.id"
              class="hover:bg-museum-gray-50/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-2 text-sm text-museum-gray-600">
                  <Clock class="w-4 h-4 text-museum-gray-400" />
                  {{ log.operateTime }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-museum-dark/5 text-museum-dark">
                  <FileText class="w-3 h-3 mr-1.5" />
                  {{ log.module }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span 
                  class="text-sm font-medium"
                  :class="{
                    'text-museum-coral': log.action.includes('异常') || log.action.includes('触发'),
                    'text-museum-green': log.action.includes('解决') || log.action.includes('完成'),
                    'text-museum-gray-800': true
                  }"
                >
                  {{ log.action }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2 text-sm text-museum-gray-700">
                  <User class="w-4 h-4 text-museum-gray-400" />
                  {{ log.operator }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1">
                  <span class="text-sm font-mono text-museum-gray-600">{{ log.targetId }}</span>
                  <button 
                    v-if="getLinkType(log) === 'exception'"
                    class="inline-flex items-center text-museum-gold hover:underline"
                    @click="viewRelatedException(log.targetId)"
                    title="查看异常"
                  >
                    <ChevronRight class="w-4 h-4" />
                  </button>
                  <button 
                    v-else-if="getLinkType(log) === 'borrow'"
                    class="inline-flex items-center text-museum-gold hover:underline"
                    @click="goToBorrowOrder(log.targetId)"
                    title="查看借调单"
                  >
                    <ExternalLink class="w-4 h-4" />
                  </button>
                  <button 
                    v-else-if="getLinkType(log) === 'ticket'"
                    class="inline-flex items-center text-museum-gold hover:underline"
                    @click="goToTicketOrder(log.targetId)"
                    title="查看票务单"
                  >
                    <ExternalLink class="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 max-w-xs">
                <div v-if="log.beforeChange || log.afterChange" class="text-sm">
                  <div v-if="log.beforeChange" class="text-museum-gray-500 line-through text-xs mb-1">
                    {{ log.beforeChange }}
                  </div>
                  <div v-if="log.afterChange" class="text-museum-gray-700">
                    {{ log.afterChange }}
                  </div>
                </div>
                <span v-else class="text-sm text-museum-gray-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredLogs.length === 0" class="text-center py-16">
        <AlertCircle class="w-12 h-12 mx-auto mb-3 text-museum-gray-300" />
        <p class="text-museum-gray-500">暂无匹配的操作记录</p>
      </div>
    </div>

    <div class="bg-museum-gold/5 rounded-xl p-5 border border-museum-gold/20">
      <h4 class="font-semibold text-museum-dark mb-2 flex items-center gap-2">
        <AlertCircle class="w-5 h-5" />
        追溯说明
      </h4>
      <ul class="text-sm text-museum-gray-600 space-y-1">
        <li>• 所有操作记录自动留存，不可篡改或删除</li>
        <li>• 异常处理全链路可追溯，包括上报、领取、处理、解决各节点</li>
        <li>• 点击异常记录右侧箭头可直接跳转至异常处理详情</li>
        <li>• 支持按模块、关键词等多维度筛选查询</li>
      </ul>
    </div>
  </div>
</template>
