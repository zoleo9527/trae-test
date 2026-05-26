<template>
  <aside class="sidebar">
    <nav class="nav-menu">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path"
        :to="item.path" 
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const userStore = useUserStore()

const currentUser = computed(() => userStore.currentUser)

const allMenuItems = [
  { path: '/', name: '工作台', icon: '📊', roles: ['director', 'dispatcher', 'operator'] },
  { path: '/plots', name: '地块管理', icon: '🌱', roles: ['director', 'dispatcher', 'operator'] },
  { path: '/tasks', name: '作业任务', icon: '📋', roles: ['director', 'dispatcher', 'operator'] },
  { path: '/fuel', name: '油料管理', icon: '⛽', roles: ['director', 'dispatcher'] },
  { path: '/subsidy', name: '补贴申请', icon: '💰', roles: ['director', 'dispatcher'] },
  { path: '/reviews', name: '回访评价', icon: '⭐', roles: ['director', 'dispatcher', 'operator'] },
  { path: '/alerts', name: '提醒预警', icon: '🔔', roles: ['director', 'dispatcher', 'operator'] },
  { path: '/history', name: '历史记录', icon: '📜', roles: ['director', 'dispatcher'] }
]

const menuItems = computed(() => {
  if (!currentUser.value) return []
  return allMenuItems.filter(item => item.roles.includes(currentUser.value.role))
})

function isActive(path) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar {
  width: 200px;
  background: #001529;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.nav-item.active {
  color: #fff;
  background: #1890ff;
  border-left-color: #fff;
}

.nav-icon {
  font-size: 16px;
}

.nav-text {
  font-size: 14px;
}
</style>
