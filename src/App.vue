<template>
  <div class="app">
    <app-header />
    <div class="main-container">
      <app-sidebar v-if="currentUser" />
      <main class="content">
        <router-view />
      </main>
    </div>
    <toast-container />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from './stores/user'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import ToastContainer from './components/ToastContainer.vue'

const userStore = useUserStore()
const currentUser = computed(() => userStore.currentUser)
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>
