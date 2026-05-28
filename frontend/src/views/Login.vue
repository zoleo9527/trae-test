<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <component :is="icons.Home" class="w-8 h-8 text-blue-600" />
        </div>
        <h1 class="text-2xl font-bold text-gray-800">游学营地管理系统</h1>
        <p class="text-gray-500 mt-2">请选择您的角色登录</p>
      </div>

      <div class="space-y-3">
        <button
          v-for="role in roles"
          :key="role.value"
          @click="handleLogin(role)"
          class="w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all hover:border-blue-500 hover:bg-blue-50"
          :class="{ 'border-blue-500 bg-blue-50': selectedRole === role.value }"
        >
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center"
            :class="role.bgColor"
          >
            <component :is="role.icon" class="w-6 h-6 text-white" />
          </div>
          <div class="flex-1 text-left">
            <div class="font-semibold text-gray-800">{{ role.name }}</div>
            <div class="text-sm text-gray-500">{{ role.desc }}</div>
          </div>
          <component :is="icons.ChevronRight" class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div class="mt-6 p-4 bg-gray-50 rounded-xl">
        <p class="text-sm text-gray-600">
          <component :is="icons.Info" class="w-4 h-4 inline mr-1" />
          演示账号：选择任意角色即可进入系统体验不同功能
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import * as icons from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()
const selectedRole = ref('')

const roles = [
  {
    value: 'director',
    name: '营地主任',
    desc: '审核补领申请、查看全局数据',
    icon: icons.UserCheck,
    bgColor: 'bg-red-500',
  },
  {
    value: 'teacher',
    name: '班务老师',
    desc: '发起补领、确认发放、家长回访',
    icon: icons.User,
    bgColor: 'bg-blue-500',
  },
  {
    value: 'logistics',
    name: '后勤协调',
    desc: '物资发放、库存管理',
    icon: icons.Package,
    bgColor: 'bg-green-500',
  },
]

const handleLogin = (role: any) => {
  selectedRole.value = role.value
  userStore.setUser({
    id: '1',
    name: role.name,
    role: role.value,
    username: role.value,
  })
  router.push('/dashboard')
}
</script>
