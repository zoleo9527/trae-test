<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="48" color="#409EFF"><Reading /></el-icon>
        <h1>城市书房</h1>
        <p>志愿者排班与反馈系统</p>
      </div>
      
      <el-form :model="loginForm" class="login-form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-select v-model="loginForm.role" placeholder="选择角色登录" size="large" style="width: 100%">
            <el-option label="馆长 - director" value="director">
              <div class="role-option">
                <span class="role-name">张馆长</span>
                <el-tag type="info" size="small">全局管理</el-tag>
              </div>
            </el-option>
            <el-option label="志愿者协调 - coordinator" value="coordinator">
              <div class="role-option">
                <span class="role-name">李协调</span>
                <el-tag type="primary" size="small">排班管理</el-tag>
              </div>
            </el-option>
            <el-option label="活动运营 - operator" value="operator">
              <div class="role-option">
                <span class="role-name">王运营</span>
                <el-tag type="warning" size="small">活动反馈</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码: 123456"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleLogin">
            登录系统
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-tips">
        <el-alert
          title="演示说明"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>默认密码: 123456</p>
            <p>不同角色看到的功能和数据不同</p>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const loginForm = ref({
  role: 'director',
  password: '123456'
})

function handleLogin() {
  if (!loginForm.value.role) {
    ElMessage.warning('请选择登录角色')
    return
  }
  if (!loginForm.value.password) {
    ElMessage.warning('请输入密码')
    return
  }
  
  loading.value = true
  
  setTimeout(() => {
    const success = userStore.switchRole(loginForm.value.role)
    if (success) {
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error('登录失败，请检查密码')
    }
    loading.value = false
  }, 500)
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  margin: 16px 0 8px;
  font-size: 28px;
  color: #303133;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.role-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.role-name {
  font-weight: 500;
}

.login-tips {
  font-size: 12px;
}

.login-tips p {
  margin: 4px 0;
  color: #606266;
}
</style>
