<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  ClipboardList,
  CalendarClock,
  PackageCheck,
  RotateCcw,
  Undo2,
  Store,
  Sun,
  Moon,
} from 'lucide-vue-next'
import { useRole } from '@/composables/useRole'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const router = useRouter()
const { currentRole, roleName, setRole } = useRole()
const { isDark, toggleTheme } = useTheme()

const navCollapsed = ref(false)

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '工作面' },
  { path: '/orders', icon: ClipboardList, label: '订单与改单' },
  { path: '/schedule', icon: CalendarClock, label: '产能排期' },
  { path: '/pickup', icon: PackageCheck, label: '到店自提' },
  { path: '/remake', icon: RotateCcw, label: '异常补做' },
  { path: '/refund', icon: Undo2, label: '退款复盘' },
]

const roles = [
  { value: 'manager', label: '门店主理人' },
  { value: 'kitchen', label: '后厨负责人' },
  { value: 'service', label: '客服' },
] as const

const currentPath = computed(() => route.path)

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="flex h-screen bg-bakery-100 overflow-hidden">
    <aside
      class="flex flex-col bg-white border-r border-bakery-200 transition-all duration-300"
      :class="navCollapsed ? 'w-16' : 'w-56'"
    >
      <div class="flex items-center gap-2 px-4 py-4 border-b border-bakery-200">
        <div class="w-8 h-8 rounded-lg bg-bakery-500 flex items-center justify-center flex-shrink-0">
          <Store class="w-5 h-5 text-white" />
        </div>
        <span
          v-if="!navCollapsed"
          class="font-bold text-bakery-800 text-sm truncate"
        >
          手作烘焙坊
        </span>
      </div>

      <nav class="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <div
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ 'nav-item-active': currentPath === item.path }"
          @click="navigate(item.path)"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!navCollapsed" class="text-sm truncate">{{ item.label }}</span>
        </div>
      </nav>

      <div class="p-2 border-t border-bakery-200">
        <button
          class="nav-item w-full justify-center"
          @click="navCollapsed = !navCollapsed"
          title="折叠/展开导航"
        >
          <span class="text-xs text-bakery-500">
            {{ navCollapsed ? '→' : '← 收起' }}
          </span>
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="bg-white border-b border-bakery-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-semibold text-bakery-800">
            {{ navItems.find(n => n.path === currentPath)?.label || '工作台' }}
          </h1>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1 bg-bakery-100 rounded-lg p-1">
            <button
              v-for="role in roles"
              :key="role.value"
              class="px-3 py-1.5 text-sm rounded-md transition-colors"
              :class="currentRole === role.value ? 'bg-white text-bakery-800 shadow-sm font-medium' : 'text-bakery-600 hover:text-bakery-800'"
              @click="setRole(role.value)"
            >
              {{ role.label }}
            </button>
          </div>

          <div class="flex items-center gap-2 text-sm text-bakery-600">
            <span>当前：{{ roleName }}</span>
          </div>

          <button
            class="p-2 rounded-lg hover:bg-bakery-100 transition-colors"
            @click="toggleTheme"
            title="切换主题"
          >
            <Sun v-if="isDark" class="w-5 h-5 text-bakery-600" />
            <Moon v-else class="w-5 h-5 text-bakery-600" />
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>