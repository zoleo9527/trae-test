<template>
  <BaseModal
    :visible="modelValue"
    title="满意度回访"
    @update:visible="handleClose"
    @close="handleClose"
  >
    <div class="space-y-6">
      <div v-if="order" class="p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">工单编号</span>
          <span class="font-medium text-gray-900">{{ order.orderNo }}</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-2">
          <span class="text-gray-500">客户姓名</span>
          <span class="font-medium text-gray-900">{{ order.customer.name }}</span>
        </div>
        <div class="flex items-center justify-between text-sm mt-2">
          <span class="text-gray-500">取件日期</span>
          <span class="font-medium text-gray-900">{{ order.receipt?.pickedUpAt ? formatDate(order.receipt.pickedUpAt) : '-' }}</span>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">请为本次服务评分</label>
        <div class="flex items-center justify-center space-x-2">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            @click="form.satisfaction = star"
            class="p-2 transition-transform hover:scale-110 focus:outline-none"
          >
            <Icon
              :icon="star <= form.satisfaction ? 'mdi:star' : 'mdi:star-outline'"
              class="w-10 h-10 transition-colors"
              :class="star <= form.satisfaction ? 'text-yellow-400' : 'text-gray-300'"
            />
          </button>
        </div>
        <p class="text-center text-sm text-gray-500 mt-2">
          {{ satisfactionLabel }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">评价意见</label>
        <textarea
          v-model="form.comment"
          placeholder="请输入客户的评价意见或建议..."
          rows="4"
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
          :disabled="loading || form.satisfaction === 0"
        >
          <Icon v-if="loading" icon="mdi:loading" class="w-4 h-4 mr-2 animate-spin" />
          提交回访
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { WorkOrder } from '~/types/workorder';
import { formatDate } from '~/utils/format';

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
  submit: [data: { satisfaction: number; comment: string }];
  cancel: [];
}>();

const form = ref({
  satisfaction: 0,
  comment: '',
});

const satisfactionLabel = computed(() => {
  const labels: Record<number, string> = {
    1: '非常不满意',
    2: '不满意',
    3: '一般',
    4: '满意',
    5: '非常满意',
  };
  return labels[form.value.satisfaction] || '点击星星评分';
});

watch(() => props.modelValue, (val) => {
  if (!val) {
    form.value = {
      satisfaction: 0,
      comment: '',
    };
  }
});

function handleClose() {
  emit('update:modelValue', false);
  emit('cancel');
}

function handleSubmit() {
  emit('submit', {
    satisfaction: form.value.satisfaction,
    comment: form.value.comment,
  });
}
</script>
