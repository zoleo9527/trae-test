<template>
  <div class="flex h-screen bg-gray-50">
    <aside class="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div class="h-14 flex items-center px-4 border-b border-gray-200">
        <el-icon class="text-blue-500 text-2xl"><Reading /></el-icon>
        <span class="ml-2 font-bold text-gray-800">洗涤工厂管理系统</span>
      </div>
      
      <nav class="flex-1 py-4">
        <div class="space-y-1">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="sidebar-menu-item flex items-center px-4 py-3 text-gray-600 hover:text-blue-600 cursor-pointer"
            :class="{ 'active text-blue-600': activeMenu === item.path }"
          >
            <el-icon class="text-lg"><component :is="item.icon" /></el-icon>
            <span class="ml-3">{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <div class="p-4 border-t border-gray-200">
        <div class="text-xs text-gray-500 text-center">v1.0.0</div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div class="flex items-center">
          <h1 class="text-lg font-semibold text-gray-800">{{ currentRoute.meta.title }}</h1>
        </div>
        
        <div class="flex items-center space-x-4">
          <el-dropdown trigger="click">
            <div class="flex items-center cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg">
              <el-icon class="text-gray-500"><User /></el-icon>
              <span class="ml-2 text-sm text-gray-700">{{ userStore.currentUser.name }}</span>
              <el-tag :type="roleTagType" size="small" class="ml-2">{{ roleLabel }}</el-tag>
              <el-icon class="ml-1 text-gray-400"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="user in availableUsers"
                  :key="user.id"
                  @click="userStore.switchUser(user.id)"
                >
                  {{ user.name }}
                  <span class="text-gray-400 text-xs ml-2">{{ getUserRoleLabel(user.role) }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { USER_ROLE_LABELS, USERS } from '@/constants';
import type { UserRole } from '@/types';

const route = useRoute();
const userStore = useUserStore();

const menuItems = [
  { path: '/workbench', name: '工作台', icon: 'Odometer' },
  { path: '/orders', name: '订单管理', icon: 'Document' },
  { path: '/batches', name: '批次追踪', icon: 'Tickets' },
  { path: '/complaints', name: '客诉赔付', icon: 'Warning' },
  { path: '/settlement', name: '月结对账', icon: 'Money' }
];

const activeMenu = computed(() => route.path);
const currentRoute = computed(() => route);

const roleLabel = computed(() => USER_ROLE_LABELS[userStore.currentUser.role]);
const roleTagType = computed(() => {
  const map: Record<UserRole, string> = {
    factory_manager: 'danger',
    quality_inspector: 'success',
    store_manager: 'warning'
  };
  return map[userStore.currentUser.role] || 'info';
});

const availableUsers = computed(() => USERS);

function getUserRoleLabel(role: UserRole) {
  return USER_ROLE_LABELS[role];
}
</script>

<style scoped>
</style>
