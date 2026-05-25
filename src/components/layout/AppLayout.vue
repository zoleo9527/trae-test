<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import ExceptionDrawer from '../exception/ExceptionDrawer.vue'
</script>

<template>
  <div class="flex h-screen bg-museum-gray-50">
    <AppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <AppHeader />
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
    <ExceptionDrawer />
  </div>
</template>
