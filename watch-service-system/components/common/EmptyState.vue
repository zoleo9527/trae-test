<template>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <div class="w-20 h-20 mb-6 text-gray-300">
      <Icon :icon="icon" class="w-full h-full" />
    </div>
    <h3 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>
    <p class="text-gray-500 text-center mb-6 max-w-sm">{{ description }}</p>
    <button v-if="showAction" @click="$emit('action')" class="btn-primary">
      <Icon :icon="actionIcon" class="w-4 h-4 mr-2" />
      {{ actionText }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string;
  title?: string;
  description?: string;
  showAction?: boolean;
  actionIcon?: string;
  actionText?: string;
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi:clipboard-text-outline',
  title: '暂无数据',
  description: '这里还没有任何内容，试试添加新数据或调整筛选条件',
  showAction: false,
  actionIcon: 'mdi:plus',
  actionText: '新建工单',
});

defineEmits<{
  action: [];
}>();
</script>
