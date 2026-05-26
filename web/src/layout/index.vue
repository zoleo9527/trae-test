<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon><OfficeBuilding /></el-icon>
        <span>家具展厅管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/calendar">
          <el-icon><Calendar /></el-icon>
          <span>安装日历</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Tickets /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/installations">
          <el-icon><Tools /></el-icon>
          <span>安装预约</span>
        </el-menu-item>
        <el-menu-item index="/acceptances">
          <el-icon><CircleCheck /></el-icon>
          <span>验收回单</span>
        </el-menu-item>
        <el-menu-item index="/exceptions">
          <el-icon><Warning /></el-icon>
          <span>异常处理</span>
        </el-menu-item>
        <el-menu-item index="/samples">
          <el-icon><Box /></el-icon>
          <span>样品管理</span>
        </el-menu-item>
        <el-menu-item index="/customers">
          <el-icon><User /></el-icon>
          <span>客户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-button type="primary" text @click="showNotifications = true">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-dropdown @command="handleUserSwitch">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              <span>{{ userStore.currentUser.name }}</span>
              <el-tag :type="roleTagType" size="small">{{ userStore.currentUser.roleName }}</el-tag>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="user in userStore.roleList"
                  :key="user.name"
                  :command="user"
                  :disabled="user.name === userStore.currentUser.name"
                >
                  {{ user.name }} ({{ user.roleName }})
                  <el-tag v-if="user.name === userStore.currentUser.name" type="success" size="small">当前</el-tag>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
    <el-drawer v-model="showNotifications" title="消息通知" size="480px">
      <div class="notification-list">
        <div class="notification-actions">
          <el-button size="small" @click="markAllRead">全部已读</el-button>
        </div>
        <el-empty v-if="notifications.length === 0" description="暂无通知" />
        <div
          v-for="item in notifications"
          :key="item.id"
          class="notification-item"
          :class="{ unread: !item.isRead }"
          @click="handleNotificationClick(item)"
        >
          <div class="notification-header">
            <el-tag :type="priorityType(item.priority)" size="small">{{ priorityLabel(item.priority) }}</el-tag>
            <span class="notification-time">{{ formatDateTime(item.createdAt) }}</span>
          </div>
          <div class="notification-title">{{ item.title }}</div>
          <div class="notification-content">{{ item.content }}</div>
        </div>
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { notificationApi } from '@/api'
import { notificationPriorityMap, formatDateTime } from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const showNotifications = ref(false)
const notifications = ref<any[]>([])
const unreadCount = ref(0)

const activeMenu = computed(() => route.path)
const roleTagType = computed(() => {
  const map: Record<string, string> = {
    manager: 'danger',
    sales: 'primary',
    coordinator: 'warning',
    installer: 'success'
  }
  return map[userStore.currentUser.role] || 'info'
})

function handleUserSwitch(user: any) {
  userStore.switchUser(user)
  loadNotifications()
}

function priorityType(priority: string) {
  return notificationPriorityMap[priority]?.type || 'info'
}

function priorityLabel(priority: string) {
  return notificationPriorityMap[priority]?.label || '普通'
}

async function loadNotifications() {
  try {
    const res = await notificationApi.getList({ pageSize: 20, isRead: false })
    notifications.value = res.items || []
    unreadCount.value = res.total || 0
  } catch (e) {}
}

async function markAllRead() {
  await notificationApi.markAllAsRead()
  loadNotifications()
}

function handleNotificationClick(item: any) {
  if (!item.isRead) {
    notificationApi.markAsRead(item.id)
    item.isRead = true
    unreadCount.value--
  }
  if (item.relatedOrderId) {
    router.push(`/orders/${item.relatedOrderId}`)
    showNotifications.value = false
  }
}

onMounted(() => {
  loadNotifications()
  setInterval(loadNotifications, 30000)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background: #001529;
  color: #fff;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu {
  border-right: none;
  background: #001529;
}

.menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.7);
}

.menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu :deep(.el-menu-item.is-active) {
  background: #1890ff;
  color: #fff;
}

.header {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.main {
  background: #f5f7fa;
  overflow-y: auto;
  padding: 0;
}

.notification-badge {
  margin-right: 10px;
}

.notification-list {
  padding: 10px 0;
}

.notification-actions {
  padding: 0 20px 10px;
  border-bottom: 1px solid #f0f0f0;
}

.notification-item {
  padding: 12px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item.unread {
  background: #e6f7ff;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.notification-content {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
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
