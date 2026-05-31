<script setup lang="ts">
import { computed } from 'vue'
import { FileText, Edit, RotateCcw, PackageX, Undo2, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { ref } from 'vue'
import type { RefundTrace } from '@/types'
import { traceTypeLabels, formatDateTime, formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

const props = defineProps<{
  trace: RefundTrace
  defaultOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', trace: RefundTrace): void
}>()

const isOpen = ref(props.defaultOpen ?? false)

const traceIcon = computed(() => {
  const map = {
    order: FileText,
    change: Edit,
    remake: RotateCcw,
    loss: PackageX,
    refund: Undo2,
  }
  return map[props.trace.traceType] || FileText
})

const traceColor = computed(() => {
  const map = {
    order: 'text-blue-600 bg-blue-50',
    change: 'text-purple-600 bg-purple-50',
    remake: 'text-orange-600 bg-orange-50',
    loss: 'text-red-600 bg-red-50',
    refund: 'text-red-700 bg-red-100',
  }
  return map[props.trace.traceType] || 'text-bakery-600 bg-bakery-50'
})
</script>

<template>
  <div class="trace-card border border-bakery-200 rounded-lg overflow-hidden bg-white">
    <div
      class="flex items-center gap-3 p-3 cursor-pointer hover:bg-bakery-50 transition-colors"
      @click="isOpen = !isOpen; emit('click', trace)"
    >
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        :class="traceColor"
      >
        <component :is="traceIcon" class="w-4 h-4" />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium px-1.5 py-0.5 rounded" :class="traceColor">
            {{ traceTypeLabels[trace.traceType] }}
          </span>
          <span class="text-xs text-bakery-400 font-mono">{{ trace.traceTargetId }}</span>
        </div>
        <p class="text-sm text-bakery-700 mt-0.5 truncate">{{ trace.summary }}</p>
      </div>

      <component
        :is="isOpen ? ChevronDown : ChevronRight"
        class="w-4 h-4 text-bakery-400 flex-shrink-0"
      />
    </div>

    <div
      v-if="isOpen"
      class="px-3 pb-3 pt-1 border-t border-bakery-100 bg-bakery-50/50"
    >
      <div class="grid grid-cols-2 gap-2 text-xs mt-2">
        <div>
          <span class="text-bakery-500">追溯类型：</span>
          <span class="text-bakery-700">{{ traceTypeLabels[trace.traceType] }}</span>
        </div>
        <div>
          <span class="text-bakery-500">关联ID：</span>
          <span class="text-bakery-700 font-mono">{{ trace.traceTargetId }}</span>
        </div>
      </div>
      <p class="text-sm text-bakery-700 mt-2">{{ trace.summary }}</p>
    </div>
  </div>
</template>
