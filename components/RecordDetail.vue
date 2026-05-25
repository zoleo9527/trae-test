<template>
  <div class="w-96 card p-0 overflow-hidden flex flex-col">
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <h2 class="font-semibold text-gray-900">记录详情</h2>
      <button @click="$emit('close')" class="p-1 hover:bg-gray-100 rounded-lg transition-colors">
        <Icon name="lucide:x" class="w-5 h-5 text-gray-500" />
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 space-y-6">
        <div class="flex items-start gap-3">
          <div 
            class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="record.type === 'restock' ? 'bg-blue-100' : 'bg-orange-100'"
          >
            <Icon 
              :name="record.type === 'restock' ? 'lucide:package' : 'lucide:trash-2'" 
              class="w-6 h-6"
              :class="record.type === 'restock' ? 'text-blue-600' : 'text-orange-600'"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900 truncate">{{ record.productName }}</h3>
              <Badge :status="record.status" />
            </div>
            <p class="text-sm text-gray-500">{{ record.productSku }}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-500">数量</p>
            <p class="font-medium text-gray-900 mt-1">{{ record.quantity }}{{ getProductUnit(record.productId) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">优先级</p>
            <p class="font-medium text-gray-900 mt-1">{{ priorityText[record.priority] }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">位置</p>
            <p class="font-medium text-gray-900 mt-1">{{ record.location }}</p>
          </div>
          <div v-if="record.supplier">
            <p class="text-xs text-gray-500">供应商</p>
            <p class="font-medium text-gray-900 mt-1">{{ record.supplier }}</p>
          </div>
          <div v-if="record.lossReason">
            <p class="text-xs text-gray-500">损耗原因</p>
            <p class="font-medium text-gray-900 mt-1">{{ lossReasonText[record.lossReason] || record.lossReason }}</p>
          </div>
          <div v-if="record.expectedDate">
            <p class="text-xs text-gray-500">预计日期</p>
            <p class="font-medium text-gray-900 mt-1">{{ formatDate(record.expectedDate) }}</p>
          </div>
        </div>
        
        <div v-if="record.remark">
          <p class="text-xs text-gray-500">备注</p>
          <p class="text-sm text-gray-700 mt-1">{{ record.remark }}</p>
        </div>
        
        <div v-if="record.relatedEvent || record.relatedTicketOrder" class="space-y-2">
          <p class="text-xs text-gray-500">关联信息</p>
          <div v-if="record.relatedEvent" class="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
            <Icon name="lucide:calendar" class="w-4 h-4" />
            {{ record.relatedEvent }}
          </div>
          <div v-if="record.relatedTicketOrder" class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm ml-2">
            <Icon name="lucide:ticket" class="w-4 h-4" />
            {{ record.relatedTicketOrder }}
          </div>
        </div>
        
        <div class="border-t border-gray-100 pt-4">
          <p class="text-xs text-gray-500 mb-3">处理人</p>
          <div class="flex items-center gap-3">
            <img :src="getHandlerAvatar(record.currentHandler)" :alt="record.currentHandlerName" class="w-8 h-8 rounded-full" />
            <div>
              <p class="text-sm font-medium text-gray-900">{{ record.currentHandlerName }}</p>
              <p class="text-xs text-gray-500">{{ getHandlerRole(record.currentHandler) }}</p>
            </div>
          </div>
        </div>
        
        <div class="border-t border-gray-100 pt-4">
          <p class="text-xs text-gray-500 mb-3">状态流转</p>
          <div class="relative">
            <div 
              v-for="(history, index) in record.history" 
              :key="index"
              class="relative pl-6 pb-4 last:pb-0"
            >
              <div class="absolute left-0 top-1 w-3 h-3 rounded-full border-2 border-white"
                :class="statusDotClass(history.status)"
              ></div>
              <div v-if="index < record.history.length - 1" class="absolute left-1.5 top-4 w-px h-full bg-gray-200"></div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="badge text-xs" :class="statusBadgeClass(history.status)">
                    {{ statusText[history.status] }}
                  </span>
                  <span class="text-xs text-gray-400">{{ formatDateTime(history.timestamp) }}</span>
                </div>
                <p class="text-sm text-gray-700 mt-1">{{ history.remark }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ history.userName }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="store.permissions.canApprove && record.status === 'pending'" class="p-4 border-t border-gray-100 space-y-2">
      <button
        @click="handleApprove"
        class="w-full btn bg-green-600 text-white hover:bg-green-700"
      >
        批准
      </button>
      <button
        @click="handleReject"
        class="w-full btn bg-red-100 text-red-700 hover:bg-red-200"
      >
        驳回
      </button>
    </div>
    
    <div v-if="store.permissions.canEdit && record.status === 'abnormal'" class="p-4 border-t border-gray-100">
      <button
        @click="handleResolve"
        class="w-full btn bg-blue-600 text-white hover:bg-blue-700"
      >
        标记为已解决
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMuseumStore } from '~/stores/museum'
import { useFormat } from '~/composables/useFormat'
import { users } from '~/data/users'
import type { InventoryRecord, RecordStatus } from '~/types'

const props = defineProps<{
  record: InventoryRecord
}>()

defineEmits<{
  (e: 'close'): void
}>()

const store = useMuseumStore()
const { formatDate, formatDateTime, statusText, priorityText, lossReasonText } = useFormat()

const getProductUnit = (productId: string): string => {
  const product = store.products.find(p => p.id === productId)
  return product?.unit || ''
}

const getHandlerAvatar = (userId: string): string => {
  const user = users.find(u => u.id === userId)
  return user?.avatar || ''
}

const getHandlerRole = (userId: string): string => {
  const user = users.find(u => u.id === userId)
  const roleNames: Record<string, string> = {
    manager: '馆务经理',
    ticketing: '票务专员',
    event: '活动执行'
  }
  return user ? roleNames[user.role] : ''
}

const statusDotClass = (status: RecordStatus): string => {
  const classes: Record<RecordStatus, string> = {
    pending: 'bg-amber-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    processing: 'bg-blue-500',
    completed: 'bg-purple-500',
    abnormal: 'bg-orange-500'
  }
  return classes[status]
}

const statusBadgeClass = (status: RecordStatus): string => {
  const classes: Record<RecordStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-purple-100 text-purple-700',
    abnormal: 'bg-orange-100 text-orange-700'
  }
  return classes[status]
}

const handleApprove = () => {
  store.updateRecordStatus(props.record.id, 'approved', '审批通过')
  store.addNotification({
    title: '申请已批准',
    content: `${props.record.productName} ${props.record.type === 'restock' ? '补货' : '损耗'}申请已批准`,
    type: 'success',
    relatedRecordId: props.record.id,
    priority: props.record.priority
  })
}

const handleReject = () => {
  const remark = prompt('请输入驳回原因：')
  if (remark !== null) {
    store.updateRecordStatus(props.record.id, 'rejected', remark || '申请被驳回')
    store.addNotification({
      title: '申请被驳回',
      content: `${props.record.productName}申请被驳回：${remark}`,
      type: 'info',
      relatedRecordId: props.record.id,
      priority: 'medium'
    })
  }
}

const handleResolve = () => {
  const remark = prompt('请输入解决说明：')
  if (remark !== null) {
    store.updateRecordStatus(props.record.id, 'completed', remark || '异常已解决')
    store.addNotification({
      title: '异常已解决',
      content: `${props.record.productName}异常已解决`,
      type: 'success',
      relatedRecordId: props.record.id,
      priority: 'medium'
    })
  }
}
</script>
