<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-amber-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span class="text-white text-2xl">📷</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">胶片冲扫管理系统</h1>
        <p class="text-gray-500 mt-2">请登录以继续</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input
            v-model="username"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="请输入用户名"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            v-model="password"
            type="password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </div>
        
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
        <p class="font-medium text-gray-700 mb-2">测试账号：</p>
        <ul class="space-y-1 text-gray-600">
          <li>店主：owner / owner123</li>
          <li>冲印师：tech / tech123</li>
          <li>客服：service / service123</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const username = ref('service')
const password = ref('service123')
const loading = ref(false)
const error = ref('')

const { login } = useAuth()

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  const result = await login(username.value, password.value)
  
  if (result.success) {
    navigateTo('/')
  } else {
    error.value = result.error || '登录失败'
  }
  
  loading.value = false
}
</script>
