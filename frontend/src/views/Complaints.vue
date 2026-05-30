<template>
  <Layout>
    <div class="h-full flex flex-col">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">待处理</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ complaintStore.pendingComplaints.length }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-orange-500 text-xl"><Clock /></el-icon>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">调查中</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ complaintStore.investigatingComplaints.length }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-blue-500 text-xl"><Search /></el-icon>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">本月赔付</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">¥{{ totalCompensation }}</p>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-red-500 text-xl"><Money /></el-icon>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">客诉率</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ complaintRate }}%</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-purple-500 text-xl"><TrendCharts /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 flex gap-6 min-h-0">
        <div class="flex-1 bg-white rounded-lg border border-gray-100 flex flex-col">
          <div class="p-4 border-b border-gray-100">
            <h3 class="font-semibold text-gray-800">客诉列表</h3>
          </div>
          <div class="flex-1 overflow-auto">
            <el-table
              :data="complaintStore.complaints"
              style="width: 100%"
              stripe
              @row-click="viewComplaintDetail"
            >
              <el-table-column prop="orderNo" label="订单号" width="140" />
              <el-table-column prop="storeName" label="门店" width="100" />
              <el-table-column prop="customerName" label="客户" width="90" />
              <el-table-column prop="itemName" label="衣物" width="100" />
              <el-table-column label="类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="getComplaintTypeTag(row.type)" size="small">
                    {{ getComplaintTypeLabel(row.type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="赔付金额" width="120">
                <template #default="{ row }">
                  <span v-if="row.approvedCompensation" class="text-red-500">¥{{ row.approvedCompensation }}</span>
                  <span v-else class="text-gray-400">待定</span>
                </template>
              </el-table-column>
              <el-table-column prop="handler" label="处理人" width="90" />
              <el-table-column prop="createdAt" label="投诉时间" width="160" />
            </el-table>
          </div>
        </div>

        <div class="w-[420px] bg-white rounded-lg border border-gray-100 flex flex-col">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">客诉详情</h3>
          </div>
          <div class="flex-1 overflow-auto p-4">
            <template v-if="selectedComplaint">
              <div class="space-y-5">
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <span class="font-medium">{{ selectedComplaint.orderNo }}</span>
                    <el-tag :type="getStatusTagType(selectedComplaint.status)" size="small">
                      {{ getStatusLabel(selectedComplaint.status) }}
                    </el-tag>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">门店</span>
                      <span>{{ selectedComplaint.storeName }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">客户</span>
                      <span>{{ selectedComplaint.customerName }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">衣物</span>
                      <span>{{ selectedComplaint.itemName }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">类型</span>
                      <span>{{ getComplaintTypeLabel(selectedComplaint.type) }}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 class="font-medium text-gray-800 mb-2">问题描述</h4>
                  <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded">{{ selectedComplaint.description }}</p>
                </div>

                <div v-if="selectedComplaint.photos && selectedComplaint.photos.length">
                  <h4 class="font-medium text-gray-800 mb-2">举证照片</h4>
                  <div class="flex gap-2 flex-wrap">
                    <el-image
                      v-for="(photo, idx) in selectedComplaint.photos"
                      :key="idx"
                      :src="photo"
                      :preview-src-list="selectedComplaint.photos"
                      fit="cover"
                      class="w-20 h-20 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-orange-50 rounded-lg p-3">
                    <p class="text-xs text-orange-600 mb-1">客户要求赔付</p>
                    <p class="text-lg font-bold text-orange-600">¥{{ selectedComplaint.requestedCompensation }}</p>
                  </div>
                  <div class="bg-red-50 rounded-lg p-3">
                    <p class="text-xs text-red-600 mb-1">核定赔付金额</p>
                    <p v-if="selectedComplaint.approvedCompensation !== undefined" class="text-lg font-bold text-red-600">
                      ¥{{ selectedComplaint.approvedCompensation }}
                    </p>
                    <p v-else class="text-lg font-bold text-gray-400">待定</p>
                  </div>
                </div>

                <div v-if="selectedComplaint.handlerRemark">
                  <h4 class="font-medium text-gray-800 mb-2">处理意见</h4>
                  <p class="text-sm text-gray-600 bg-blue-50 p-3 rounded">{{ selectedComplaint.handlerRemark }}</p>
                  <p class="text-xs text-gray-500 mt-2">处理人：{{ selectedComplaint.handler }}</p>
                </div>

                <div v-if="selectedComplaint.status === 'pending' || selectedComplaint.status === 'investigating'">
                  <el-divider />
                  <h4 class="font-medium text-gray-800 mb-3">处理操作</h4>
                  <el-form :model="handlerForm" label-width="80px">
                    <el-form-item label="处理意见">
                      <el-input
                        v-model="handlerForm.remark"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入处理意见"
                      />
                    </el-form-item>
                    <el-form-item label="赔付金额">
                      <el-input-number
                        v-model="handlerForm.compensation"
                        :min="0"
                        :max="selectedComplaint.requestedCompensation * 2"
                        class="w-full"
                      />
                    </el-form-item>
                    <div class="flex gap-2">
                      <el-button type="primary" @click="handleApprove" :disabled="!userStore.isFactoryManager">
                        同意赔付
                      </el-button>
                      <el-button type="danger" @click="handleReject" :disabled="!userStore.isFactoryManager">
                        拒绝赔付
                      </el-button>
                      <el-button @click="handleInvestigate">
                        开始调查
                      </el-button>
                    </div>
                    <p v-if="!userStore.isFactoryManager" class="text-xs text-gray-500 mt-2">
                      * 仅厂长可进行赔付审批
                    </p>
                  </el-form>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="text-center text-gray-400 py-20">
                <el-icon class="text-4xl mb-2"><Document /></el-icon>
                <p>请点击左侧列表查看客诉详情</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import Layout from '@/components/Layout.vue';
import { useComplaintStore } from '@/stores/complaint';
import { useUserStore } from '@/stores/user';
import { useOrderStore } from '@/stores/order';
import { COMPLAINT_TYPE_LABELS, COMPLAINT_STATUS_LABELS } from '@/constants';
import type { Complaint, ComplaintStatus } from '@/types';

const complaintStore = useComplaintStore();
const userStore = useUserStore();
const orderStore = useOrderStore();

const selectedComplaint = ref<Complaint | null>(null);

const handlerForm = reactive({
  remark: '',
  compensation: 0
});

const totalCompensation = computed(() => {
  return complaintStore.complaints
    .filter(c => c.status === 'approved' || c.status === 'resolved')
    .reduce((sum, c) => sum + (c.approvedCompensation || 0), 0);
});

const complaintRate = computed(() => {
  const total = orderStore.orders.length;
  if (total === 0) return '0.00';
  return ((complaintStore.complaints.length / total) * 100).toFixed(2);
});

function getComplaintTypeLabel(type: string) {
  return COMPLAINT_TYPE_LABELS[type] || type;
}

function getComplaintTypeTag(type: string) {
  const map: Record<string, string> = {
    damage: 'danger',
    stain: 'warning',
    lost: 'danger',
    delay: 'info',
    others: ''
  };
  return map[type] || '';
}

function getStatusLabel(status: string) {
  return COMPLAINT_STATUS_LABELS[status as ComplaintStatus] || status;
}

function getStatusTagType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    investigating: 'primary',
    approved: 'success',
    rejected: 'info',
    resolved: 'success'
  };
  return map[status] || '';
}

function viewComplaintDetail(row: Complaint) {
  selectedComplaint.value = row;
  handlerForm.remark = row.handlerRemark || '';
  handlerForm.compensation = row.approvedCompensation || row.requestedCompensation;
}

function refreshSelectedComplaint() {
  if (!selectedComplaint.value) return;
  const updated = complaintStore.getComplaintById(selectedComplaint.value.id);
  if (updated) {
    selectedComplaint.value = { ...updated };
  }
}

function handleApprove() {
  if (!selectedComplaint.value) return;
  complaintStore.updateComplaintStatus(
    selectedComplaint.value.id,
    'approved',
    userStore.currentUser.name,
    handlerForm.remark,
    handlerForm.compensation
  );
  refreshSelectedComplaint();
  ElMessage.success('已同意赔付，订单已恢复为待交付状态');
}

function handleReject() {
  if (!selectedComplaint.value) return;
  complaintStore.updateComplaintStatus(
    selectedComplaint.value.id,
    'rejected',
    userStore.currentUser.name,
    handlerForm.remark,
    0
  );
  refreshSelectedComplaint();
  ElMessage.success('已拒绝赔付，订单已恢复为待交付状态');
}

function handleInvestigate() {
  if (!selectedComplaint.value) return;
  complaintStore.updateComplaintStatus(
    selectedComplaint.value.id,
    'investigating',
    userStore.currentUser.name,
    handlerForm.remark
  );
  refreshSelectedComplaint();
  ElMessage.success('已开始调查');
}
</script>

<style scoped>
</style>
