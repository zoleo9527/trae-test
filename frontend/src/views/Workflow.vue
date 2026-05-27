<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { workflowApi } from '@/api';
import { RefundStatus, UserRole } from '@/types';
import type { RefundRequest, RefundFlowLog } from '@/types';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const statusFilter = ref<RefundStatus | ''>('');
const refunds = ref<RefundRequest[]>([]);
const selectedRefund = ref<RefundRequest | null>(null);
const timeline = ref<RefundFlowLog[]>([]);
const loading = ref(true);
const showDetail = ref(false);

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: RefundStatus.SUBMITTED, label: '待客服审核' },
  { value: RefundStatus.CS_REVIEWING, label: '待最终审核' },
  { value: RefundStatus.INSPECTION_REQUIRED, label: '待现场核验' },
  { value: RefundStatus.APPROVED, label: '已批准' },
  { value: RefundStatus.REJECTED, label: '已驳回' },
];

const statusBadgeMap: Record<RefundStatus, string> = {
  [RefundStatus.SUBMITTED]: 'warning',
  [RefundStatus.CS_REVIEWING]: 'info',
  [RefundStatus.INSPECTION_REQUIRED]: 'danger',
  [RefundStatus.APPROVED]: 'success',
  [RefundStatus.REJECTED]: 'gray',
  [RefundStatus.COMPLETED]: 'success',
};

const statusLabelMap: Record<RefundStatus, string> = {
  [RefundStatus.SUBMITTED]: '待客服审核',
  [RefundStatus.CS_REVIEWING]: '待最终审核',
  [RefundStatus.INSPECTION_REQUIRED]: '待现场核验',
  [RefundStatus.APPROVED]: '已批准',
  [RefundStatus.REJECTED]: '已驳回',
  [RefundStatus.COMPLETED]: '已完成',
};

const canCsReview = computed(() => 
  userStore.currentRole === UserRole.CUSTOMER_SERVICE || userStore.currentRole === UserRole.OPERATION_MANAGER
);

const canInspect = computed(() => 
  userStore.currentRole === UserRole.INSPECTOR || userStore.currentRole === UserRole.OPERATION_MANAGER
);

const canFinalReview = computed(() => 
  userStore.currentRole === UserRole.OPERATION_MANAGER
);

const loadRefunds = async () => {
  loading.value = true;
  try {
    const res = await workflowApi.getRefunds(statusFilter.value || undefined);
    refunds.value = res.data.data;
  } finally {
    loading.value = false;
  }
};

const viewDetail = async (refund: RefundRequest) => {
  selectedRefund.value = refund;
  const res = await workflowApi.getRefundTimeline(refund.id);
  timeline.value = res.data;
  showDetail.value = true;
};

const handleCsReview = async (needInspection: boolean) => {
  if (!selectedRefund.value) return;
  const opinion = prompt('请输入审核意见：', needInspection ? '需要现场核实设备情况' : '情况属实，同意退款');
  if (opinion === null) return;
  
  await workflowApi.csReview({
    refundId: selectedRefund.value.id,
    csReviewerId: userStore.currentUser.id,
    csOpinion: opinion,
    needInspection,
  });
  await loadRefunds();
  showDetail.value = false;
};

const handleInspection = async () => {
  if (!selectedRefund.value) return;
  const result = prompt('请输入巡检结果：', '设备运行正常，未发现故障');
  if (result === null) return;
  
  await workflowApi.submitInspection({
    refundId: selectedRefund.value.id,
    inspectorId: userStore.currentUser.id,
    inspectionResult: result,
  });
  await loadRefunds();
  showDetail.value = false;
};

const handleFinalReview = async (approved: boolean) => {
  if (!selectedRefund.value) return;
  await workflowApi.finalReview({
    refundId: selectedRefund.value.id,
    reviewerId: userStore.currentUser.id,
    finalDecision: approved ? 'APPROVED' : 'REJECTED',
  });
  await loadRefunds();
  showDetail.value = false;
};

onMounted(() => {
  loadRefunds();
});
</script>

