<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-pattern"></div>
      <div class="bg-glow glow-1"></div>
      <div class="bg-glow glow-2"></div>
    </div>
    
    <div class="login-card">
      <div class="brand">
        <div class="brand-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 20c1.5-3 4-5 10-5s8.5 2 10 5"/>
            <path d="M2 4c1.5 3 4 5 10 5s8.5-2 10-5"/>
            <path d="M2 12c1.5 3 4 5 10 5s8.5-2 10-5"/>
          </svg>
        </div>
        <div class="brand-text">
          <h1>游泳馆运营控制台</h1>
          <p>储物柜分配 · 异常申诉 · 运营管理</p>
        </div>
      </div>

      <div class="login-form">
        <div class="role-selector">
          <div class="label">选择身份</div>
          <div class="role-grid">
            <button
              v-for="role in roles"
              :key="role.id"
              class="role-card"
              :class="{ active: selectedRole === role.id }"
              @click="selectedRole = role.id"
            >
              <div class="role-icon">{{ role.icon }}</div>
              <div class="role-info">
                <div class="role-name">{{ role.name }}</div>
                <div class="role-desc">{{ role.desc }}</div>
              </div>
              <div class="role-check" v-if="selectedRole === role.id">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </button>
          </div>
        </div>

        <button class="btn btn-primary login-btn" @click="handleLogin" :disabled="!selectedRole">
          进入系统
        </button>

        <p class="login-tip">
          演示账号已预设，选择身份即可登录体验
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import dbApi from '@/db'
import { seedDatabase } from '@/db/seed'

const router = useRouter()
const userStore = useUserStore()
const selectedRole = ref<string>('')

const roles = [
  {
    id: 'director',
    name: '馆长',
    icon: '👤',
    desc: '全局运营监控与决策',
    username: 'director'
  },
  {
    id: 'head_coach',
    name: '教练主管',
    icon: '🏊',
    desc: '课程管理与教学质量',
    username: 'head_coach'
  },
  {
    id: 'reception',
    name: '前台客服',
    icon: '💼',
    desc: '储物柜与会员服务',
    username: 'reception'
  }
]

async function handleLogin() {
  const role = roles.find(r => r.id === selectedRole.value)
  if (!role) return
  
  const users = await dbApi.getUsers()
  if (users.length === 0) {
    await seedUsers()
    await seedDatabase()
  }
  
  const success = await userStore.login(role.username)
  if (success) {
    router.push('/dashboard')
  }
}

async function seedUsers() {
  const now = Date.now()
  await window.db.transaction([
    { sql: 'INSERT INTO users (username, name, role, created_at) VALUES (?, ?, ?, ?)', params: ['director', '李明', 'director', now] },
    { sql: 'INSERT INTO users (username, name, role, created_at) VALUES (?, ?, ?, ?)', params: ['head_coach', '王教练', 'head_coach', now] },
    { sql: 'INSERT INTO users (username, name, role, created_at) VALUES (?, ?, ?, ?)', params: ['reception', '张前台', 'reception', now] }
  ])
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #0f172a;
  -webkit-app-region: drag;
}

.login-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.bg-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
  animation: float 8s ease-in-out infinite;
}

.glow-1 {
  width: 300px;
  height: 300px;
  background: #3b82f6;
  top: -100px;
  left: -100px;
}

.glow-2 {
  width: 400px;
  height: 400px;
  background: #8b5cf6;
  bottom: -150px;
  right: -150px;
  animation-delay: -4s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -20px); }
}

.login-card {
  position: relative;
  width: 480px;
  padding: 48px 40px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  -webkit-app-region: no-drag;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 32px;
}

.brand-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 14px;
  color: #fff;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.brand-text h1 {
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.brand-text p {
  font-size: 13px;
  color: #94a3b8;
}

.role-selector {
  margin-bottom: 28px;
}

.role-selector .label {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
}

.role-card:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(148, 163, 184, 0.2);
}

.role-card.active {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.role-icon {
  font-size: 24px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 10px;
}

.role-info {
  flex: 1;
}

.role-name {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 2px;
}

.role-desc {
  font-size: 12px;
  color: #64748b;
}

.role-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  border-radius: 50%;
  color: #fff;
}

.login-btn {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  justify-content: center;
  border-radius: 10px;
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-tip {
  text-align: center;
  font-size: 12px;
  color: #64748b;
  margin-top: 16px;
}
</style>
