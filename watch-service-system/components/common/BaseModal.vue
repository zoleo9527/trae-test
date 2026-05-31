<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.self="handleClose"
    >
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
      <div
        class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 transform transition-all"
        :class="[
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        ]"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          <button
            v-if="closable"
            @click="handleClose"
            class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Icon icon="mdi:close" class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6">
          <slot />
        </div>
        <div v-if="$slots.footer" class="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue';

interface Props {
  visible: boolean;
  title: string;
  closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  close: [];
}>();

function handleClose() {
  emit('update:visible', false);
  emit('close');
}

watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>