<template>
  <div class="flex gap-4 h-full">
    <div class="flex-1 card">
      <div class="card-header flex items-center justify-between">
        <span>退款申诉列表</span>
        <select v-model="statusFilter" @change="loadRefunds" class="select" style="width: 160px">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="overflow-auto" style="max-height: 600px">
        <table class="table">
          <thead>
            <tr>
              <th>客户</th>
              <th>套餐类型</th>
              <th>退款次数</th>
              <th>关联站点</th>
              <th>状态</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody v-if="!loading">
            <tr v-for="r in refunds" :key="r.id" @click="viewDetail(r)" class="cursor-pointer">
              <td>
                <div class="font-medium">{{ r.package.customerName }}</div>
                <div class="text-xs text-gray-500">{{ r.package.customerPhone }}</div>
              </td>
              <td>{{ r.package.packageType }}</td>
              <td>{{ r.refundCount }} 次</td>
              <td>{{ r.verification?.station.name || '-' }}</td>
              <td>
                <span class="badge" :class="'badge-' + statusBadgeMap[r.status]">
                  {{ statusLabelMap[r.status] }}
                </span>
              </td>
              <td class="text-sm">{{ r.submitTime.slice(0, 16) }}</td>
              <td>
                <button class="btn btn-outline text-xs">查看</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="text-center py-8 text-gray-500">加载中...</div>
      </div>
    </div>

    <div v-if="showDetail && selectedRefund" class="w-96 card">
      <div class="card-header flex items-center justify-between">
        <span>申诉详情</span>
        <button @click="showDetail = false" class="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <div class="card-body space-y-4">
        <div>
          <div class="text-sm text-gray-500 mb-1">客户信息</div>
          <div class="font-medium">{{ selectedRefund.package.customerName }}</div>
          <div class="text-sm">{{ selectedRefund.package.customerPhone }}</div>
        </div>

        <div>
          <div class="text-sm text-gray-500 mb-1">退款原因</div>
          <div class="text-sm p-3 bg-gray-50 rounded">{{ selectedRefund.customerReason }}</div>
        </div>

        <div v-if="selectedRefund.verification">
          <div class="text-sm text-gray-500 mb-1">关联核销记录</div>
          <div class="p-3 bg-gray-50 rounded text-sm">
            <div>站点: {{ selectedRefund.verification.station.name }}</div>
            <div>时间: {{ selectedRefund.verification.verifyTime.slice(0, 16) }}</div>
          </div>
        </div>

        <div v-if="selectedRefund.csOpinion">
          <div class="text-sm text-gray-500 mb-1">客服审核意见</div>
          <div class="text-sm p-3 bg-blue-50 rounded text-blue-800">
            {{ selectedRefund.csOpinion }}
          </div>
        </div>

        <div v-if="selectedRefund.inspectionResult">
          <div class="text-sm text-gray-500 mb-1">巡检结果</div>
          <div class="text-sm p-3 bg-green-50 rounded text-green-800">
            {{ selectedRefund.inspectionResult }}
          </div>
        </div>

        <div>
          <div class="text-sm text-gray-500 mb-2">流程接力</div>
          <div class="space-y-3">
            <div
              v-for="(log, idx) in timeline"
              :key="log.id"
              class="relative pl-4 pb-3"
              :class="idx === timeline.length - 1 ? '' : 'border-l-2 border-gray-200'"
            >
              <div class="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary"></div>
              <div class="font-medium text-sm">
                {{ statusLabelMap[log.toStatus] }}
              </div>
              <div class="text-xs text-gray-500">
                {{ log.operatorName }} · {{ log.createdAt.slice(5, 16) }}
              </div>
              <div v-if="log.remark" class="text-xs mt-1 text-gray-600">
                {{ log.remark }}
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t space-y-2">
          <div v-if="selectedRefund.status === RefundStatus.SUBMITTED && canCsReview">
            <button 
              @click="handleCsReview(false)" 
              class="btn btn-success w-full"
            >
              审核通过
            </button>
            <button 
              @click="handleCsReview(true)" 
              class="btn btn-warning w-full mt-2"
            >
              需要现场核验
            </button>
          </div>

          <div v-if="selectedRefund.status === RefundStatus.INSPECTION_REQUIRED && canInspect">
            <button 
              @click="handleInspection" 
              class="btn btn-primary w-full"
            >
              提交巡检结果
            </button>
          </div>

          <div v-if="selectedRefund.status === RefundStatus.CS_REVIEWING && canFinalReview">
            <button 
              @click="handleFinalReview(true)" 
              class="btn btn-success w-full"
            >
              最终批准
            </button>
            <button 
              @click="handleFinalReview(false)" 
              class="btn btn-danger w-full mt-2"
            >
              驳回申请
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
