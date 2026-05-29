<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  title: string
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
        <div class="relative bg-surface rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 class="text-base font-semibold text-text-primary">{{ title }}</h3>
            <button class="text-text-muted hover:text-text-primary" @click="emit('close')">
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <slot name="body" />
          </div>
          <div v-if="$slots.footer" class="px-5 py-3 border-t border-border flex justify-end gap-2">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
