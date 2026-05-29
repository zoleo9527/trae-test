<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28"><Tools /></el-icon>
        <span>汽配商行</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/customers" v-if="isBoss || isSales">
          <el-icon><User /></el-icon>
          <span>客户管理</span>
        </el-menu-item>
        <el-menu-item index="/inventory">
          <el-icon><Box /></el-icon>
          <span>库存管理</span>
        </el-menu-item>
        <el-menu-item index="/payments" v-if="isBoss || isSales">
          <el-icon><Money /></el-icon>
          <span>回款管理</span>
        </el-menu-item>
        <el-menu-item index="/reminders">
          <el-icon><Bell /></el-icon>
          <span>催办任务</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="role-badge" :class="userRole.toLowerCase()">{{ userRoleDisplay }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" style="background-color: #409EFF;">
                {{ userName.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
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

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../store/auth'
import { Tools, DataAnalysis, Document, User, Box, Money, Bell, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)
const userRole = computed(() => authStore.userRole)
const userName = computed(() => authStore.userName)
const isBoss = computed(() => authStore.isBoss)
const isSales = computed(() => authStore.isSales)

const userRoleDisplay = computed(() => {
  const roleMap = { BOSS: '门店老板', SALES: '配件销售', WAREHOUSE: '库管' }
  return roleMap[userRole.value] || userRole.value
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      authStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
    } catch {}
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b2f3a;
}

.logo .el-icon {
  margin-right: 8px;
}

.sidebar-menu {
  border: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}

.role-badge.boss { background-color: #f56c6c; }
.role-badge.sales { background-color: #67c23a; }
.role-badge.warehouse { background-color: #e6a23c; }

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-name {
  margin: 0 8px;
  color: #333;
}

.main-content {
  background-color: #f0f2f5;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
