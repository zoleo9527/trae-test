<template>
  <BaseModal
    :visible="modelValue"
    title="开始检测"
    @update:visible="handleClose"
    @close="handleClose"
  >
    <div class="space-y-5">
      <div v-if="order" class="p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">工单编号</span>
          <span class="font-medium text-gray-900">{{ order.orderNo }}</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-2">
          <span class="text-gray-500">手表信息</span>
          <span class="font-medium text-gray-900">{{ order.watchBrand }} {{ order.watchModel }}</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-2">
          <span class="text-gray-500">问题描述</span>
          <span class="font-medium text-gray-900">{{ order.problemDesc }}</span>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">检测结果</label>
        <textarea
          v-model="form.inspectionResult"
          placeholder="请详细描述检测结果，包括故障原因、需要更换的配件、预计维修时间等..."
          rows="5"
          class="input"
        />
        <p class="mt-1 text-xs text-gray-500">检测结果将作为报价依据，请详细填写</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
        <textarea
          v-model="form.remark"
          placeholder="其他需要说明的内容..."
          rows="2"
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
          @click="handleSubmit"
          class="btn-primary"
          :disabled="loading || !form.inspectionResult.trim()"
        >
          <Icon v-if="loading" icon="mdi:loading" class="w-4 h-4 mr-2 animate-spin" />
          确认开始检测
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { WorkOrder } from '~/types/workorder';

interface Props {
  modelValue: boolean;
  order: WorkOrder | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: { inspectionResult: string; remark: string }];
  cancel: [];
}>();

const form = ref({
  inspectionResult: '',
  remark: '',
});

watch(() => props.modelValue, (val) => {
  if (!val) {
    form.value = {
      inspectionResult: '',
      remark: '',
    };
  }
});

function handleClose() {
  emit('update:modelValue', false);
  emit('cancel');
}

function handleSubmit() {
  emit('submit', {
    inspectionResult: form.value.inspectionResult,
    remark: form.value.remark,
  });
}
</script>
