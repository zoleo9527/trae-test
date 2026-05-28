<template>
  <div class="flex h-screen bg-gray-50">
    <aside class="w-64 bg-white shadow-lg">
      <div class="p-6 border-b">
        <h1 class="text-xl font-bold text-blue-600 flex items-center gap-2">
          <component :is="icons.Home" class="w-6 h-6" />
          游学营地管理
        </h1>
      </div>
      <nav class="p-4">
        <ul class="space-y-2">
          <li v-for="item in menuItems" :key="item.path">
            <router-link
              :to="item.path"
              class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
              :class="{
                'bg-blue-50 text-blue-600': isActive(item.path),
                'text-gray-600 hover:bg-gray-50': !isActive(item.path),
              }"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <span>{{ item.name }}</span>
              <span
                v-if="item.badge"
                class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
              >
                {{ item.badge }}
              </span>
            </router-link>
          </li>
        </ul>
      </nav>
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <component :is="icons.User" class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div class="font-medium text-gray-800">{{ user?.name || '用户' }}</div>
            <div class="text-sm text-gray-500">{{ roleName }}</div>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <component :is="icons.LogOut" class="w-4 h-4" />
          退出登录
        </button>
      </div>
    </aside>

    <main class="flex-1 overflow-auto">
      <header class="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h2>
        <div class="flex items-center gap-4">
          <el-tag :type="roleTagType" size="large">
            当前角色: {{ roleName }}
          </el-tag>
        </div>
      </header>
      <div class="p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import * as icons from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.user)

const roleName = computed(() => {
  const roles: Record<string, string> = {
    director: '营地主任',
    teacher: '班务老师',
    logistics: '后勤协调',
  }
  return roles[user.value?.role] || '未知'
})

const roleTagType = computed(() => {
  const types: Record<string, string> = {
    director: 'danger',
    teacher: 'primary',
    logistics: 'success',
  }
  return types[user.value?.role] || 'info'
})

const menuItems = computed(() => {
  const baseMenu = [
    { path: '/dashboard', name: '仪表盘', icon: icons.LayoutDashboard },
    { path: '/campers', name: '营员管理', icon: icons.Users },
    { path: '/rooms', name: '分房管理', icon: icons.BedDouble },
    { path: '/materials', name: '物资管理', icon: icons.Package },
    { path: '/resupply', name: '补领申请', icon: icons.RefreshCw },
    { path: '/check-in', name: '活动签到', icon: icons.CalendarCheck },
    { path: '/medical', name: '医疗上报', icon: icons.Heart },
  ]
  return baseMenu
})

const pageTitle = computed(() => {
  return route.meta?.title as string || '仪表盘'
})

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  userStore.loadUser()
})
</script>
