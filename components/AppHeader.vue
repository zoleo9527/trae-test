<template>
  <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-bold text-gray-900">
        {{ currentPageTitle }}
      </h1>
    </div>

    <div class="flex items-center gap-4">
      <RoleSwitcher />

      <div class="relative">
        <button
          @click="showNotifications = !showNotifications"
          class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span
            v-if="notificationStore.unreadCount > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium"
          >
            {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
          </span>
        </button>

        <div
          v-if="showNotifications"
          class="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col"
        >
          <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">通知中心</h3>
            <button
              v-if="notificationStore.unreadCount > 0"
              @click="notificationStore.markAllAsRead()"
              class="text-sm text-primary-600 hover:text-primary-700"
            >
              全部已读
            </button>
          </div>
          <div class="flex-1 overflow-y-auto scrollbar-thin">
            <div
              v-for="notification in notificationStore.myNotifications.slice(0, 10)"
              :key="notification.id"
              @click="handleNotificationClick(notification)"
              class="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
              :class="{ 'bg-blue-50/50': !notification.read }"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="{
                    'bg-red-100 text-red-600': notification.type === 'error',
                    'bg-amber-100 text-amber-600': notification.type === 'warning',
                    'bg-green-100 text-green-600': notification.type === 'success',
                    'bg-blue-100 text-blue-600': notification.type === 'info'
                  }"
                >
                  <svg v-if="notification.type === 'error'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <svg v-else-if="notification.type === 'warning'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else-if="notification.type === 'success'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ notification.title }}</p>
                  <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ notification.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ commonStore.formatDateTime(notification.createdAt) }}</p>
                </div>
                <div v-if="!notification.read" class="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></div>
              </div>
            </div>
            <div v-if="notificationStore.myNotifications.length === 0" class="px-4 py-8 text-center text-gray-500">
              暂无通知
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 pl-4 border-l border-gray-200">
        <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <span class="text-primary-700 font-semibold">{{ userStore.currentUser?.name?.charAt(0) }}</span>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900">{{ userStore.currentUser?.name }}</p>
          <p class="text-xs text-gray-500">{{ userStore.currentRoleLabel }}</p>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { useNotificationStore } from '~/stores/notification'
import { useCommonStore } from '~/stores/common'
import type { Notification } from '~/types'

const userStore = useUserStore()
const notificationStore = useNotificationStore()
const commonStore = useCommonStore()
const route = useRoute()

const showNotifications = ref(false)

const pageTitleMap: Record<string, string> = {
  '/': '工作台',
  '/calendar': '日历视图',
  '/patrol': '巡场记录',
  '/complaint': '投诉跟进',
  '/booking': '预约管理',
  '/prepaid': '储值账户',
  '/equipment': '器材管理'
}

const currentPageTitle = computed(() => {
  const path = route.path
  if (path.startsWith('/patrol/')) return '巡场详情'
  if (path.startsWith('/complaint/')) return '投诉详情'
  if (path.startsWith('/booking/')) return '预约详情'
  if (path.startsWith('/prepaid/')) return '账户详情'
  if (path.startsWith('/equipment/')) return '器材详情'
  return pageTitleMap[path] || '高尔夫练习场管理系统'
})

function handleNotificationClick(notification: Notification) {
  notificationStore.markAsRead(notification.id)
  showNotifications.value = false

  if (notification.relatedId && notification.relatedType) {
    const routeMap: Record<string, string> = {
      patrol: `/patrol/${notification.relatedId}`,
      complaint: `/complaint/${notification.relatedId}`,
      booking: `/booking/${notification.relatedId}`,
      equipment: `/equipment/${notification.relatedId}`,
      prepaid: `/prepaid/${notification.relatedId}`
    }
    if (routeMap[notification.relatedType]) {
      navigateTo(routeMap[notification.relatedType])
    }
  }
}

watch(() => route.path, () => {
  showNotifications.value = false
})
</script>
