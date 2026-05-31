<template>
  <BaseModal
    :visible="modelValue"
    title="锁定维修配件"
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
          <span class="text-gray-500">故障描述</span>
          <span class="font-medium text-gray-900">{{ order.problemDesc }}</span>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">选择需要锁定的配件</label>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="part in availableParts"
            :key="part.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            :class="{ 'border-primary-500 bg-primary-50': isSelected(part) }"
          >
            <div class="flex items-center space-x-3">
              <input
                type="checkbox"
                :checked="isSelected(part)"
                @change="togglePart(part)"
                class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <div>
                <p class="font-medium text-gray-900">{{ part.partName }}</p>
                <p class="text-xs text-gray-500">编号: {{ part.partCode }} · 单价: ¥{{ part.price }}/{{ part.unit }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900">库存: {{ part.stock - part.locked }}</p>
                <p class="text-xs text-gray-500">已锁定: {{ part.locked }}</p>
              </div>
              <div v-if="isSelected(part)" class="flex items-center space-x-2">
                <button
                  @click.stop="adjustQuantity(part, -1)"
                  class="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  <Icon icon="mdi:minus" class="w-4 h-4" />
                </button>
                <span class="w-8 text-center font-medium">{{ getQuantity(part) }}</span>
                <button
                  @click.stop="adjustQuantity(part, 1)"
                  class="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                  :disabled="getQuantity(part) >= (part.stock - part.locked)"
                >
                  <Icon icon="mdi:plus" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedParts.length > 0" class="p-4 bg-gray-50 rounded-lg">
        <p class="text-sm font-medium text-gray-700 mb-2">已选择配件</p>
        <div class="space-y-2">
          <div
            v-for="sp in selectedParts"
            :key="sp.partCode"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-gray-600">{{ sp.partName }} × {{ sp.quantity }}</span>
            <span class="font-medium text-gray-900">¥{{ sp.price * sp.quantity }}</span>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
          <span class="font-medium text-gray-700">预估零件费用</span>
          <span class="text-lg font-bold text-primary-600">¥{{ totalPartsCost }}</span>
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
          :disabled="loading || selectedParts.length === 0"
        >
          <Icon v-if="loading" icon="mdi:loading" class="w-4 h-4 mr-2 animate-spin" />
          确认锁定
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { WorkOrder, PartInventory } from '~/types/workorder';

interface Props {
  modelValue: boolean;
  order: WorkOrder | null;
  availableParts: PartInventory[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: Array<{ partName: string; partCode: string; quantity: number }>];
  cancel: [];
}>();

interface SelectedPart {
  partCode: string;
  partName: string;
  price: number;
  quantity: number;
}

const selectedParts = ref<SelectedPart[]>([]);

function isSelected(part: PartInventory): boolean {
  return selectedParts.value.some(sp => sp.partCode === part.partCode);
}

function getQuantity(part: PartInventory): number {
  return selectedParts.value.find(sp => sp.partCode === part.partCode)?.quantity || 0;
}

function togglePart(part: PartInventory) {
  if (isSelected(part)) {
    selectedParts.value = selectedParts.value.filter(sp => sp.partCode !== part.partCode);
  } else {
    selectedParts.value.push({
      partCode: part.partCode,
      partName: part.partName,
      price: part.price,
      quantity: 1,
    });
  }
}

function adjustQuantity(part: PartInventory, delta: number) {
  const idx = selectedParts.value.findIndex(sp => sp.partCode === part.partCode);
  if (idx !== -1) {
    const newQty = selectedParts.value[idx].quantity + delta;
    const available = part.stock - part.locked;
    if (newQty > 0 && newQty <= available) {
      selectedParts.value[idx].quantity = newQty;
    } else if (newQty <= 0) {
      selectedParts.value.splice(idx, 1);
    }
  }
}

const totalPartsCost = computed(() => {
  return selectedParts.value.reduce((sum, sp) => sum + sp.price * sp.quantity, 0);
});

watch(() => props.modelValue, (val) => {
  if (!val) {
    selectedParts.value = [];
  }
});

function handleClose() {
  emit('update:modelValue', false);
  emit('cancel');
}

function handleSubmit() {
  emit('submit', selectedParts.value.map(sp => ({
    partName: sp.partName,
    partCode: sp.partCode,
    quantity: sp.quantity,
  })));
}
</script>
