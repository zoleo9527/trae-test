<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo">
        <span class="logo-icon">🌾</span>
        <span class="logo-text">农机合作社管理系统</span>
      </div>
    </div>
    <div class="header-right">
      <div class="alert-bell" @click="goToAlerts">
        <span class="bell-icon">🔔</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </div>
      <div class="user-info" v-if="currentUser">
        <span class="user-name">{{ currentUser.name }}</span>
        <span class="user-role">{{ getRoleName(currentUser.role) }}</span>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAlertStore } from '../stores/alert'

const router = useRouter()
const userStore = useUserStore()
const alertStore = useAlertStore()

const currentUser = computed(() => userStore.currentUser)
const unreadCount = computed(() => {
  if (!currentUser.value) return 0
  return alertStore.alerts.filter(a => a.assignee === currentUser.value.id && a.status === 'unread').length
})

const getRoleName = (role) => userStore.getRoleName(role)

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}

function goToAlerts() {
  router.push('/alerts')
}

onMounted(async () => {
  await userStore.restoreSession()
  await alertStore.loadAlerts()
})
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.alert-bell {
  position: relative;
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
}

.alert-bell:hover {
  opacity: 0.7;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.user-role {
  padding: 2px 8px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
}

.logout-btn {
  padding: 4px 12px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}
</style>
