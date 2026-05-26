<template>
  <div class="main-layout">
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 20c1.5-3 4-5 10-5s8.5 2 10 5"/>
            <path d="M2 4c1.5 3 4 5 10 5s8.5-2 10-5"/>
            <path d="M2 12c1.5 3 4 5 10 5s8.5-2 10-5"/>
          </svg>
          <span>运营控制台</span>
        </div>
      </div>
      
      <nav class="nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge badge" :class="item.badgeClass">
            {{ item.badge }}
          </span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ userStore.userName?.[0] || 'U' }}</div>
          <div class="user-detail">
            <div class="user-name">{{ userStore.userName }}</div>
            <div class="user-role">{{ roleLabel }}</div>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout" title="退出登录">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="main-content">
      <div class="topbar">
        <div class="page-title">{{ currentPageTitle }}</div>
        <div class="topbar-actions">
          <slot name="actions"></slot>
        </div>
      </div>
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ROLE_LABELS } from '@/types'
import { useMenuEvents } from '@/composables/useMenuEvents'

useMenuEvents()

const route = useRoute()
const userStore = useUserStore()

const roleLabel = computed(() => userStore.currentUser ? ROLE_LABELS[userStore.currentUser.role] : '')

const allMenuItems = [
  { path: '/dashboard', label: '控制台', icon: '📊', roles: ['director', 'head_coach', 'reception'] },
  { path: '/lockers', label: '储物柜管理', icon: '🔐', roles: ['director', 'reception'] },
  { path: '/appeals', label: '异常申诉', icon: '⚠️', roles: ['director', 'head_coach', 'reception'], badge: 0, badgeClass: 'badge-error' },
  { path: '/courses', label: '课程表', icon: '📅', roles: ['director', 'head_coach'] },
  { path: '/transactions', label: '储值记录', icon: '💰', roles: ['director', 'reception'] },
  { path: '/patrol', label: '巡场照片', icon: '📷', roles: ['director', 'head_coach'] }
]

const menuItems = computed(() => {
  if (!userStore.currentUser) return []
  return allMenuItems.filter(item => item.roles.includes(userStore.currentUser!.role))
})

const currentPageTitle = computed(() => {
  const item = menuItems.value.find(m => isActive(m.path))
  return item?.label || '控制台'
})

function isActive(path: string): boolean {
  return route.path === path || (path !== '/dashboard' && route.path.startsWith(path))
}

function handleLogout() {
  userStore.logout()
  window.location.href = '/login'
}
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #0f172a 0%, #0c1222 100%);
  border-right: 1px solid rgba(148, 163, 184, 0.08);
  display: flex;
  flex-direction: column;
  -webkit-app-region: drag;
}

.sidebar-header {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  -webkit-app-region: no-drag;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #f1f5f9;
  font-weight: 600;
  font-size: 15px;
}

.logo svg {
  color: #3b82f6;
}

.nav {
  flex: 1;
  padding: 12px 10px;
  overflow-y: auto;
  -webkit-app-region: no-drag;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 13px;
  margin-bottom: 2px;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: rgba(148, 163, 184, 0.08);
  color: #e2e8f0;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  color: #fff;
  font-weight: 500;
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  font-size: 10px;
  padding: 1px 6px;
}

.sidebar-footer {
  padding: 12px 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
  -webkit-app-region: no-drag;
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.user-detail {
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: #64748b;
}

.logout-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.15s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: 48px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  -webkit-app-region: drag;
}

.page-title {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  -webkit-app-region: no-drag;
}

.content-area {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
