<template>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <div class="w-20 h-20 mb-6 text-red-400">
      <Icon icon="mdi:alert-circle-outline" class="w-full h-full" />
    </div>
    <h3 class="text-lg font-medium text-gray-900 mb-2">出错了</h3>
    <p class="text-gray-500 text-center mb-6 max-w-sm">{{ message || '加载数据时出现问题，请重试' }}</p>
    <button @click="$emit('retry')" class="btn-primary">
      <Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
      重试
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string;
}

defineProps<Props>();

defineEmits<{
  retry: [];
}>();
</script>
