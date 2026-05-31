<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '~/components/layout/AppHeader.vue';

const { initRole } = useRole();

onMounted(() => {
  initRole();
});
</script>
