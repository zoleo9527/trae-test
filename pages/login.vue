<template>
  <div class="min-h-screen flex">
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-500 to-navy-700 items-center justify-center p-12">
      <div class="text-center text-white max-w-md">
        <div class="w-20 h-20 bg-gold-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-gold">
          <Diamond class="w-10 h-10 text-white" />
        </div>
        <h1 class="font-display text-3xl font-bold mb-4 text-gold-300">珠宝门店管理系统</h1>
        <p class="text-navy-200 mb-8">
          定制订单与镶嵌进度管理平台，让每一件珠宝的诞生都清晰可见。
        </p>
        <div class="space-y-4 text-left bg-navy-600/50 rounded-xl p-6">
          <div class="flex items-start gap-3">
            <CheckCircle class="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
            <p class="text-sm text-navy-100">实时追踪镶嵌工序进度</p>
          </div>
          <div class="flex items-start gap-3">
            <CheckCircle class="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
            <p class="text-sm text-navy-100">异常订单快速响应处理</p>
          </div>
          <div class="flex items-start gap-3">
            <CheckCircle class="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
            <p class="text-sm text-navy-100">高值货品交接全程留痕</p>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-cream-50">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h2 class="font-display text-2xl font-bold text-gray-800 mb-2">欢迎回来</h2>
          <p class="text-gray-500">请登录您的账号继续工作</p>
        </div>

        <BaseCard class="p-8">
          <form @submit.prevent="handleLogin" class="space-y-6">
            <div class="space-y-4">
              <BaseInput
                v-model="username"
                label="用户名"
                placeholder="请输入用户名"
                :icon="User"
                required
              />
              <BaseInput
                v-model="password"
                type="password"
                label="密码"
                placeholder="请输入密码"
                :icon="Lock"
                required
              />
            </div>

            <div v-if="error" class="bg-coral-50 text-coral-600 px-4 py-3 rounded-lg text-sm">
              {{ error }}
            </div>

            <BaseButton type="submit" class="w-full" :loading="loading">
              登录
            </BaseButton>
          </form>

          <div class="mt-6 pt-6 border-t border-gold-100">
            <p class="text-xs text-gray-500 mb-3">测试账号：</p>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="bg-gold-50 p-2 rounded">
                <p class="font-medium text-gold-700">店长</p>
                <p class="text-gray-500">manager</p>
              </div>
              <div class="bg-gold-50 p-2 rounded">
                <p class="font-medium text-gold-700">导购</p>
                <p class="text-gray-500">sales</p>
              </div>
              <div class="bg-gold-50 p-2 rounded">
                <p class="font-medium text-gold-700">售后</p>
                <p class="text-gray-500">service</p>
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-2">密码均为：123456</p>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Diamond, CheckCircle, User, Lock } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  await new Promise(resolve => setTimeout(resolve, 500))

  if (authStore.login(username.value, password.value)) {
    navigateTo('/')
  } else {
    error.value = '用户名或密码错误'
  }

  loading.value = false
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    navigateTo('/')
  }
})
</script>
