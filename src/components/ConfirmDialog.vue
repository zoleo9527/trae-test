<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}>(), {
  confirmLabel: '确认',
  cancelLabel: '取消',
  variant: 'default',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[90] flex items-center justify-center">
      <div
        class="absolute inset-0 bg-black/60"
        @click="emit('cancel')"
      />
      <div class="relative bg-bg-secondary rounded-xl border border-border shadow-2xl w-full max-w-md mx-4 animate-fade-in">
        <div class="px-6 pt-6 pb-2">
          <div class="flex items-start gap-3">
            <div
              v-if="variant === 'danger'"
              class="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0"
            >
              <AlertTriangle :size="20" class="text-red-400" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-base font-semibold text-txt-primary">{{ title }}</h3>
              <p class="mt-2 text-sm text-txt-secondary leading-relaxed">{{ message }}</p>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-6 py-4">
          <button
            @click="emit('cancel')"
            class="px-4 py-2 rounded-lg text-sm text-txt-secondary hover:text-txt-primary hover:bg-bg-tertiary transition-colors duration-150"
          >
            {{ cancelLabel }}
          </button>
          <button
            @click="emit('confirm')"
            :class="cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-accent hover:bg-accent-hover text-bg-primary'
            )"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
