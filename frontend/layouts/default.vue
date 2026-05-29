<template>
  <div class="flex h-screen">
    <aside class="w-64 bg-white shadow-md flex flex-col">
      <div class="p-6 border-b">
        <h1 class="text-xl font-bold text-primary-600">跑腿平台</h1>
        <p class="text-sm text-gray-500">商家结算与异常补贴</p>
      </div>
      <nav class="flex-1 p-4">
        <ul class="space-y-2">
          <li>
            <NuxtLink to="/" class="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" :class="{ 'bg-primary-50 text-primary-600': route.path === '/' }">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              首页看板
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/appeals" class="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" :class="{ 'bg-primary-50 text-primary-600': route.path === '/appeals' }">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              异常申诉
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/subsidies" class="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" :class="{ 'bg-primary-50 text-primary-600': route.path === '/subsidies' }">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              补贴管理
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/settlements" class="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" :class="{ 'bg-primary-50 text-primary-600': route.path === '/settlements' }">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              商家结算
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/orders" class="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" :class="{ 'bg-primary-50 text-primary-600': route.path === '/orders' }">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              订单查询
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="p-4 border-t">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="text-primary-600 font-medium">运</span>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">运营专员</p>
            <p class="text-xs text-gray-500">admin@example.com</p>
          </div>
        </div>
      </div>
    </aside>
    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
