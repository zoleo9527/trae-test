<template>
  <div class="fixed inset-0 z-50 flex">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="ml-auto w-[600px] bg-white shadow-2xl h-full flex flex-col">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800">客诉详情</h3>
        <button class="text-gray-400 hover:text-gray-600" @click="$emit('close')">
          <component :is="X" class="w-5 h-5" />
        </button>
      </div>

      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <el-icon class="is-loading text-3xl text-primary-500">
          <Loader2 />
        </el-icon>
      </div>

      <div v-else-if="complaint" class="flex-1 overflow-auto">
        <div class="p-6 space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-xl font-semibold text-gray-800">{{ complaint.customerName }}</h4>
              <p class="text-sm text-gray-500">{{ complaint.customerPhone || '无电话' }}</p>
            </div>
            <span :class="['px-4 py-2 rounded-full text-sm font-medium', STATUS_COLORS[complaint.status]]">
              {{ STATUS_LABELS[complaint.status] }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">客诉类型</p>
              <p class="font-medium text-gray-800">{{ complaint.complaintType }}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">过磅单号</p>
              <p class="font-medium text-gray-800">{{ complaint.weightNoteNo || '无' }}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">冷库编号</p>
              <p class="font-medium text-gray-800">{{ complaint.coldStorageNo || '无' }}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <p class="text-xs text-gray-500 mb-1">登记时间</p>
              <p class="font-medium text-gray-800">{{ formatDate(complaint.createdAt) }}</p>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-xs text-gray-500 mb-2">问题描述</p>
            <p class="text-gray-700">{{ complaint.description || '无描述' }}</p>
          </div>

          <div v-if="complaint.evidences && complaint.evidences.length > 0">
            <h5 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <component :is="ImageIcon" class="w-5 h-5 text-primary-500" />
              证据图片
            </h5>
            <div class="grid grid-cols-3 gap-3">
              <div
                v-for="evidence in complaint.evidences"
                :key="evidence.id"
                class="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                <div class="aspect-square flex items-center justify-center bg-primary-50">
                  <component :is="ImageIcon" class="w-8 h-8 text-primary-300" />
                </div>
                <p class="text-xs text-gray-600 p-2 truncate">{{ evidence.fileName || '证据图片' }}</p>
              </div>
            </div>
          </div>

          <div v-if="complaint.rechecks && complaint.rechecks.length > 0">
            <h5 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <component :is="ClipboardCheck" class="w-5 h-5 text-primary-500" />
              复检记录
            </h5>
            <div class="space-y-3">
              <div
                v-for="recheck in complaint.rechecks"
                :key="recheck.id"
                class="border border-gray-200 rounded-lg p-4"
              >
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span class="text-gray-500">复检人员：</span>
                    <span class="text-gray-800">{{ recheck.recheckPerson || '-' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">冷库位置：</span>
                    <span class="text-gray-800">{{ recheck.coldStorageLocation || '-' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">分级结果：</span>
                    <span class="text-gray-800">{{ recheck.gradeResult || '-' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">损耗比例：</span>
                    <span class="text-accent-600 font-medium">{{ recheck.lossRatio || 0 }}%</span>
                  </div>
                  <div class="col-span-2">
                    <span class="text-gray-500">损耗金额：</span>
                    <span class="text-accent-600 font-semibold">¥{{ recheck.lossAmount || 0 }}</span>
                  </div>
                  <div v-if="recheck.remark" class="col-span-2">
                    <span class="text-gray-500">备注：</span>
                    <span class="text-gray-800">{{ recheck.remark }}</span>
                  </div>
                </div>
                <p class="text-xs text-gray-400 mt-2">{{ formatDate(recheck.createdAt) }}</p>
              </div>
            </div>
          </div>

          <div v-if="complaint.compensations && complaint.compensations.length > 0">
            <h5 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <component :is="DollarSign" class="w-5 h-5 text-primary-500" />
              赔付记录
            </h5>
            <div class="space-y-3">
              <div
                v-for="comp in complaint.compensations"
                :key="comp.id"
                class="border border-gray-200 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-lg font-semibold text-accent-600">¥{{ comp.amount }}</span>
                  <span :class="['px-2 py-1 rounded text-xs', comp.status === 'approved' ? 'bg-green-100 text-green-700' : comp.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700']">
                    {{ comp.status === 'approved' ? '已批准' : comp.status === 'rejected' ? '已驳回' : '待审批' }}
                  </span>
                </div>
                <div class="text-sm space-y-1">
                  <div>
                    <span class="text-gray-500">赔付方式：</span>
                    <span class="text-gray-800">{{ comp.compensationMethod || '-' }}</span>
                  </div>
                  <div v-if="comp.remark">
                    <span class="text-gray-500">备注：</span>
                    <span class="text-gray-800">{{ comp.remark }}</span>
                  </div>
                </div>
                <p class="text-xs text-gray-400 mt-2">{{ formatDate(comp.createdAt) }}</p>
              </div>
            </div>
          </div>

          <div>
            <h5 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <component :is="Clock" class="w-5 h-5 text-primary-500" />
              状态变更记录
            </h5>
            <div class="relative pl-6">
              <div class="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div
                v-for="log in complaint.statusLogs"
                :key="log.id"
                class="relative pb-4 last:pb-0"
              >
                <div class="absolute left-[-20px] w-4 h-4 rounded-full border-2 border-white bg-primary-500"></div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="flex items-center gap-2 text-sm">
                    <span v-if="log.fromStatus" :class="['px-2 py-0.5 rounded text-xs', STATUS_COLORS[log.fromStatus as keyof typeof STATUS_COLORS]]">
                      {{ STATUS_LABELS[log.fromStatus as keyof typeof STATUS_LABELS] }}
                    </span>
                    <component :is="ArrowRight" class="w-4 h-4 text-gray-400" />
                    <span :class="['px-2 py-0.5 rounded text-xs', STATUS_COLORS[log.toStatus as keyof typeof STATUS_COLORS]]">
                      {{ STATUS_LABELS[log.toStatus as keyof typeof STATUS_LABELS] }}
                    </span>
                  </div>
                  <p v-if="log.remark" class="text-sm text-gray-600 mt-1">{{ log.remark }}</p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ log.operator?.name || '系统' }} · {{ formatDate(log.createdAt) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="complaint && (authStore.hasRole(['manager', 'picker', 'accountant']))" class="p-6 border-t border-gray-100 space-y-3">
        <div class="flex gap-3">
          <el-button
            v-if="(complaint.status === 'pending' || complaint.status === 'rechecking') && authStore.hasRole(['manager', 'picker'])"
            type="primary"
            class="flex-1"
            @click="showRecheckDialog = true"
          >
            <component :is="ClipboardCheck" class="w-4 h-4 mr-1" />
            {{ complaint.status === 'rechecking' ? '登记复检结果' : '登记复检' }}
          </el-button>
          <el-button
            v-if="complaint.status === 'compensating' && authStore.hasRole('manager')"
            type="warning"
            class="flex-1"
            @click="showCompensationDialog = true"
          >
            <component :is="DollarSign" class="w-4 h-4 mr-1" />
            申请赔付
          </el-button>
          <el-button
            v-if="complaint.status === 'payment_pending' && authStore.hasRole(['manager', 'accountant'])"
            type="success"
            class="flex-1"
            @click="showPaymentDialog = true"
          >
            <component :is="CheckCircle" class="w-4 h-4 mr-1" />
            登记回款
          </el-button>
        </div>
      </div>
    </div>

    <RecheckDialog
      v-if="showRecheckDialog"
      :complaint-id="complaintId"
      @close="showRecheckDialog = false"
      @success="handleRecheckSuccess"
    />

    <CompensationDialog
      v-if="showCompensationDialog"
      :complaint-id="complaintId"
      @close="showCompensationDialog = false"
      @success="handleCompensationSuccess"
    />

    <PaymentDialog
      v-if="showPaymentDialog"
      :complaint="complaint"
      @close="showPaymentDialog = false"
      @success="handlePaymentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  X,
  Loader2,
  Clock,
  ArrowRight,
  ClipboardCheck,
  DollarSign,
  CheckCircle,
  Image as ImageIcon,
} from 'lucide-vue-next';
import { complaintApi } from '../api';
import { useAuthStore } from '../stores/auth';
import { STATUS_LABELS, STATUS_COLORS, type Complaint } from '../types';
import RecheckDialog from './RecheckDialog.vue';
import CompensationDialog from './CompensationDialog.vue';
import PaymentDialog from './PaymentDialog.vue';

const props = defineProps<{
  complaintId: string;
}>();

const emit = defineEmits<{
  close: [];
  refresh: [];
}>();

const authStore = useAuthStore();
const loading = ref(false);
const complaint = ref<Complaint | null>(null);
const showRecheckDialog = ref(false);
const showCompensationDialog = ref(false);
const showPaymentDialog = ref(false);

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchDetail() {
  loading.value = true;
  try {
    complaint.value = await complaintApi.getOne(props.complaintId);
  } catch (error) {
    ElMessage.error('获取详情失败');
  } finally {
    loading.value = false;
  }
}

function handleRecheckSuccess() {
  showRecheckDialog.value = false;
  fetchDetail();
  emit('refresh');
}

function handleCompensationSuccess() {
  showCompensationDialog.value = false;
  fetchDetail();
  emit('refresh');
}

function handlePaymentSuccess() {
  showPaymentDialog.value = false;
  fetchDetail();
  emit('refresh');
}

watch(() => props.complaintId, (newId) => {
  if (newId) {
    fetchDetail();
  }
}, { immediate: true });

onMounted(() => {
  fetchDetail();
});
</script>
