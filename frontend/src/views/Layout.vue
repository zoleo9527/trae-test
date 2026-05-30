<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo">
        <el-icon :size="28" color="#409EFF"><Reading /></el-icon>
        <span v-show="!isCollapse" class="logo-text">城市书房</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <template v-for="item in menuItems" :key="item.path">
          <el-menu-item :index="item.path" v-if="!item.meta?.roles || item.meta.roles.includes(currentRole)">
            <el-icon><component :is="item.meta.icon" /></el-icon>
            <template #title>{{ item.meta.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :style="{ backgroundColor: avatarColor }">
                {{ userStore.currentUser?.name?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userStore.currentUser?.name }}</span>
              <el-tag :type="roleTagType" size="small">{{ userStore.roleConfig[userStore.currentRole]?.name }}</el-tag>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="switch">切换角色</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
    
    <el-dialog v-model="switchDialogVisible" title="切换角色" width="400px">
      <el-radio-group v-model="targetRole" style="width: 100%">
        <el-radio
          v-for="(config, key) in userStore.roleConfig"
          :key="key"
          :value="key"
          style="display: block; margin: 12px 0; padding: 12px; border: 1px solid #dcdfe6; border-radius: 6px;"
        >
          <div class="role-option">
            <span class="role-label">{{ config.name }}</span>
            <span class="role-desc">{{ config.description }}</span>
          </div>
        </el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="switchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSwitchRole">确认切换</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const switchDialogVisible = ref(false)
const targetRole = ref('')

const menuItems = computed(() => {
  const layoutRoute = router.options.routes.find(r => r.name === 'Layout')
  return layoutRoute?.children || []
})

const activeMenu = computed(() => route.path)
const currentRole = computed(() => userStore.currentRole)

const currentPageTitle = computed(() => {
  return route.meta?.title || '首页'
})

const avatarColor = computed(() => {
  const colors = {
    director: '#9b59b6',
    coordinator: '#3498db',
    operator: '#e67e22'
  }
  return colors[userStore.currentRole] || '#409EFF'
})

const roleTagType = computed(() => {
  const types = {
    director: 'info',
    coordinator: 'primary',
    operator: 'warning'
  }
  return types[userStore.currentRole] || ''
})

function handleCommand(command) {
  if (command === 'switch') {
    targetRole.value = userStore.currentRole
    switchDialogVisible.value = true
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
    }).catch(() => {})
  }
}

function confirmSwitchRole() {
  if (targetRole.value === userStore.currentRole) {
    ElMessage.info('当前已是该角色')
    return
  }
  userStore.switchRole(targetRole.value)
  switchDialogVisible.value = false
  ElMessage.success(`已切换为${userStore.roleConfig[targetRole.value]?.name}`)
  router.push('/dashboard')
}
</script>

<style scoped>
.layout-container {
  height: 100%;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid #1f2d3d;
}

.logo-text {
  margin-left: 12px;
  font-size: 18px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

.layout-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.collapse-btn:hover {
  color: #409EFF;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.layout-main {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

.role-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-label {
  font-weight: 500;
  color: #303133;
}

.role-desc {
  font-size: 12px;
  color: #909399;
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
