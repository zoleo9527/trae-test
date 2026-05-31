<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <div class="flex-shrink-0 flex items-center">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center">
              <Icon icon="mdi:watch" class="w-6 h-6 text-white" />
            </div>
            <div class="ml-3">
              <h1 class="text-lg font-semibold text-gray-900">钟表售后管理</h1>
              <p class="text-xs text-gray-500">报价审批与客户确认系统</p>
            </div>
          </div>
          
          <nav class="hidden md:ml-10 md:flex md:space-x-1">
            <NuxtLink
              to="/"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="$route.path === '/' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'"
            >
              <span class="flex items-center">
                <Icon icon="mdi:view-dashboard" class="w-4 h-4 mr-2" />
                仪表盘
              </span>
            </NuxtLink>
            <NuxtLink
              to="/workorders"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="$route.path.startsWith('/workorders') ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'"
            >
              <span class="flex items-center">
                <Icon icon="mdi:clipboard-list" class="w-4 h-4 mr-2" />
                工单管理
              </span>
            </NuxtLink>
          </nav>
        </div>
        
        <div class="flex items-center space-x-4">
          <RoleSwitcher />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import RoleSwitcher from '~/components/common/RoleSwitcher.vue';
</script>
