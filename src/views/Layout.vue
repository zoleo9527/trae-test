<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="sidebar-header">
        <div class="logo">🏪</div>
        <div class="brand">文创商店</div>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>业务看板</span>
        </el-menu-item>
        
        <template v-if="isManager || isPlanner">
          <el-menu-item index="/members">
            <el-icon><User /></el-icon>
            <span>会员管理</span>
          </el-menu-item>
        </template>
        
        <template v-if="isPlanner || isWarehouse">
          <el-menu-item index="/products">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
        </template>
        
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <span>兑换订单</span>
          <el-badge v-if="pendingCount > 0" :value="pendingCount" class="menu-badge" />
        </el-menu-item>
        
        <template v-if="isManager">
          <el-menu-item index="/verify">
            <el-icon><CircleCheck /></el-icon>
            <span>核销管理</span>
          </el-menu-item>
        </template>
        
        <template v-if="isWarehouse">
          <el-menu-item index="/inventory">
            <el-icon><Box /></el-icon>
            <span>库存管理</span>
          </el-menu-item>
        </template>
        
        <el-menu-item index="/inspection">
          <el-icon><Warning /></el-icon>
          <span>巡店问题</span>
          <el-badge v-if="issueCount > 0" :value="issueCount" type="warning" class="menu-badge" />
        </el-menu-item>
        
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>系统说明</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <div class="current-role">
            <span class="role-tag" :class="currentRoleClass">
              {{ currentRoleLabel }}
            </span>
          </div>
          
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <span class="avatar">{{ currentUser?.avatar }}</span>
              <span class="username">{{ currentUser?.name }}</span>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="switch">切换角色</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  DataBoard, User, Goods, Document, CircleCheck, 
  Box, Warning, Setting, ArrowDown 
} from '@element-plus/icons-vue'
import { useAuthStore, useOrderStore } from '@/stores'
import { RoleLabels } from '@/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const orderStore = useOrderStore()

const currentUser = computed(() => authStore.currentUser)
const isManager = computed(() => authStore.isManager)
const isPlanner = computed(() => authStore.isPlanner)
const isWarehouse = computed(() => authStore.isWarehouse)

const currentRoleLabel = computed(() => {
  if (!currentUser.value) return ''
  return RoleLabels[currentUser.value.role] || ''
})

const currentRoleClass = computed(() => {
  if (!currentUser.value) return ''
  return `role-${currentUser.value.role.replace('_', '-')}`
})

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  return (route.meta.title as string) || '业务看板'
})

const pendingCount = computed(() => {
  const orders = orderStore.orders.filter(o => {
    if (isWarehouse.value) {
      return o.status === 'confirmed'
    }
    if (isManager.value) {
      return o.status === 'pending' || o.status === 'delivered' || 
             (o.status === 'shipped' && o.storeId === currentUser.value?.storeId)
    }
    return o.status === 'pending'
  })
  return orders.length
})

const issueCount = computed(() => {
  return orderStore.getMyPendingIssues(
    currentUser.value?.role || 'store_manager',
    currentUser.value?.storeId,
    currentUser.value?.id
  ).length
})

const handleMenuSelect = (index: string) => {
  router.push(index)
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (command === 'switch') {
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.sidebar {
  background: #001529;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header .logo {
  font-size: 28px;
  margin-right: 10px;
}

.sidebar-header .brand {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background: transparent;
}

.sidebar-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.7);
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: #1890ff;
  color: white;
}

.menu-badge {
  margin-left: 5px;
}

.header {
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.role-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.role-store-manager {
  background: #e6f7ff;
  color: #1890ff;
}

.role-planner {
  background: #f6ffed;
  color: #52c41a;
}

.role-warehouse {
  background: #fff7e6;
  color: #fa8c16;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 6px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f5f5;
}

.user-info .avatar {
  font-size: 24px;
  margin-right: 8px;
}

.user-info .username {
  margin-right: 5px;
  color: #333;
}

.user-info .dropdown-icon {
  color: #999;
  font-size: 12px;
}

.main-content {
  background: #f0f2f5;
  padding: 24px;
  overflow-y: auto;
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
