<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const auth = useAuthStore()
onMounted(() => auth.initFromStorage())
</script>
