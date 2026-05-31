<script setup lang="ts">
import { computed } from 'vue'
import { Check, Clock, AlertTriangle } from 'lucide-vue-next'
import { useFlowLink } from '@/composables/useFlowLink'
import { formatDateTime } from '@/lib/utils'
import { roleLabels } from '@/lib/utils'
import type { FlowNode } from '@/types'
import { cn } from '@/lib/utils'

const props = defineProps<{
  orderId: string
}>()

const { flowNodes } = useFlowLink(props.orderId)

const nodeColors: Record<FlowNode['role'], string> = {
  manager: 'bg-bakery-500 border-bakery-600',
  kitchen: 'bg-green-500 border-green-600',
  service: 'bg-blue-500 border-blue-600',
}

function getNodeIcon(node: FlowNode) {
  if (node.status === 'done') return Check
  if (node.status === 'current') return AlertTriangle
  return Clock
}

function getNodeClass(node: FlowNode) {
  if (node.status === 'done') {
    return cn(nodeColors[node.role], 'text-white')
  }
  if (node.status === 'current') {
    return 'bg-white border-2 border-accent text-accent animate-pulse'
  }
  return 'bg-bakery-200 border-bakery-300 text-bakery-500'
}
</script>

<template>
  <div class="flow-timeline">
    <div class="text-sm font-medium text-bakery-700 mb-3">流程接力</div>
    <div class="relative">
      <div
        class="absolute left-4 top-2 bottom-2 w-0.5 bg-bakery-200"
      />

      <div class="space-y-4">
        <div
          v-for="(node, index) in flowNodes"
          :key="node.step"
          class="relative flex gap-3"
        >
          <div
            class="relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
            :class="getNodeClass(node)"
          >
            <component :is="getNodeIcon(node)" class="w-4 h-4" />
          </div>

          <div class="flex-1 pb-4">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-bakery-400">
                步骤 {{ node.step }}
              </span>
              <span
                class="text-xs px-1.5 py-0.5 rounded"
                :class="node.status === 'current' ? 'bg-accent-light text-accent' : node.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-bakery-100 text-bakery-500'"
              >
                {{ node.status === 'done' ? '已完成' : node.status === 'current' ? '进行中' : '待处理' }}
              </span>
            </div>

            <div class="flex items-center gap-2 mt-1">
              <span class="font-medium text-bakery-800">{{ node.label }}</span>
              <span class="text-xs text-bakery-500">· {{ roleLabels[node.role] }}</span>
            </div>

            <p v-if="node.detail" class="text-sm text-bakery-600 mt-1">
              {{ node.detail }}
            </p>

            <div v-if="node.timestamp || node.actor" class="flex items-center gap-3 mt-1 text-xs text-bakery-400">
              <span v-if="node.timestamp">{{ formatDateTime(node.timestamp) }}</span>
              <span v-if="node.actor">操作人：{{ node.actor }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
