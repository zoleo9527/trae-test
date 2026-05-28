<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">🏪</div>
        <h1>文创商店</h1>
        <p class="subtitle">会员积分与兑换核销系统</p>
      </div>
      
      <div class="role-selector">
        <p class="tip">请选择您的角色登录</p>
        <div class="role-list">
          <div 
            v-for="user in mockUsers" 
            :key="user.id"
            class="role-item"
            @click="handleLogin(user.id)"
          >
            <div class="avatar">{{ user.avatar }}</div>
            <div class="info">
              <div class="name">{{ user.name }}</div>
              <div class="role">{{ getRoleLabel(user.role) }}</div>
            </div>
            <el-icon class="arrow"><Right /></el-icon>
          </div>
        </div>
      </div>

      <div class="demo-tip">
        <el-alert 
          title="演示说明" 
          type="info" 
          :closable="false"
          show-icon
        >
          <template #default>
            <p>系统包含3种角色：店长、企划专员、仓管</p>
            <p>不同角色看到的功能和数据范围不同</p>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Right } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores'
import { mockUsers } from '@/data/mock'
import { RoleLabels } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const getRoleLabel = (role: string) => {
  return RoleLabels[role as keyof typeof RoleLabels] || role
}

const handleLogin = (userId: string) => {
  authStore.login(userId)
  router.push('/dashboard')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  font-size: 48px;
  margin-bottom: 10px;
}

.login-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.role-selector .tip {
  text-align: center;
  color: #999;
  margin-bottom: 15px;
  font-size: 14px;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.role-item:hover {
  border-color: #667eea;
  background: #f8f9ff;
  transform: translateX(5px);
}

.role-item .avatar {
  font-size: 32px;
  margin-right: 15px;
}

.role-item .info {
  flex: 1;
}

.role-item .name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.role-item .role {
  color: #999;
  font-size: 13px;
  margin-top: 3px;
}

.role-item .arrow {
  color: #ccc;
}

.demo-tip {
  margin-top: 25px;
}
</style>
