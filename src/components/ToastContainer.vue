<script setup lang="ts">
import { computed } from 'vue'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notification'
import { cn } from '@/lib/utils'

const notificationStore = useNotificationStore()

const toastConfig = {
  success: { icon: CheckCircle, bgClass: 'bg-emerald-500/15 border-emerald-500/30', textClass: 'text-emerald-400' },
  error: { icon: AlertCircle, bgClass: 'bg-red-500/15 border-red-500/30', textClass: 'text-red-400' },
  warning: { icon: AlertTriangle, bgClass: 'bg-amber-500/15 border-amber-500/30', textClass: 'text-amber-400' },
  info: { icon: Info, bgClass: 'bg-blue-500/15 border-blue-500/30', textClass: 'text-blue-400' },
} as const

type ToastType = keyof typeof toastConfig
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in notificationStore.toasts"
          :key="toast.id"
          :class="cn(
            'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm min-w-[280px] max-w-[380px]',
            toastConfig[toast.type as ToastType]?.bgClass ?? toastConfig.info.bgClass
          )"
        >
          <component
            :is="toastConfig[toast.type as ToastType]?.icon ?? toastConfig.info.icon"
            :size="18"
            :class="toastConfig[toast.type as ToastType]?.textClass ?? toastConfig.info.textClass"
          />
          <p class="flex-1 text-sm text-txt-primary">{{ toast.message }}</p>
          <button
            @click="notificationStore.removeToast(toast.id)"
            class="p-0.5 rounded text-txt-muted hover:text-txt-primary transition-colors shrink-0"
          >
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}
.toast-leave-active {
  animation: toast-in 0.2s ease-in reverse;
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
