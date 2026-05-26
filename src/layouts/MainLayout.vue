<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28"><Odometer /></el-icon>
        <span>回收站管理</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :router="true"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        
        <el-menu-item v-if="showWeighing" index="/weighing">
          <el-icon><Scale /></el-icon>
          <span>车辆过磅</span>
        </el-menu-item>
        
        <el-menu-item v-if="showSettlement" index="/settlement">
          <el-icon><Money /></el-icon>
          <span>结算复核</span>
        </el-menu-item>
        
        <el-menu-item index="/trace">
          <el-icon><Connection /></el-icon>
          <span>追踪溯源</span>
        </el-menu-item>
        
        <el-menu-item index="/vehicles">
          <el-icon><Van /></el-icon>
          <span>车辆管理</span>
        </el-menu-item>
        
        <el-menu-item index="/env-records">
          <el-icon><Document /></el-icon>
          <span>环保台账</span>
        </el-menu-item>
        
        <el-menu-item index="/exceptions">
          <el-icon><Warning /></el-icon>
          <span>异常处理</span>
        </el-menu-item>
        
        <el-menu-item v-if="isOwner" index="/materials">
          <el-icon><Box /></el-icon>
          <span>物料价格</span>
        </el-menu-item>
        
        <el-menu-item v-if="isOwner" index="/logs">
          <el-icon><List /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ authStore.user?.name }}
              <span class="role-tag">{{ roleText }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const isOwner = computed(() => authStore.user?.role === 'owner')
const showWeighing = computed(() => ['owner', 'weigher'].includes(authStore.user?.role))
const showSettlement = computed(() => ['owner', 'accountant'].includes(authStore.user?.role))

const roleText = computed(() => {
  const roles = {
    owner: '站长',
    weigher: '过磅员',
    accountant: '财务'
  }
  return roles[authStore.user?.role] || ''
})

const currentPageTitle = computed(() => {
  const titles = {
    '/dashboard': '工作台',
    '/weighing': '车辆过磅',
    '/settlement': '结算复核',
    '/trace': '追踪溯源',
    '/vehicles': '车辆管理',
    '/materials': '物料价格',
    '/logs': '操作日志',
    '/exceptions': '异常处理',
    '/env-records': '环保台账'
  }
  for (const [path, title] of Object.entries(titles)) {
    if (route.path.startsWith(path)) return title
  }
  return ''
})

function handleCommand(command) {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.sidebar {
  background-color: #304156;
  height: 100%;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header {
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e4e7ed;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.role-tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
}

.main-content {
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
