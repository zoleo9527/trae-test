<template>
  <div class="space-y-4">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="relative pl-8 pb-6 last:pb-0"
    >
      <div
        v-if="index < items.length - 1"
        class="absolute left-[15px] top-6 bottom-0 w-0.5 bg-gray-200"
      ></div>
      
      <div
        class="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
        :class="getTimelineDotClass(item.toStatus)"
      >
        <svg v-if="item.toStatus === 'draft'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <svg v-else-if="item.toStatus === 'pending'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else-if="item.toStatus === 'approved'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else-if="item.toStatus === 'rejected'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <svg v-else-if="item.toStatus === 'processing'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <svg v-else-if="item.toStatus === 'completed'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <StatusBadge :status="item.toStatus" />
            <span v-if="item.fromStatus" class="text-sm text-gray-400">
              ← {{ getStatusLabel(item.fromStatus) }}
            </span>
          </div>
          <span class="text-xs text-gray-400">{{ commonStore.formatDateTime(item.createdAt) }}</span>
        </div>
        
        <div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span class="font-medium">{{ item.operatorName }}</span>
          <span class="text-gray-400">·</span>
          <span>{{ getRoleLabel(item.operatorRole) }}</span>
        </div>
        
        <p v-if="item.remark" class="text-sm text-gray-600 bg-white rounded p-3 border border-gray-100">
          {{ item.remark }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCommonStore } from '~/stores/common'
import type { StatusHistory, RecordStatus, UserRole } from '~/types'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  items?: StatusHistory[]
  recordId?: string
}>()

const commonStore = useCommonStore()

const items = computed(() => {
  if (props.items) return props.items
  if (props.recordId) return commonStore.getStatusHistory(props.recordId)
  return []
})

const statusLabelMap: Record<RecordStatus, string> = {
  draft: '草稿',
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  processing: '处理中',
  completed: '已完成',
  overdue: '已逾期'
}

const roleLabelMap: Record<UserRole, string> = {
  manager: '场馆经理',
  coach_supervisor: '教练主管',
  reception: '前台'
}

function getStatusLabel(status: RecordStatus) {
  return statusLabelMap[status] || status
}

function getRoleLabel(role?: UserRole) {
  if (!role) return ''
  return roleLabelMap[role] || role
}

function getTimelineDotClass(status: RecordStatus) {
  const map: Record<RecordStatus, string> = {
    draft: 'bg-gray-500 text-white',
    pending: 'bg-amber-500 text-white',
    approved: 'bg-green-500 text-white',
    rejected: 'bg-red-500 text-white',
    processing: 'bg-blue-500 text-white',
    completed: 'bg-primary-500 text-white',
    overdue: 'bg-red-600 text-white'
  }
  return map[status] || 'bg-gray-500 text-white'
}
</script>
