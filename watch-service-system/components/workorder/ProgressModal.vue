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
import StatusBadge from './StatusBadge.vue';

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
    label: '检测中',
    description: '正在检测手表故障',
    icon: 'mdi:magnify',
  },
  {
    value: 'parts_preparing',
    label: '配件准备',
    description: '准备维修所需配件',
    icon: 'mdi:package-variant',
  },
  {
    value: 'repairing',
    label: '维修中',
    description: '正在执行维修工作',
    icon: 'mdi:hammer-wrench',
  },
  {
    value: 'testing',
    label: '测试中',
    description: '维修完成，正在测试',
    icon: 'mdi:check-circle-outline',
  },
  {
    value: 'completed',
    label: '已完成',
    description: '维修完成，检测通过',
    icon: 'mdi:check-circle',
  },
];

const selectedStatus = ref('repairing');
const form = ref({
  remark: '',
});

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    inspecting: 'bg-blue-500',
    parts_preparing: 'bg-amber-500',
    repairing: 'bg-cyan-500',
    testing: 'bg-purple-500',
    completed: 'bg-green-500',
  };
  return colors[status] || 'bg-gray-500';
}

watch(() => props.modelValue, (val) => {
  if (!val) {
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
