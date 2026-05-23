<template>
  <div class="space-y-1">
    <div
      v-for="(node, index) in nodes"
      :key="node.id"
      :class="[
        'timeline-node',
        getProgressStatusClass(node.status)
      ]"
    >
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h4 class="font-medium text-gray-900">{{ node.step }}</h4>
            <span v-if="node.status === 'in_progress'" class="status-badge bg-gold-100 text-gold-700 animate-pulse">
              进行中
            </span>
            <span v-if="node.status === 'abnormal'" class="status-badge bg-coral-100 text-coral-700">
              异常
            </span>
          </div>
          <p v-if="node.operator" class="text-sm text-gray-500 mt-0.5">
            负责人: {{ node.operator }}
          </p>
          <p v-if="node.remark" class="text-sm text-gray-600 mt-1 bg-gray-50 px-3 py-2 rounded-lg">
            {{ node.remark }}
          </p>
          <div v-if="node.startTime || node.endTime" class="flex gap-4 mt-2 text-xs text-gray-400">
            <span v-if="node.startTime">开始: {{ formatDateTime(node.startTime) }}</span>
            <span v-if="node.endTime">完成: {{ formatDateTime(node.endTime) }}</span>
          </div>
        </div>
        <div v-if="showActions && canEdit && node.status === 'pending' && isCurrentStep(index)" class="ml-4">
          <BaseButton size="sm" variant="secondary" @click="$emit('start', node)">
            开始
          </BaseButton>
        </div>
        <div v-if="showActions && canEdit && node.status === 'in_progress'" class="ml-4 flex gap-2">
          <BaseButton size="sm" @click="$emit('complete', node)">
            完成
          </BaseButton>
          <BaseButton size="sm" variant="danger" @click="$emit('abnormal', node)">
            异常
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProgressNode } from '~/types'
import { useFormat } from '~/composables/useFormat'
import BaseButton from './BaseButton.vue'

interface Props {
  nodes: ProgressNode[]
  showActions?: boolean
  canEdit?: boolean
}

withDefaults(defineProps<Props>(), {
  showActions: false,
  canEdit: false,
})

defineEmits<{
  start: [node: ProgressNode]
  complete: [node: ProgressNode]
  abnormal: [node: ProgressNode]
}>()

const { formatDateTime, getProgressStatusClass } = useFormat()

const isCurrentStep = (index: number): boolean => {
  const firstPending = props.nodes.findIndex(n => n.status === 'pending')
  return firstPending === index
}
</script>
