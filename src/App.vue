<script setup lang="ts">
import { useAppStore } from './stores'
import RoleSwitcher from './components/RoleSwitcher.vue'
import Workspace from './components/Workspace.vue'

const store = useAppStore()
</script>

<template>
  <div class="app-root">
    <header class="app-header">
      <div class="flex items-center gap-3">
        <div class="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 3v18" />
          </svg>
        </div>
        <div>
          <h1 class="app-title">家具展厅 · 售后协同工作台</h1>
          <p class="app-subtitle">订单进度 / 补件复核 / 赔付协商 / 样品回收</p>
        </div>
      </div>
      <RoleSwitcher />
    </header>

    <main class="app-main">
      <Workspace />
    </main>

    <div v-if="store.toast" class="toast" :class="'toast-' + store.toast.type">
      {{ store.toast.message }}
    </div>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.logo {
  color: #a5b4fc;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-title {
  color: #ffffff;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.app-subtitle {
  color: #a5b4fc;
  font-size: 12px;
  margin-top: 2px;
}

.app-main {
  flex: 1;
  overflow: hidden;
}
</style>