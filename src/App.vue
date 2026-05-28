<template>
  <div v-if="isLoginPage">
    <router-view />
  </div>
  <div v-else class="flex h-screen bg-[#0f0f1a]">
    <SidebarNav />
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
    <SidePanel />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarNav from '@/components/SidebarNav.vue'
import SidePanel from '@/components/SidePanel.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
</script>
