<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { useAppStore } from '@/stores/app'
import { Menu } from 'lucide-vue-next'

const appStore = useAppStore()
const mobileMenuOpen = ref(false)
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    appStore.sidebarCollapsed = true
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-bg">
    <div v-if="isMobile && mobileMenuOpen" class="fixed inset-0 z-40 bg-black/30" @click="mobileMenuOpen = false" />
    <div
      v-if="isMobile"
      :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
      class="fixed inset-y-0 left-0 z-50 transition-transform duration-200"
    >
      <AppSidebar />
    </div>
    <AppSidebar v-if="!isMobile" />
    <main class="flex-1 overflow-y-auto">
      <div v-if="isMobile" class="sticky top-0 z-30 bg-surface border-b border-border px-4 py-2 flex items-center">
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="text-text-secondary hover:text-text-primary">
          <Menu class="w-5 h-5" />
        </button>
        <span class="ml-3 text-sm font-medium text-text-primary">苗木基地管理</span>
      </div>
      <div class="max-w-6xl mx-auto p-4 md:p-6">
        <router-view />
      </div>
    </main>
  </div>
</template>
