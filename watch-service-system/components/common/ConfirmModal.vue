<template>
  <BaseModal
    :visible="modelValue"
    :title="title"
    @update:visible="handleClose"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div v-if="message" class="text-gray-600">
        {{ message }}
      </div>
      <div v-if="type === 'warning'" class="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg">
        <Icon icon="mdi:alert-circle" class="w-6 h-6 text-amber-600 flex-shrink-0" />
        <div>
          <p class="font-medium text-amber-800">请注意</p>
          <p class="text-sm text-amber-700 mt-1">此操作无法撤销，请确认您的选择。</p>
        </div>
      </div>
      <div v-if="type === 'danger'" class="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
        <Icon icon="mdi:alert-octagon" class="w-6 h-6 text-red-600 flex-shrink-0" />
        <div>
          <p class="font-medium text-red-800">危险操作</p>
          <p class="text-sm text-red-700 mt-1">此操作可能产生重大影响，请谨慎操作。</p>
        </div>
      </div>
      <div v-if="showInput">
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ inputLabel }}</label>
        <textarea
          v-model="inputValue"
          :placeholder="inputPlaceholder"
          rows="3"
          class="input"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <button
          @click="handleClose"
          class="btn-secondary"
          :disabled="loading"
        >
          取消
        </button>
        <button
          @click="handleConfirm"
          :class="[
            'btn',
            confirmVariant === 'danger' ? 'btn-danger' :
            confirmVariant === 'success' ? 'btn-success' :
            'btn-primary'
          ]"
          :disabled="loading || (showInput && required && !inputValue.trim())"
        >
          <Icon v-if="loading" icon="mdi:loading" class="w-4 h-4 mr-2 animate-spin" />
          {{ confirmText }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'success' | 'danger';
  type?: 'default' | 'warning' | 'danger';
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  required?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '确认',
  confirmVariant: 'primary',
  type: 'default',
  showInput: false,
  inputLabel: '备注',
  inputPlaceholder: '请输入...',
  required: false,
  loading: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [value?: string];
  cancel: [];
}>();

const inputValue = ref('');

watch(() => props.modelValue, (val) => {
  if (!val) {
    inputValue.value = '';
  }
});

function handleClose() {
  emit('update:modelValue', false);
  emit('cancel');
}

function handleConfirm() {
  emit('confirm', props.showInput ? inputValue.value : undefined);
}
</script>
