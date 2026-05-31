<template>
  <div class="flex items-center justify-center py-16">
    <div class="flex flex-col items-center">
      <div class="w-10 h-10 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500 text-sm">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text?: string;
}

withDefaults(defineProps<Props>(), {
  text: '加载中...',
});
</script>
