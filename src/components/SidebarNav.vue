<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Music, LayoutDashboard, GitBranch, LogOut, LogIn, Wrench, Wallet, LogOut as LogoutIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { ROLE_NAV_ITEMS } from '@/types'
import { cn } from '@/lib/utils'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const iconMap: Record<string, Component> = {
  LayoutDashboard,
  GitBranch,
  LogOut,
  LogIn,
  Wrench,
  Wallet,
}

const navItems = computed(() => {
  if (!authStore.currentRole) return []
  return ROLE_NAV_ITEMS[authStore.currentRole]
})

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}

function navigate(path: string) {
  router.push(path)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="w-[220px] h-screen bg-bg-secondary flex flex-col border-r border-border">
    <div class="flex items-center gap-2.5 px-5 py-5 border-b border-border">
      <Music :size="22" class="text-accent" />
      <h1 class="text-lg font-semibold text-txt-primary tracking-wide">乐器租赁</h1>
    </div>

    <nav class="flex-1 py-3 px-3 space-y-1 overflow-y-auto scrollbar-thin">
      <button
        v-for="item in navItems"
        :key="item.path"
        @click="navigate(item.path)"
        :class="cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
          isActive(item.path)
            ? 'bg-accent/10 text-accent font-medium'
            : 'text-txt-secondary hover:bg-bg-tertiary hover:text-txt-primary'
        )"
      >
        <component
          :is="iconMap[item.icon]"
          :size="18"
          :class="isActive(item.path) ? 'text-accent' : 'text-txt-muted'"
        />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div v-if="authStore.currentUser" class="border-t border-border px-4 py-4 space-y-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold">
          {{ authStore.currentUser.name.charAt(0) }}
        </div>
        <div class="min-w-0">
          <p class="text-sm text-txt-primary truncate">{{ authStore.currentUser.name }}</p>
          <p class="text-xs text-txt-muted">{{ authStore.currentUser.label }}</p>
        </div>
      </div>
      <button
        @click="handleLogout"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-txt-muted hover:text-red-400 hover:bg-red-400/10 transition-colors duration-150"
      >
        <LogoutIcon :size="15" />
        <span>退出登录</span>
      </button>
    </div>
  </aside>
</template>
