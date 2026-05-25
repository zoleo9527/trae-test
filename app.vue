<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-museum-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">美</span>
              </div>
              <h1 class="text-lg font-semibold text-gray-900">美术馆运营系统</h1>
            </div>
            <nav class="hidden md:flex items-center gap-1 ml-8">
              <NuxtLink to="/" class="nav-link">
                文创管理
              </NuxtLink>
              <NuxtLink to="/calendar" class="nav-link">
                日历视图
              </NuxtLink>
              <NuxtLink to="/products" class="nav-link">
                商品库存
              </NuxtLink>
            </nav>
          </div>
          <div class="flex items-center gap-3">
            <RoleSwitcher />
            <NotificationCenter />
            <div class="flex items-center gap-2 pl-3 border-l border-gray-200">
              <img :src="store.currentUser.avatar" :alt="store.currentUser.name" class="w-8 h-8 rounded-full" />
              <div class="hidden sm:block">
                <p class="text-sm font-medium text-gray-900">{{ store.currentUser.name }}</p>
                <p class="text-xs text-gray-500">{{ store.currentRoleName }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useMuseumStore } from '~/stores/museum'

const store = useMuseumStore()
</script>

<style scoped>
.nav-link {
  @apply px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-colors;
}

.nav-link.active {
  @apply text-museum-600 bg-museum-50;
}
</style>
