<template>
  <div class="space-y-4">
    <div
      v-for="remark in items"
      :key="remark.id"
      class="border border-gray-200 rounded-lg p-4"
      :class="{ 'bg-amber-50/50 border-amber-200': remark.isInternal }"
    >
      <div class="flex items-start justify-between mb-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="text-primary-700 text-sm font-medium">{{ remark.authorName.charAt(0) }}</span>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-900">{{ remark.authorName }}</span>
            <span class="text-xs text-gray-400 mx-1">·</span>
            <span class="text-xs text-gray-500">{{ getRoleLabel(remark.authorRole) }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="remark.isInternal" class="badge bg-amber-100 text-amber-700">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            内部备注
          </span>
          <span class="text-xs text-gray-400">{{ commonStore.formatDateTime(remark.createdAt) }}</span>
        </div>
      </div>
      <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ remark.content }}</p>
    </div>

    <div v-if="items.length === 0" class="text-center py-8 text-gray-500">
      暂无备注
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCommonStore } from '~/stores/common'
import type { Remark, UserRole } from '~/types'

const props = defineProps<{
  items?: Remark[]
  recordId?: string
}>()

const commonStore = useCommonStore()

const items = computed(() => {
  if (props.items) return props.items
  if (props.recordId) return commonStore.getRemarks(props.recordId)
  return []
})

const roleLabelMap: Record<UserRole, string> = {
  manager: '场馆经理',
  coach_supervisor: '教练主管',
  reception: '前台'
}

function getRoleLabel(role: UserRole) {
  return roleLabelMap[role] || role
}
</script>
