<template>
  <div class="flex h-screen bg-gray-100">
    <aside class="w-64 bg-white shadow-lg flex flex-col">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <component :is="ClipboardList" class="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 class="font-bold text-gray-800">客诉管理</h1>
            <p class="text-xs text-gray-500">赔付与复检系统</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-colors"
          :class="{ 'bg-primary-50 text-primary-600': isActive(item.path) }"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span class="font-medium">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-primary-600 font-semibold">{{ authStore.userName?.charAt(0) }}</span>
            </div>
            <div>
              <p class="font-medium text-gray-800 text-sm">{{ authStore.userName }}</p>
              <p class="text-xs text-gray-500">{{ ROLE_LABELS[authStore.userRole!] }}</p>
            </div>
          </div>
        </div>
        <el-button type="danger" size="small" class="w-full" @click="handleLogout">
          <component :is="LogOut" class="w-4 h-4 mr-1" />
          退出登录
        </el-button>
      </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden">
      <header class="bg-white shadow-sm px-8 py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-800">{{ currentTitle }}</h2>
          <div class="flex items-center gap-4">
            <slot name="header-actions"></slot>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-auto p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  LayoutDashboard,
  FilePlus,
  CheckSquare,
  DollarSign,
  History,
  ClipboardList,
  LogOut,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { ROLE_LABELS } from '../types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const menuItems = computed(() => {
  const items = [
    { path: '/dashboard', label: '批量复核面板', icon: LayoutDashboard },
  ];

  if (authStore.hasRole(['manager', 'picker'])) {
    items.push({ path: '/complaint/new', label: '新建客诉', icon: FilePlus });
  }

  if (authStore.hasRole(['manager', 'accountant'])) {
    items.push({ path: '/compensation', label: '赔付审批', icon: CheckSquare });
    items.push({ path: '/payment', label: '回款跟踪', icon: DollarSign });
  }

  items.push({ path: '/history', label: '历史记录', icon: History });

  return items;
});

const currentTitle = computed(() => route.meta?.title || '批量复核面板');

function isActive(path: string) {
  return route.path.startsWith(path);
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>
