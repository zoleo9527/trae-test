<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Icon name="lucide:bell" class="w-5 h-5" />
      <span
        v-if="store.unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
      >
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>
    
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 class="font-semibold text-gray-900">消息通知</h3>
          <button
            v-if="store.unreadCount > 0"
            @click="store.markAllNotificationsRead"
            class="text-xs text-museum-600 hover:text-museum-700"
          >
            全部已读
          </button>
        </div>
        <div class="max-h-80 overflow-y-auto">
          <div
            v-for="notification in store.notifications.slice(0, 10)"
            :key="notification.id"
            class="flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
            :class="{ 'bg-blue-50/50': !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" :class="notificationBgClass(notification.type)">
              <Icon :name="notificationIcon(notification.type)" class="w-4 h-4" :class="notificationTextClass(notification.type)" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-medium text-gray-900 truncate">{{ notification.title }}</p>
                <span v-if="!notification.isRead" class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ notification.content }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ relativeTime(notification.timestamp) }}</p>
            </div>
          </div>
          <div v-if="store.notifications.length === 0" class="px-4 py-8 text-center">
            <Icon name="lucide:inbox" class="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p class="text-sm text-gray-500">暂无通知</p>
          </div>
        </div>
        <div class="px-4 py-3 border-t border-gray-100">
          <button class="w-full text-sm text-center text-museum-600 hover:text-museum-700 font-medium">
            查看全部通知
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMuseumStore } from '~/stores/museum'
import { useFormat } from '~/composables/useFormat'
import type { Notification } from '~/types'

const store = useMuseumStore()
const { relativeTime } = useFormat()
const isOpen = ref(false)

const notificationIcon = (type: Notification['type']) => {
  const icons: Record<string, string> = {
    info: 'lucide:info',
    warning: 'lucide:alert-triangle',
    error: 'lucide:alert-circle',
    success: 'lucide:check-circle'
  }
  return icons[type]
}

const notificationBgClass = (type: Notification['type']) => {
  const classes: Record<string, string> = {
    info: 'bg-blue-100',
    warning: 'bg-amber-100',
    error: 'bg-red-100',
    success: 'bg-green-100'
  }
  return classes[type]
}

const notificationTextClass = (type: Notification['type']) => {
  const classes: Record<string, string> = {
    info: 'text-blue-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    success: 'text-green-600'
  }
  return classes[type]
}

const handleNotificationClick = (notification: Notification) => {
  store.markNotificationRead(notification.id)
  if (notification.relatedRecordId) {
    store.setSelectedRecord(notification.relatedRecordId)
    navigateTo('/')
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
