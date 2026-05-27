<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span>💧</span>
          <span>水站管理</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path || route.path.startsWith(item.path + '/') }"
        >
          <span>{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="badge badge-danger"
            style="margin-left: auto; font-size: 11px;"
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ user?.avatar }}</div>
          <div class="user-details">
            <div class="user-name">{{ user?.name }}</div>
            <div class="user-role">{{ getRoleLabel(user?.role || '') }}</div>
          </div>
          <button class="btn btn-outline btn-sm" @click="logout" title="退出登录">
            🚪
          </button>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="header">
        <h1 class="page-title">{{ pageTitle }}</h1>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 13px; color: var(--gray-500);">
            {{ currentDate }}
          </span>
        </div>
      </header>

      <div class="content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, logout, getRoleLabel, isAuthenticated, canViewDashboard, canViewRoutes, canViewExceptions, canViewCustomers, canViewBuckets, getDefaultPage } = useAuth()
const route = useRoute()

const pendingExceptions = ref(0)

const menuItems = computed(() => {
  if (!user.value) return []
  const role = user.value.role
  const items = []
  
  if (canViewDashboard(role)) {
    items.push({ path: '/dashboard', label: '仪表板', icon: '📊', badge: null })
  }
  if (canViewRoutes(role)) {
    items.push({ path: '/routes', label: '配送路线', icon: '🗺️', badge: null })
  }
  if (canViewExceptions(role)) {
    items.push({ path: '/exceptions', label: '异常处理', icon: '⚠️', badge: pendingExceptions.value > 0 ? pendingExceptions.value : null })
  }
  if (canViewCustomers(role)) {
    items.push({ path: '/customers', label: '客户管理', icon: '👥', badge: null })
  }
  if (canViewBuckets(role)) {
    items.push({ path: '/buckets', label: '空桶对账', icon: '🪣', badge: null })
  }
  
  return items
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': '仪表板',
    '/routes': '配送路线',
    '/exceptions': '异常处理',
    '/customers': '客户管理',
    '/buckets': '空桶对账'
  }
  const path = route.path.split('/').slice(0, 2).join('/')
  return titles[path] || '桶装水配送管理系统'
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

const loadPendingExceptions = async () => {
  try {
    const config = useRuntimeConfig()
    const data = await $fetch<any>(`${config.public.apiBase}/dashboard/stats`)
    pendingExceptions.value = data.pending_exceptions
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  if (!isAuthenticated.value) {
    navigateTo('/login')
    return
  }
  loadPendingExceptions()
})

watch(isAuthenticated, (val) => {
  if (!val) {
    navigateTo('/login')
  }
})
</script>
