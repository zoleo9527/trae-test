<template>
  <div class="flex h-screen bg-cream-50">
    <aside class="w-64 bg-navy-500 text-white flex flex-col shadow-xl">
      <div class="p-6 border-b border-navy-600">
        <h1 class="font-display text-xl font-bold text-gold-300 flex items-center gap-2">
          <Diamond class="w-6 h-6" />
          珠宝管理
        </h1>
        <p class="text-xs text-navy-300 mt-1">定制订单与镶嵌进度</p>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="sidebar-link text-navy-100 hover:bg-navy-600 hover:text-gold-300"
          :class="{ 'bg-navy-600 text-gold-300': isActive(item.path) }"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="ml-auto bg-coral-500 text-white text-xs px-2 py-0.5 rounded-full"
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </nav>

      <div class="p-4 border-t border-navy-600">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-white font-bold">
            {{ authStore.userName?.charAt(0) || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ authStore.userName || '未登录' }}</p>
            <p class="text-xs text-navy-300">{{ userRoleLabel }}</p>
          </div>
          <button @click="logout" class="p-2 hover:bg-navy-600 rounded-lg transition-colors" title="退出登录">
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="bg-white border-b border-gold-100 px-8 py-4 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-display font-semibold text-gray-800">{{ pageTitle }}</h2>
          <p class="text-sm text-gray-500">{{ pageSubtitle }}</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="relative">
            <Bell class="w-5 h-5 text-gray-500 cursor-pointer hover:text-gold-500 transition-colors" />
            <span v-if="notificationCount" class="absolute -top-1 -right-1 w-4 h-4 bg-coral-500 text-white text-xs rounded-full flex items-center justify-center">
              {{ notificationCount }}
            </span>
          </div>
          <div class="text-sm text-gray-500">
            {{ currentDate }}
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { Diamond, LayoutDashboard, ShoppingBag, AlertTriangle, Handshake, Bell, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { useAbnormalStore } from '~/stores/abnormal'

const authStore = useAuthStore()
const abnormalStore = useAbnormalStore()

const route = useRoute()

const menuItems = computed(() => [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/orders', label: '订单管理', icon: ShoppingBag },
  { path: '/abnormal', label: '异常处理', icon: AlertTriangle, badge: abnormalStore.highPriorityCount || undefined },
  { path: '/handover', label: '交接管理', icon: Handshake },
])

const isActive = (path: string): boolean => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const userRoleLabel = computed(() => {
  const labels: Record<string, string> = {
    manager: '店长',
    sales: '导购',
    service: '售后专员',
  }
  return labels[authStore.userRole || ''] || '访客'
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': '运营概览',
    '/orders': '订单列表',
    '/abnormal': '异常处理中心',
    '/handover': '交接管理',
  }
  return titles[route.path] || '珠宝管理系统'
})

const pageSubtitle = computed(() => {
  const subtitles: Record<string, string> = {
    '/': '实时掌握门店运营状况',
    '/orders': '管理所有定制订单和镶嵌进度',
    '/abnormal': '跟进和处理异常订单',
    '/handover': '货品交接记录与溯源',
  }
  return subtitles[route.path] || ''
})

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  })
})

const notificationCount = computed(() => abnormalStore.highPriorityCount)

const logout = () => {
  authStore.logout()
  navigateTo('/login')
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    navigateTo('/login')
    return
  }
  await abnormalStore.fetchRecords()
})
</script>
