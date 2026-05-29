<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">🎞️</span>
        <span class="logo-text">胶片冲印</span>
      </div>

      <nav class="nav-menu">
        <template v-for="item in navItems" :key="item.path">
          <div
            v-if="isNavVisible(item)"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            @click="router.push(item.path)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.name }}</span>
          </div>
        </template>
      </nav>

      <div class="user-section" v-if="authStore.user">
        <div class="user-info" @click="showRoleSwitch = !showRoleSwitch">
          <span class="user-avatar">{{ authStore.user.avatar }}</span>
          <div class="user-details">
            <div class="user-name">{{ authStore.user.name }}</div>
            <div class="user-role">{{ ROLE_LABELS[authStore.user.role] }}</div>
          </div>
          <span class="switch-arrow">▼</span>
        </div>

        <div class="role-switcher" v-if="showRoleSwitch">
          <div
            v-for="u in DEMO_USERS"
            :key="u.username"
            class="role-item"
            :class="{ active: u.username === authStore.user?.username }"
            @click="switchToRole(u.username)"
          >
            <span class="role-avatar">{{ u.avatar }}</span>
            <div class="role-details">
              <div class="role-name">{{ u.name }}</div>
              <div class="role-desc">{{ u.desc }}</div>
            </div>
          </div>
          <div class="logout-btn" @click="handleLogout">
            <span>🚪</span> 退出登录
          </div>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ROLE_LABELS, DEMO_USERS } from '@/utils/constants';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const showRoleSwitch = ref(false);

const navItems = [
  { path: '/', name: '批量复核', icon: '📋', roles: ['owner', 'printer', 'customer_service'] },
  { path: '/film-rolls', name: '胶卷管理', icon: '🎞️', roles: ['owner', 'printer'] },
  { path: '/search', name: '综合查询', icon: '🔍', roles: ['owner', 'printer', 'customer_service'] },
];

function isNavVisible(item: typeof navItems[0]) {
  return authStore.userRole && item.roles.includes(authStore.userRole);
}

function isActive(path: string) {
  return route.path === path;
}

async function switchToRole(username: string) {
  try {
    await authStore.switchRole(username);
    showRoleSwitch.value = false;
    router.push('/');
  } catch (e) {
    console.error('切换角色失败', e);
  }
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
}

.logo {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
}

.nav-menu {
  flex: 1;
  padding: 16px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0 8px;
  border-radius: 8px;
}

.nav-item:hover {
  background: #f5f5f7;
}

.nav-item.active {
  background: #007aff;
  color: #fff;
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
}

.user-section {
  border-top: 1px solid #f0f0f0;
  padding: 16px;
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f5f7;
}

.user-avatar {
  font-size: 32px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
}

.user-role {
  font-size: 12px;
  color: #86868b;
}

.switch-arrow {
  font-size: 10px;
  color: #86868b;
}

.role-switcher {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 8px;
  margin-bottom: 8px;
  z-index: 100;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.role-item:hover {
  background: #f5f5f7;
}

.role-item.active {
  background: #e8f0fe;
}

.role-avatar {
  font-size: 28px;
}

.role-name {
  font-weight: 600;
  font-size: 14px;
}

.role-desc {
  font-size: 12px;
  color: #86868b;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  color: #ff3b30;
  font-weight: 500;
  transition: background 0.2s;
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
}

.logout-btn:hover {
  background: #fff1f0;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
}
</style>
