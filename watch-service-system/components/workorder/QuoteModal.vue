<template>
  <BaseModal
    :visible="modelValue"
    title="提交报价"
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
          <span class="text-gray-500">手表型号</span>
          <span class="font-medium text-gray-900">{{ order.watchBrand }} {{ order.watchModel }}</span>
        </div>
      </div>

      <div v-if="order?.inspectionResult" class="p-4 bg-blue-50 rounded-lg">
        <p class="text-sm font-medium text-blue-800 mb-1">检测结果</p>
        <p class="text-sm text-blue-700">{{ order.inspectionResult }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">维修备注</label>
        <textarea
          v-model="form.remark"
          placeholder="请输入维修方案说明..."
          rows="3"
          class="input"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">零件费用 (元)</label>
          <input
            v-model.number="form.partsCost"
            type="number"
            min="0"
            step="1"
            class="input"
            placeholder="0"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">人工费用 (元)</label>
          <input
            v-model.number="form.laborCost"
            type="number"
            min="0"
            step="1"
            class="input"
            placeholder="0"
          />
        </div>
      </div>

      <div class="p-4 bg-primary-50 rounded-lg border border-primary-200">
        <div class="flex items-center justify-between">
          <span class="text-lg font-medium text-primary-700">报价总计</span>
          <span class="text-2xl font-bold text-primary-600">¥{{ totalAmount }}</span>
        </div>
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
          :disabled="loading || !isValid"
        >
          <Icon v-if="loading" icon="mdi:loading" class="w-4 h-4 mr-2 animate-spin" />
          提交报价
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
  submit: [data: { partsCost: number; laborCost: number; remark: string }];
  cancel: [];
}>();

const form = ref({
  partsCost: 0,
  laborCost: 300,
  remark: '',
});

const totalAmount = computed(() => form.value.partsCost + form.value.laborCost);
const isValid = computed(() => form.value.partsCost >= 0 && form.value.laborCost > 0);

watch(() => props.modelValue, (val) => {
  if (val && props.order) {
    form.value = {
      partsCost: props.order.quote?.partsCost || 0,
      laborCost: props.order.quote?.laborCost || 300,
      remark: props.order.inspectionResult || '',
    };
  }
});

function handleClose() {
  emit('update:modelValue', false);
  emit('cancel');
}

function handleSubmit() {
  emit('submit', {
    partsCost: form.value.partsCost,
    laborCost: form.value.laborCost,
    remark: form.value.remark,
  });
}
</script>
