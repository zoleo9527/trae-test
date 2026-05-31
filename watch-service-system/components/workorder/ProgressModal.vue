<template>
  <BaseModal
    :visible="modelValue"
    title="更新维修进度"
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
          <span class="text-gray-500">当前状态</span>
          <StatusBadge :status="order.status" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">维修进度</label>
        <div class="space-y-2">
          <button
            v-for="(status, index) in progressStatuses"
            :key="status.value"
            type="button"
            @click="selectedStatus = status.value"
            class="w-full flex items-center justify-between p-3 border rounded-lg transition-colors"
            :class="[
              selectedStatus === status.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-8 h-8 flex items-center justify-center rounded-full"
                :class="getStatusColor(status.value)"
              >
                <Icon :icon="status.icon" class="w-4 h-4 text-white" />
              </div>
              <div class="text-left">
                <p class="font-medium text-gray-900">{{ status.label }}</p>
                <p class="text-xs text-gray-500">{{ status.description }}</p>
              </div>
            </div>
            <div
              v-if="selectedStatus === status.value"
              class="w-6 h-6 flex items-center justify-center rounded-full bg-primary-500"
            >
              <Icon icon="mdi:check" class="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">进度说明</label>
        <textarea
          v-model="form.remark"
          placeholder="请详细描述当前维修进度..."
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
          @click="handleSubmit"
          class="btn-primary"
          :disabled="loading || !form.remark.trim()"
        >
          <Icon v-if="loading" icon="mdi:loading" class="w-4 h-4 mr-2 animate-spin" />
          更新进度
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { WorkOrder } from '~/types/workorder';
import { REPAIR_PROGRESS_LABELS, REPAIR_PROGRESS_COLORS, REPAIR_PROGRESS_ICONS } from '~/utils/constants';

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
  submit: [data: { status: string; remark: string }];
  cancel: [];
}>();

const progressStatuses = [
  {
    value: 'inspecting',
    label: REPAIR_PROGRESS_LABELS.inspecting,
    description: '正在检测手表故障',
    icon: REPAIR_PROGRESS_ICONS.inspecting,
  },
  {
    value: 'parts_preparing',
    label: REPAIR_PROGRESS_LABELS.parts_preparing,
    description: '准备维修所需配件',
    icon: REPAIR_PROGRESS_ICONS.parts_preparing,
  },
  {
    value: 'repairing',
    label: REPAIR_PROGRESS_LABELS.repairing,
    description: '正在执行维修工作',
    icon: REPAIR_PROGRESS_ICONS.repairing,
  },
  {
    value: 'testing',
    label: REPAIR_PROGRESS_LABELS.testing,
    description: '维修完成，正在测试',
    icon: REPAIR_PROGRESS_ICONS.testing,
  },
];

const selectedStatus = ref('repairing');
const form = ref({
  remark: '',
});

function getStatusColor(status: string) {
  return REPAIR_PROGRESS_COLORS[status] || 'bg-gray-500';
}

function getDefaultStatus(): string {
  if (props.order && props.order.progress.length > 0) {
    const lastProgress = props.order.progress[props.order.progress.length - 1];
    const availableStatuses = progressStatuses.map(s => s.value);
    if (availableStatuses.includes(lastProgress.status)) {
      return lastProgress.status;
    }
  }
  return 'repairing';
}

watch(() => props.modelValue, (val) => {
  if (val) {
    selectedStatus.value = getDefaultStatus();
  } else {
    selectedStatus.value = 'repairing';
    form.value = {
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
    status: selectedStatus.value,
    remark: form.value.remark,
  });
}
</script>
