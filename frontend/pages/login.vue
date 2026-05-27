<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <div class="login-logo-icon">💧</div>
        <h1 class="login-title">桶装水配送管理系统</h1>
        <p class="login-subtitle">订水路线与司机签收平台</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div v-if="error" class="login-error">{{ error }}</div>

        <div class="input-group">
          <label class="input-label">用户名</label>
          <input
            v-model="username"
            type="text"
            class="input"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div class="input-group">
          <label class="input-label">密码</label>
          <input
            v-model="password"
            type="password"
            class="input"
            placeholder="请输入密码"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--gray-200);">
        <p style="font-size: 12px; color: var(--gray-500); margin-bottom: 8px;">测试账号：</p>
        <div style="font-size: 12px; color: var(--gray-600); line-height: 1.8;">
          <div>站长：admin / admin123</div>
          <div>司机：driver1 / 123456</div>
          <div>客服：cs1 / 123456</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const username = ref('admin')
const password = ref('admin123')
const loading = ref(false)
const error = ref('')

const { login, isAuthenticated } = useAuth()

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  const result = await login(username.value, password.value)

  if (result.success) {
    navigateTo('/dashboard')
  } else {
    error.value = '用户名或密码错误，请重试'
  }

  loading.value = false
}

watch(isAuthenticated, (val) => {
  if (val) {
    navigateTo('/dashboard')
  }
})
</script>
