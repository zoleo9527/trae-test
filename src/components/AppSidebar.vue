<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import {
  LayoutDashboard,
  MapPin,
  ArrowRightLeft,
  ClipboardList,
  Truck,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TreePine,
} from 'lucide-vue-next'
import RoleSwitcher from './RoleSwitcher.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const navItems = [
  { name: '仪表盘', icon: LayoutDashboard, path: '/' },
  { name: '地块库存', icon: MapPin, path: '/plots' },
  { name: '调拨管理', icon: ArrowRightLeft, path: '/transfers' },
  { name: '作业中心', icon: ClipboardList, path: '/operations' },
  { name: '装车管理', icon: Truck, path: '/loading' },
  { name: '回访协商', icon: Phone, path: '/followup' },
  { name: '日历视图', icon: Calendar, path: '/calendar' },
]

const isActive = computed(() => {
  return (path: string) => {
    if (path === '/') return route.path === '/'
    return route.path.startsWith(path)
  }
})

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <aside
    :class="appStore.sidebarCollapsed ? 'w-16' : 'w-60'"
    class="h-screen bg-forest-700 text-white flex flex-col shrink-0 overflow-hidden"
  >
    <div class="flex items-center gap-2 px-4 py-4 border-b border-forest-600">
      <TreePine class="w-6 h-6 text-forest-300 shrink-0" />
      <span v-if="!appStore.sidebarCollapsed" class="text-base font-bold tracking-wide">苗木基地管理</span>
    </div>

    <RoleSwitcher v-if="!appStore.sidebarCollapsed" />

    <nav class="flex-1 py-2 overflow-y-auto">
      <button
        v-for="item in navItems"
        :key="item.path"
        :class="[
          isActive(item.path)
            ? 'bg-forest-600 text-white'
            : 'text-forest-200 hover:bg-forest-600/50 hover:text-white',
        ]"
        class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
        @click="navigate(item.path)"
      >
        <component :is="item.icon" class="w-5 h-5 shrink-0" />
        <span v-if="!appStore.sidebarCollapsed">{{ item.name }}</span>
      </button>
    </nav>

    <button
      class="flex items-center justify-center py-3 border-t border-forest-600 text-forest-300 hover:text-white transition-colors"
      @click="appStore.toggleSidebar()"
    >
      <ChevronLeft v-if="!appStore.sidebarCollapsed" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>
  </aside>
</template>
