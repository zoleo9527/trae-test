<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">礼品定制售后系统</h1>
        <span class="app-subtitle">售后补单 · 退款处理 · 全程追溯</span>
      </div>
      <div class="header-right">
        <div class="role-switcher">
          <span class="role-label">当前角色：</span>
          <select v-model="currentRoleKey" class="role-select" @change="handleRoleChange">
            <option v-for="role in roles" :key="role.key" :value="role.key">
              {{ role.name }}
            </option>
          </select>
        </div>
        <div class="user-info">
          <div class="user-avatar">{{ currentUser.avatar }}</div>
          <div class="user-detail">
            <div class="user-name">{{ currentUser.name }}</div>
            <div class="user-dept">{{ currentUser.department }}</div>
          </div>
        </div>
      </div>
    </header>

    <div class="app-body">
      <aside class="app-sidebar">
        <nav class="nav-menu">
          <router-link v-for="item in menuItems" :key="item.path" :to="item.path" class="nav-item">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.name }}</span>
            <span v-if="item.badge && item.badge > 0" class="nav-badge">{{ item.badge }}</span>
          </router-link>
        </nav>
      </aside>

      <main class="app-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from './stores/app'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const route = useRoute()
const { currentRole, currentUser, roles, pendingOrders, afterSalesOrders } = storeToRefs(appStore)

const currentRoleKey = computed({
  get: () => currentRole.value,
  set: (val) => currentRole.value = val
})

function handleRoleChange() {
  appStore.setRole(currentRoleKey.value)
}

const menuItems = computed(() => [
  { path: '/', name: '工作台', icon: '📊' },
  { path: '/orders', name: '订单列表', icon: '📋', badge: currentRole.value !== 'warehouse' ? pendingOrders.value.length : 0 },
  { path: '/aftersales', name: '售后处理', icon: '🔧', badge: afterSalesOrders.value.filter(o =>
    o.afterSales.some(a => a.status === 'pending' || a.status === 'processing')
  ).length },
  { path: '/scan', name: '扫码录入', icon: '📷' },
  { path: '/history', name: '历史追溯', icon: '📜' }
])
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: 64px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.app-subtitle {
  font-size: 13px;
  opacity: 0.85;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.role-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-label {
  font-size: 13px;
  opacity: 0.9;
}

.role-select {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 13px;
  cursor: pointer;
}

.role-select option {
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 20px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-detail {
  text-align: right;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
}

.user-dept {
  font-size: 11px;
  opacity: 0.8;
}

.app-body {
  flex: 1;
  display: flex;
}

.app-sidebar {
  width: 200px;
  background: white;
  border-right: 1px solid #e8e8e8;
}

.nav-menu {
  padding: 16px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: #595959;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
}

.nav-item:hover {
  background: #e6f7ff;
  color: #1890ff;
}

.nav-item.router-link-active {
  background: #e6f7ff;
  color: #1890ff;
  font-weight: 500;
}

.nav-item.router-link-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #1890ff;
}

.nav-icon {
  font-size: 16px;
}

.nav-text {
  flex: 1;
}

.nav-badge {
  background: #f5222d;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.app-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>