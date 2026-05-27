<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const { checkAuth } = useAuth()

onMounted(() => {
  checkAuth()
})
</script>
