<template>
  <div class="min-h-screen flex">
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div class="h-16 flex items-center px-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            地
          </div>
          <div>
            <div class="font-semibold text-gray-900">地坪施工管理</div>
            <div class="text-xs text-gray-500">进度与质量系统</div>
          </div>
        </div>
      </div>

      <nav class="flex-1 py-4 px-3 space-y-1">
        <NuxtLink to="/" class="sidebar-link">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>总览</span>
        </NuxtLink>
        <NuxtLink to="/progress" class="sidebar-link">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>工地进度</span>
        </NuxtLink>
        <NuxtLink to="/quality" class="sidebar-link">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>质量复查</span>
        </NuxtLink>
        <NuxtLink to="/settlement" class="sidebar-link">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>班组结算</span>
        </NuxtLink>
        <NuxtLink to="/deliveries" class="sidebar-link">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>材料管理</span>
        </NuxtLink>
      </nav>

      <div class="border-t border-gray-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span class="text-gray-600 font-medium">{{ authStore.userName?.charAt(0) || 'U' }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">{{ authStore.userName }}</div>
            <div class="text-xs text-gray-500">
              {{ roleText }}
            </div>
          </div>
          <button @click="authStore.logout" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

const roleText = computed(() => {
  const map: Record<string, string> = {
    'manager': '项目负责人',
    'inspector': '质检工程师',
    'team_leader': '班组长',
    'admin': '系统管理员'
  }
  return map[authStore.userRole as string] || '用户'
})
</script>
