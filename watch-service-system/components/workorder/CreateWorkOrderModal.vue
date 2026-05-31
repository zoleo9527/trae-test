<template>
  <BaseModal
    :visible="modelValue"
    title="寄修登记"
    :width="640"
    @update:visible="handleClose"
    @close="handleClose"
  >
    <div class="space-y-5">
      <div class="text-sm text-gray-500 bg-primary-50 px-4 py-3 rounded-lg">
        <Icon icon="mdi:information-outline" class="w-4 h-4 mr-1 inline" />
        请填写客户和手表信息，登记后工单将进入「待检测」状态
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">客户姓名 <span class="text-red-500">*</span></label>
          <input
            v-model="form.customerName"
            type="text"
            placeholder="请输入客户姓名"
            class="input"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">联系电话 <span class="text-red-500">*</span></label>
          <input
            v-model="form.customerPhone"
            type="tel"
            placeholder="请输入联系电话"
            class="input"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">电子邮箱</label>
          <input
            v-model="form.customerEmail"
            type="email"
            placeholder="请输入电子邮箱"
            class="input"
          />
        </div>
      </div>

      <div class="border-t border-gray-200 pt-5">
        <h4 class="text-sm font-medium text-gray-700 mb-4">手表信息</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">手表品牌 <span class="text-red-500">*</span></label>
            <select v-model="form.watchBrand" class="select">
              <option value="">请选择品牌</option>
              <option v-for="brand in watchBrands" :key="brand" :value="brand">{{ brand }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">手表型号 <span class="text-red-500">*</span></label>
            <input
              v-model="form.watchModel"
              type="text"
              placeholder="请输入型号"
              class="input"
            />
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">序列号</label>
            <input
              v-model="form.watchSerial"
              type="text"
              placeholder="请输入手表序列号"
              class="input"
            />
          </div>
        </div>
      </div>

      <div class="border-t border-gray-200 pt-5">
        <h4 class="text-sm font-medium text-gray-700 mb-4">故障描述</h4>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">问题描述 <span class="text-red-500">*</span></label>
            <textarea
              v-model="form.problemDesc"
              placeholder="请详细描述手表的故障问题..."
              rows="3"
              class="input"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">优先级</label>
              <select v-model="form.priority" class="select">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">预计完成日期</label>
              <input
                v-model="form.expectedDate"
                type="date"
                class="input"
              />
            </div>
          </div>
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
          :disabled="loading || !isFormValid"
        >
          <Icon v-if="loading" icon="mdi:loading" class="w-4 h-4 mr-2 animate-spin" />
          登记工单
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { WATCH_BRANDS } from '~/utils/constants';
import type { Priority } from '~/types/workorder';

interface Props {
  modelValue: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    watchBrand: string;
    watchModel: string;
    watchSerial: string;
    problemDesc: string;
    priority: Priority;
    expectedDate: string;
  }];
  cancel: [];
}>();

const watchBrands = WATCH_BRANDS;

const form = ref({
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  watchBrand: '',
  watchModel: '',
  watchSerial: '',
  problemDesc: '',
  priority: 'medium' as Priority,
  expectedDate: '',
});

const isFormValid = computed(() => {
  return form.value.customerName.trim() &&
         form.value.customerPhone.trim() &&
         form.value.watchBrand &&
         form.value.watchModel.trim() &&
         form.value.problemDesc.trim();
});

watch(() => props.modelValue, (val) => {
  if (!val) {
    form.value = {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      watchBrand: '',
      watchModel: '',
      watchSerial: '',
      problemDesc: '',
      priority: 'medium',
      expectedDate: '',
    };
  }
});

function handleClose() {
  emit('update:modelValue', false);
  emit('cancel');
}

function handleSubmit() {
  emit('submit', { ...form.value });
}
</script>
