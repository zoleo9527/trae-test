<template>
  <header class="h-16 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between px-4 md:px-6">
    <div class="flex items-center gap-4">
      <button
        @click="$emit('toggle-sidebar')"
        class="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div class="hidden sm:flex items-center gap-2 text-sm text-gray-500">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ currentDate }}</span>
      </div>
    </div>

    <div class="flex items-center gap-2 md:gap-4">
      <div class="relative">
        <button
          @click="showAlerts = !showAlerts"
          class="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span
            v-if="openAlertsCount > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
          >
            {{ openAlertsCount > 9 ? '9+' : openAlertsCount }}
          </span>
        </button>

        <div
          v-if="showAlerts"
          class="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-100 z-50 max-h-96 overflow-hidden"
        >
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">预警提醒</h3>
            <NuxtLink to="/alerts" class="text-sm text-primary-600 hover:text-primary-700">查看全部</NuxtLink>
          </div>
          <div class="overflow-y-auto max-h-72">
            <div v-if="openAlerts.length === 0" class="p-8 text-center text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>暂无预警</p>
            </div>
            <div
              v-for="alert in openAlerts.slice(0, 5)"
              :key="alert.id"
              class="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
              @click="handleAlertClick(alert)"
            >
              <div class="flex items-start gap-3">
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                    alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  ]"
                >
                  <svg v-if="alert.severity === 'critical'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <svg v-else-if="alert.severity === 'warning'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ alert.title }}</p>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ alert.description }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatTime(alert.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="relative">
        <button
          @click="showRoleSelector = !showRoleSelector"
          class="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div
            :class="[
              'w-2 h-2 rounded-full',
              authStore.isProjectManager ? 'bg-primary-500' :
              authStore.isSchedulingSpecialist ? 'bg-green-500' :
              'bg-purple-500'
            ]"
          />
          <span class="text-sm text-gray-700">{{ roleLabel }}</span>
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          v-if="showRoleSelector"
          class="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50"
        >
          <div class="p-2">
            <p class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">切换角色</p>
            <button
              v-for="role in authStore.availableRoles"
              :key="role"
              @click="handleSwitchRole(role)"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
              :class="{
                'bg-primary-50 text-primary-600': authStore.currentRole === role,
                'hover:bg-gray-50 text-gray-700': authStore.currentRole !== role
              }"
            >
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  role === 'project_manager' ? 'bg-primary-100 text-primary-600' :
                  role === 'scheduling_specialist' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                ]"
              >
                <svg v-if="role === 'project_manager'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <svg v-else-if="role === 'scheduling_specialist'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div class="flex-1 text-left">
                <p class="text-sm font-medium">{{ getRoleLabel(role) }}</p>
                <p class="text-xs text-gray-500">{{ getRoleUser(role) }}</p>
              </div>
              <svg v-if="authStore.currentRole === role" class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="relative">
        <button
          @click="showUserMenu = !showUserMenu"
          class="flex items-center gap-2 md:gap-3 p-1 md:p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <img
            v-if="authStore.currentUser?.avatar"
            :src="authStore.currentUser.avatar"
            :alt="authStore.currentUser.name"
            class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-200"
          />
          <div class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-200 flex items-center justify-center" v-else>
            <span class="text-sm font-medium text-gray-600">{{ authStore.currentUser?.name?.charAt(0) || 'U' }}</span>
          </div>
          <div class="hidden md:block text-left">
            <p class="text-sm font-medium text-gray-900">{{ authStore.currentUser?.name || '用户' }}</p>
            <p class="text-xs text-gray-500">{{ roleLabel }}</p>
          </div>
        </button>

        <div
          v-if="showUserMenu"
          class="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-50"
        >
          <div class="p-4 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <img
                v-if="authStore.currentUser?.avatar"
                :src="authStore.currentUser.avatar"
                :alt="authStore.currentUser.name"
                class="w-12 h-12 rounded-full bg-gray-200"
              />
              <div class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center" v-else>
                <span class="text-lg font-medium text-gray-600">{{ authStore.currentUser?.name?.charAt(0) || 'U' }}</span>
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ authStore.currentUser?.name || '用户' }}</p>
                <p class="text-sm text-gray-500">{{ authStore.currentUser?.phone || '' }}</p>
              </div>
            </div>
          </div>
          <div class="p-2">
            <button class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              个人资料
            </button>
            <button class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              系统设置
            </button>
            <div class="border-t border-gray-100 my-2" />
            <button class="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { UserRole, Alert } from '~/types'
import { mockUsers } from '~/data/mockData'

defineEmits<{
  'toggle-sidebar': []
}>()

const authStore = useAuthStore()
const dataStore = useDataStore()

const showAlerts = ref(false)
const showRoleSelector = ref(false)
const showUserMenu = ref(false)

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const roleLabel = computed(() => getRoleLabel(authStore.currentRole))

const openAlerts = computed(() => dataStore.getOpenAlerts)
const openAlertsCount = computed(() => openAlerts.value.length)

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    project_manager: '项目主管',
    scheduling_specialist: '排班专员',
    quality_inspector: '质检员'
  }
  return labels[role] || role
}

function getRoleUser(role: UserRole): string {
  const user = mockUsers.find(u => u.role === role)
  return user?.name || ''
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

function handleSwitchRole(role: UserRole) {
  authStore.switchRole(role)
  showRoleSelector.value = false
  navigateTo('/dashboard')
}

function handleAlertClick(alert: Alert) {
  showAlerts.value = false
  navigateTo(`/alerts?id=${alert.id}`)
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showAlerts.value = false
    showRoleSelector.value = false
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
