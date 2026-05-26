<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <span class="logo-icon">🌾</span>
        <h1 class="login-title">农机合作社管理系统</h1>
        <p class="login-subtitle">地块进度与回访评价</p>
      </div>
      
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-item">
          <label class="form-label">用户名</label>
          <input 
            type="text" 
            v-model="username" 
            class="form-input" 
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div class="form-item">
          <label class="form-label">密码</label>
          <input 
            type="password" 
            v-model="password" 
            class="form-input" 
            placeholder="请输入密码"
            required
          />
        </div>
        
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="login-tips">
        <p class="tips-title">演示账号：</p>
        <div class="tips-list">
          <div class="tip-item">
            <span class="tip-role">理事：</span>
            <span class="tip-account">director / 123456</span>
          </div>
          <div class="tip-item">
            <span class="tip-role">调度：</span>
            <span class="tip-account">dispatcher / 123456</span>
          </div>
          <div class="tip-item">
            <span class="tip-role">机手：</span>
            <span class="tip-account">operator / 123456</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const userStore = useUserStore()
const toastStore = useToastStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    const success = await userStore.login(username.value, password.value)
    if (success) {
      toastStore.success('登录成功')
      router.push('/')
    } else {
      toastStore.error('用户名或密码错误')
    }
  } catch (e) {
    toastStore.error('登录失败，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const hasSession = await userStore.restoreSession()
  if (hasSession) {
    router.push('/')
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #999;
}

.login-form {
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  margin-top: 8px;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-tips {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.tips-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
  font-weight: 500;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
}

.tip-role {
  width: 48px;
  font-weight: 500;
  color: #333;
}

.tip-account {
  font-family: monospace;
  background: #e8e8e8;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
