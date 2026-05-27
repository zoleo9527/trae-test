<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { workflowApi } from '@/api';
import { RefundStatus } from '@/types';
import type { RefundRequest, BatchReviewItem } from '@/types';

interface Props {
  userRole?: string;
}

defineProps<Props>();

const refunds = ref<RefundRequest[]>([]);
const selectedIds = ref<Set<string>>(new Set());
const loading = ref(true);
const batchAction = ref<'APPROVE' | 'REJECT' | 'NEED_INSPECTION' | ''>('');
const batchRemark = ref('');
const processing = ref(false);

const loadRefunds = async () => {
  loading.value = true;
  try {
    const res = await workflowApi.getRefunds(undefined, 1, 50);
    refunds.value = res.data.data.filter(
      (r: RefundRequest) => 
        r.status === RefundStatus.SUBMITTED || 
        r.status === RefundStatus.CS_REVIEWING
    );
  } finally {
    loading.value = false;
  }
};

const allSelected = computed(() => {
  const reviewable = refunds.value.filter(
    (r) => r.status === RefundStatus.SUBMITTED || r.status === RefundStatus.CS_REVIEWING
  );
  return reviewable.length > 0 && reviewable.every((r) => selectedIds.value.has(r.id));
});

const toggleSelectAll = () => {
  const reviewable = refunds.value.filter(
    (r) => r.status === RefundStatus.SUBMITTED || r.status === RefundStatus.CS_REVIEWING
  );
  if (allSelected.value) {
    reviewable.forEach((r) => selectedIds.value.delete(r.id));
  } else {
    reviewable.forEach((r) => selectedIds.value.add(r.id));
  }
};

const toggleSelect = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
};

const selectedCount = computed(() => selectedIds.value.size);

const executeBatch = async () => {
  if (!batchAction.value || selectedCount.value === 0) return;
  
  processing.value = true;
  try {
    const items: BatchReviewItem[] = Array.from(selectedIds.value).map((id) => ({
      refundId: id,
      action: batchAction.value as any,
      remark: batchRemark.value,
    }));

    await workflowApi.batchReview({
      reviewerId: 'manager-001',
      items,
    });

    selectedIds.value.clear();
    batchAction.value = '';
    batchRemark.value = '';
    await loadRefunds();
  } finally {
    processing.value = false;
  }
};

onMounted(() => {
  loadRefunds();
});

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
</script>

<template>
  <div class="space-y-4">
    <div class="card">
      <div class="card-body">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">已选择</span>
            <span class="font-semibold text-primary">{{ selectedCount }}</span>
            <span class="text-sm text-gray-500">项</span>
          </div>
          
          <select v-model="batchAction" class="select" style="width: 160px">
            <option value="">选择批量操作</option>
            <option value="APPROVE">批量通过</option>
            <option value="REJECT">批量驳回</option>
            <option value="NEED_INSPECTION">转现场核验</option>
          </select>

          <input 
            v-model="batchRemark" 
            type="text" 
            class="input" 
            style="width: 240px" 
            placeholder="批量备注（可选）"
          />

          <button 
            class="btn btn-primary"
            :disabled="!batchAction || selectedCount === 0 || processing"
            @click="executeBatch"
          >
            {{ processing ? '处理中...' : '执行批量操作' }}
          </button>

          <button 
            class="btn btn-outline" 
            @click="loadRefunds"
          >
            刷新列表
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header flex items-center justify-between">
        <span>待复核退款列表</span>
        <span class="text-sm text-gray-500">共 {{ refunds.length }} 条记录</span>
      </div>
      <div class="overflow-auto" style="max-height: 550px">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 50px">
                <input 
                  type="checkbox" 
                  :checked="allSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th>客户</th>
              <th>套餐</th>
              <th>退款次数</th>
              <th>退款原因</th>
              <th>站点</th>
              <th>当前状态</th>
              <th>提交时间</th>
            </tr>
          </thead>
          <tbody v-if="!loading">
            <tr 
              v-for="r in refunds" 
              :key="r.id"
              :class="selectedIds.has(r.id) ? 'bg-blue-50' : ''"
            >
              <td>
                <input 
                  type="checkbox" 
                  :checked="selectedIds.has(r.id)"
                  @change="toggleSelect(r.id)"
                  :disabled="r.status !== RefundStatus.SUBMITTED && r.status !== RefundStatus.CS_REVIEWING"
                />
              </td>
              <td>
                <div class="font-medium">{{ r.package.customerName }}</div>
                <div class="text-xs text-gray-500">{{ r.package.customerPhone }}</div>
              </td>
              <td>{{ r.package.packageType }}</td>
              <td>{{ r.refundCount }} 次</td>
              <td class="max-w-xs truncate text-sm text-gray-600">
                {{ r.customerReason }}
              </td>
              <td>{{ r.verification?.station.name || '-' }}</td>
              <td>
                <span class="badge" :class="'badge-' + statusBadgeMap[r.status]">
                  {{ statusLabelMap[r.status] }}
                </span>
              </td>
              <td class="text-sm">{{ r.submitTime.slice(0, 16) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="text-center py-8 text-gray-500">加载中...</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">操作说明</div>
      <div class="card-body text-sm text-gray-600">
        <ul class="list-disc list-inside space-y-1">
          <li>勾选需要批量处理的退款申诉记录</li>
          <li>选择批量操作类型：通过、驳回、或转现场核验</li>
          <li>可添加统一的处理备注</li>
          <li>点击执行后将批量更新所有选中记录的状态</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-blue-50 {
  background-color: #eff6ff;
}
</style>
