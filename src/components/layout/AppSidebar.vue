<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useExceptionStore } from '@/stores/exception'
import { 
  LayoutDashboard, 
  PackageOpen, 
  TicketCheck, 
  Search, 
  Building2 
} from 'lucide-vue-next'

const appStore = useAppStore()
const exceptionStore = useExceptionStore()
const route = useRoute()
const router = useRouter()

const menuItems = [
  { path: '/dashboard', name: '运营看板', icon: LayoutDashboard },
  { path: '/borrow', name: '展品借调', icon: PackageOpen },
  { path: '/ticket', name: '票务核销', icon: TicketCheck },
  { path: '/trace', name: '追溯回查', icon: Search }
]

const isActive = (path: string) => route.path === path

const pendingExceptionCount = computed(() => 
  exceptionStore.pendingCount + exceptionStore.processingCount
)
</script>

<template>
  <aside 
    class="bg-museum-dark text-white flex flex-col transition-all duration-300"
    :class="appStore.sidebarCollapsed ? 'w-20' : 'w-64'"
  >
    <div class="p-4 border-b border-museum-light/20">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-museum-gold rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 class="w-6 h-6 text-museum-dark" />
        </div>
        <div v-if="!appStore.sidebarCollapsed" class="overflow-hidden">
          <h1 class="font-serif text-lg font-semibold truncate">美术馆运营</h1>
          <p class="text-xs text-white/60">管理系统</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 p-3 space-y-1">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group"
        :class="isActive(item.path) 
          ? 'bg-museum-gold/20 text-museum-gold border border-museum-gold/30' 
          : 'text-white/70 hover:bg-white/10 hover:text-white'"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!appStore.sidebarCollapsed" class="text-sm font-medium">{{ item.name }}</span>
        <span 
          v-if="item.path === '/dashboard' && !appStore.sidebarCollapsed && pendingExceptionCount > 0"
          class="ml-auto bg-museum-coral text-white text-xs px-2 py-0.5 rounded-full animate-pulse-coral"
        >
          {{ pendingExceptionCount }}
        </span>
      </router-link>
    </nav>

    <div class="p-4 border-t border-museum-light/20">
      <button 
        @click="appStore.toggleSidebar"
        class="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <svg 
          class="w-5 h-5 transition-transform"
          :class="appStore.sidebarCollapsed ? 'rotate-180' : ''"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>
  </aside>
</template>
