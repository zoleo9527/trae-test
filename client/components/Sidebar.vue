<template>
  <aside
    :class="[
      'bg-white shadow-lg transition-all duration-300 flex flex-col',
      collapsed ? 'w-16 md:w-20' : 'w-64'
    ]"
  >
    <div class="h-16 flex items-center justify-center border-b border-gray-100">
      <NuxtLink to="/" class="flex items-center gap-2 text-primary-600 font-bold">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span v-if="!collapsed" class="text-lg">清洁管理系统</span>
      </NuxtLink>
    </div>

    <nav class="flex-1 py-4 overflow-y-auto">
      <ul class="space-y-1 px-2">
        <li v-for="item in menuItems" :key="item.path">
          <NuxtLink
            :to="item.path"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
            :class="{
              'bg-primary-50 text-primary-600': isActive(item.path),
              'text-gray-600 hover:bg-gray-50 hover:text-gray-900': !isActive(item.path)
            }"
          >
            <svg v-if="item.iconKey === 'dashboard'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <svg v-else-if="item.iconKey === 'calendar'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <svg v-else-if="item.iconKey === 'schedule'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else-if="item.iconKey === 'supplies'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <svg v-else-if="item.iconKey === 'inspection'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <svg v-else-if="item.iconKey === 'alert'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <svg v-else-if="item.iconKey === 'history'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else-if="item.iconKey === 'punch'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <svg v-else-if="item.iconKey === 'rectification'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span v-if="!collapsed" class="text-sm font-medium">{{ item.label }}</span>
            <span
              v-if="item.badge && !collapsed"
              class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
            >
              {{ item.badge }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="p-2 border-t border-gray-100">
      <button
        @click="$emit('toggle')"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <svg v-if="collapsed" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        <span v-if="!collapsed" class="text-sm">收起菜单</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { UserRole } from '~/types'

interface MenuItem {
  path: string
  label: string
  iconKey: string
  badge?: number
}

interface Props {
  collapsed: boolean
}

defineProps<Props>()
defineEmits<{
  toggle: []
}>()

const route = useRoute()
const authStore = useAuthStore()
const dataStore = useDataStore()

const isActive = (path: string): boolean => {
  return route.path === path || route.path.startsWith(path + '/')
}

const openAlertsCount = computed(() => dataStore.alerts.filter(a => a.status === 'open').length)

const menuConfig = computed<Record<UserRole, MenuItem[]>>(() => ({
  project_manager: [
    { path: '/dashboard', label: '仪表盘', iconKey: 'dashboard' },
    { path: '/calendar', label: '日历视图', iconKey: 'calendar' },
    { path: '/scheduling', label: '排班管理', iconKey: 'schedule' },
    { path: '/supplies', label: '耗材管理', iconKey: 'supplies' },
    { path: '/quality', label: '质检管理', iconKey: 'inspection' },
    { path: '/rectification', label: '整改追踪', iconKey: 'rectification' },
    { path: '/alerts', label: '预警中心', iconKey: 'alert', badge: openAlertsCount.value },
    { path: '/history', label: '历史记录', iconKey: 'history' }
  ],
  scheduling_specialist: [
    { path: '/dashboard', label: '仪表盘', iconKey: 'dashboard' },
    { path: '/calendar', label: '日历视图', iconKey: 'calendar' },
    { path: '/scheduling', label: '排班管理', iconKey: 'schedule' },
    { path: '/punch', label: '打卡管理', iconKey: 'punch' },
    { path: '/alerts', label: '预警中心', iconKey: 'alert', badge: openAlertsCount.value }
  ],
  quality_inspector: [
    { path: '/dashboard', label: '仪表盘', iconKey: 'dashboard' },
    { path: '/calendar', label: '日历视图', iconKey: 'calendar' },
    { path: '/quality', label: '质检管理', iconKey: 'inspection' },
    { path: '/rectification', label: '整改追踪', iconKey: 'rectification' },
    { path: '/alerts', label: '预警中心', iconKey: 'alert', badge: openAlertsCount.value }
  ]
}))

const menuItems = computed(() => menuConfig.value[authStore.currentRole] || [])
</script>
