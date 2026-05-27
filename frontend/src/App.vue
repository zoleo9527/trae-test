<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const currentRole = ref('OPERATION_MANAGER');

const menuItems = [
  { path: '/dashboard', name: '控制台', icon: '📊' },
  { path: '/workflow', name: '退款申诉', icon: '🔄' },
  { path: '/batch-review', name: '批量复核', icon: '✅' },
  { path: '/stations', name: '站点管理', icon: '🏪' },
  { path: '/tasks', name: '任务中心', icon: '📋' },
];

const roleLabels: Record<string, string> = {
  OPERATION_MANAGER: '运营主管',
  INSPECTOR: '巡检员',
  CUSTOMER_SERVICE: '客服',
};
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">🚗</span>
        <span class="logo-text">自助洗车运营</span>
      </div>
      
      <nav class="nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="role-switcher">
        <span class="text-sm text-gray-500">当前角色：</span>
        <select v-model="currentRole" class="select mt-1">
          <option value="OPERATION_MANAGER">运营主管</option>
          <option value="INSPECTOR">巡检员</option>
          <option value="CUSTOMER_SERVICE">客服</option>
        </select>
      </div>
    </aside>

    <main class="main">
      <header class="header">
        <h1 class="page-title">{{ menuItems.find(m => m.path === route.path)?.name }}</h1>
        <div class="header-right">
          <span class="badge badge-info">{{ roleLabels[currentRole] }}</span>
        </div>
      </header>
      <div class="content">
        <router-view v-slot="{ Component }">
          <component :is="Component" :userRole="currentRole" />
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--gray-200);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 2rem;
  padding: 0 0.5rem;
}

.logo-icon {
  font-size: 1.5rem;
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: var(--gray-600);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: var(--gray-100);
  color: var(--gray-800);
}

.nav-item.active {
  background-color: var(--primary-color);
  color: white;
}

.nav-icon {
  font-size: 1.125rem;
}

.role-switcher {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid var(--gray-200);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.content {
  flex: 1;
  padding: 1.5rem 2rem;
  overflow-y: auto;
  background-color: var(--gray-50);
}
</style>
