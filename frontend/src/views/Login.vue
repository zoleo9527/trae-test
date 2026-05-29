<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo-icon">🎞️</div>
        <h1 class="title">胶片冲印管理系统</h1>
        <p class="subtitle">退款协商与赔付复核</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>

        <div v-if="error" class="error-message">{{ error }}</div>
      </form>

      <div class="quick-switch">
        <p class="switch-title">快速切换角色（演示用）</p>
        <div class="role-cards">
          <div
            v-for="user in DEMO_USERS"
            :key="user.username"
            class="role-card"
            @click="quickLogin(user.username)"
          >
            <span class="role-avatar">{{ user.avatar }}</span>
            <div class="role-info">
              <div class="role-name">{{ user.name }}</div>
              <div class="role-label">{{ ROLE_LABELS[user.role] }}</div>
              <div class="role-desc">{{ user.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ROLE_LABELS, DEMO_USERS } from '@/utils/constants';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  username: '',
  password: '',
});
const loading = ref(false);
const error = ref('');

async function handleLogin() {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login(form.username, form.password);
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (e: any) {
    error.value = e.response?.data?.message || '登录失败，请检查用户名密码';
  } finally {
    loading.value = false;
  }
}

async function quickLogin(username: string) {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login(username, '123456');
    router.push('/');
  } catch (e: any) {
    error.value = '快速登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.login-container {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #86868b;
}

.login-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d2d2d7;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.2s;
}

.form-group input:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover:not(:disabled) {
  background: #0056cc;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 12px;
  padding: 10px;
  background: #fff1f0;
  color: #ff3b30;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
}

.quick-switch {
  border-top: 1px solid #f0f0f0;
  padding-top: 24px;
}

.switch-title {
  font-size: 13px;
  color: #86868b;
  margin-bottom: 16px;
  text-align: center;
}

.role-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #f5f5f7;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-card:hover {
  background: #e8f0fe;
  transform: translateX(4px);
}

.role-avatar {
  font-size: 36px;
}

.role-name {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
}

.role-label {
  font-size: 12px;
  color: #007aff;
  font-weight: 500;
}

.role-desc {
  font-size: 12px;
  color: #86868b;
}
</style>
