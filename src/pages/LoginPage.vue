<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Music, Crown, Headphones, Wrench } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { USERS } from '@/types'
import type { UserRole } from '@/types'
import { cn } from '@/lib/utils'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const selectedRole = ref<UserRole | null>(null)
const isLoading = ref(false)

const roleCards: Array<{
  role: UserRole
  icon: typeof Crown
  name: string
  label: string
  password: string
  color: string
}> = [
  { role: 'boss', icon: Crown, name: USERS.boss.name, label: '门店老板', password: USERS.boss.password, color: 'from-amber-500/20 to-orange-500/20' },
  { role: 'consultant', icon: Headphones, name: USERS.consultant.name, label: '租赁顾问', password: USERS.consultant.password, color: 'from-blue-500/20 to-indigo-500/20' },
  { role: 'repair', icon: Wrench, name: USERS.repair.name, label: '维修师傅', password: USERS.repair.password, color: 'from-emerald-500/20 to-teal-500/20' },
]

const passwords = ref<Record<UserRole, string>>({
  boss: '',
  consultant: '',
  repair: '',
})

async function handleCardClick(role: UserRole, password: string) {
  if (isLoading.value) return
  selectedRole.value = role
  passwords.value[role] = password
  isLoading.value = true

  await new Promise(r => setTimeout(r, 400))

  const success = authStore.login(role, password)
  if (success) {
    notificationStore.showToast(`欢迎回来，${USERS[role].name}`, 'success')
    router.push('/dashboard')
  } else {
    notificationStore.showToast('登录失败，请重试', 'error')
    passwords.value[role] = ''
    selectedRole.value = null
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex items-center justify-center relative overflow-hidden">
    <div class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
    <div class="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
    <div class="absolute top-[30%] right-[15%] w-[200px] h-[200px] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

    <div class="w-full max-w-md mx-4 bg-bg-secondary rounded-xl shadow-2xl shadow-black/40 relative z-10 animate-fade-in">
      <div class="px-8 pt-10 pb-6 text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10 mb-5">
          <Music :size="28" class="text-accent" />
        </div>
        <h1 class="font-serif-title text-3xl text-txt-primary tracking-wide">乐器租赁</h1>
        <p class="text-txt-secondary mt-2 text-sm">订单链路追踪系统</p>
      </div>

      <div class="px-6 pb-8 space-y-3">
        <div
          v-for="card in roleCards"
          :key="card.role"
          @click="handleCardClick(card.role, card.password)"
          :class="cn(
            'relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300',
            selectedRole === card.role
              ? 'border-accent shadow-[0_0_20px_rgba(232,168,56,0.25)] bg-gradient-to-r ' + card.color
              : 'border-border bg-bg-tertiary/50 hover:border-accent/50 hover:shadow-[0_0_12px_rgba(232,168,56,0.12)]'
          )"
        >
          <div
            :class="cn(
              'flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-colors duration-300',
              selectedRole === card.role ? 'bg-accent/20' : 'bg-bg-tertiary'
            )"
          >
            <component
              :is="card.icon"
              :size="22"
              :class="selectedRole === card.role ? 'text-accent' : 'text-txt-muted'"
            />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-txt-primary">{{ card.label }}</p>
            <p class="text-xs text-txt-muted mt-0.5">{{ card.name }}</p>
          </div>

          <div class="flex-shrink-0 w-28">
            <input
              type="password"
              :value="passwords[card.role]"
              readonly
              placeholder="密码"
              class="w-full bg-bg-primary/60 border border-border rounded-lg px-3 py-1.5 text-sm text-txt-primary placeholder:text-txt-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <div
            v-if="selectedRole === card.role && isLoading"
            class="absolute inset-0 flex items-center justify-center bg-bg-secondary/60 rounded-xl"
          >
            <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>

      <div class="px-8 pb-6 text-center">
        <p class="text-xs text-txt-muted">点击角色卡片即可快速登录</p>
      </div>
    </div>
  </div>
</template>
