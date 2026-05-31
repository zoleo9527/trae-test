<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="card p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            地
          </div>
          <h1 class="text-2xl font-bold text-gray-900">地坪施工管理系统</h1>
          <p class="text-gray-500 mt-2">工地进度与质量复查平台</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input v-model="form.username" type="text" class="input-field" placeholder="请输入用户名" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input v-model="form.password" type="password" class="input-field" placeholder="请输入密码" />
          </div>

          <div v-if="error" class="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {{ error }}
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-500 mb-2">测试账号：</p>
          <div class="text-xs text-gray-600 space-y-1">
            <p>项目负责人：manager / 123456</p>
            <p>质检工程师：inspector / 123456</p>
            <p>班组长：leader1 / 123456</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const authStore = useAuthStore()
const router = useRouter()

const form = ref({
  username: 'manager',
  password: '123456'
})
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(form.value.username, form.value.password)
    router.push('/')
  } catch (e: any) {
    let msg = '登录失败，请检查用户名和密码'
    if (e.data?.detail) {
      msg = e.data.detail
    } else if (e.message?.includes('ERR_CONNECTION') || e.message?.includes('Failed to fetch')) {
      msg = '无法连接到服务器，请确认后端服务已启动'
    } else if (e.message) {
      msg = e.message
    }
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>
