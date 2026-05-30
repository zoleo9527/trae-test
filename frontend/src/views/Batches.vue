<template>
  <Layout>
    <div class="h-full flex flex-col">
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">进行中的批次</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ batchStore.activeBatches.length }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-blue-500 text-xl"><Loading /></el-icon>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">已完成批次</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ batchStore.completedBatches.length }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-green-500 text-xl"><CircleCheck /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <div class="mb-6">
          <h3 class="font-semibold text-gray-800 mb-4">进行中的批次</h3>
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="batch in batchStore.activeBatches"
              :key="batch.id"
              class="bg-white rounded-lg p-5 card-hover border border-gray-100"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <el-tag type="primary">{{ getWashTypeLabel(batch.washType) }}</el-tag>
                  <span class="ml-3 font-medium">{{ batch.batchNo }}</span>
                </div>
                <el-tag type="warning" size="small">进行中</el-tag>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">衣物数量</span>
                  <span class="font-medium">{{ getActualItemCount(batch.id) }} 件</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">关联订单</span>
                  <span>{{ getUniqueOrders(batch.id).length }} 单</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">操作人</span>
                  <span>{{ batch.operator }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">开始时间</span>
                  <span>{{ batch.startedAt }}</span>
                </div>
              </div>

              <div v-if="batch.remark" class="mt-4 pt-4 border-t border-gray-100">
                <p class="text-sm text-gray-500">{{ batch.remark }}</p>
              </div>

              <div class="mt-4">
                <el-button type="primary" size="small" @click="viewBatchDetail(batch)" class="w-full">
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-semibold text-gray-800 mb-4">已完成批次</h3>
          <el-table :data="batchStore.completedBatches" style="width: 100%" stripe>
            <el-table-column prop="batchNo" label="批次号" width="200" />
            <el-table-column label="洗涤类型" width="120">
              <template #default="{ row }">
                <el-tag type="primary" size="small">{{ getWashTypeLabel(row.washType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="衣物数量" width="100">
              <template #default="{ row }">{{ getActualItemCount(row.id) }} 件</template>
            </el-table-column>
            <el-table-column label="关联订单" width="100">
              <template #default="{ row }">{{ getUniqueOrders(row.id).length }} 单</template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="startedAt" label="开始时间" width="160" />
            <el-table-column prop="completedAt" label="完成时间" width="160" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </div>
      </div>
    </div>

    <el-drawer v-model="batchDetailVisible" title="批次详情" size="600px">
      <div v-if="selectedBatch" class="space-y-6">
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <el-tag type="primary">{{ getWashTypeLabel(selectedBatch.washType) }}</el-tag>
              <span class="ml-3 text-lg font-semibold">{{ selectedBatch.batchNo }}</span>
            </div>
            <el-tag :type="selectedBatch.status === 'washing' ? 'warning' : 'success'" size="small">
              {{ selectedBatch.status === 'washing' ? '进行中' : '已完成' }}
            </el-tag>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-500">衣物数量</span>
              <span class="font-medium">{{ getActualItemCount(selectedBatch.id) }} 件</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">关联订单</span>
              <span>{{ getUniqueOrders(selectedBatch.id).length }} 单</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">操作人</span>
              <span>{{ selectedBatch.operator }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">开始时间</span>
              <span>{{ selectedBatch.startedAt }}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-gray-800 mb-3">关联订单与衣物 ({{ getActualItemCount(selectedBatch.id) }} 件)</h4>
          <div v-for="group in getBatchItemsGrouped(selectedBatch.id)" :key="group.orderId" class="mb-4">
            <div class="font-medium text-sm mb-2 flex items-center justify-between">
              <span>{{ group.orderNo }}</span>
              <span class="text-gray-500 text-xs">{{ group.items.length }} 件</span>
            </div>
            <div v-for="item in group.items" :key="item.item.id" 
                 class="bg-gray-50 rounded p-3 mb-2 text-sm">
              <div class="flex items-center justify-between">
                <span>{{ item.item.name }}</span>
                <el-tag :type="getStatusTagType(item.item.status)" size="small">
                  {{ getStatusLabel(item.item.status) }}
                </el-tag>
              </div>
              <div v-if="item.item.defects && item.item.defects.length" class="mt-1 text-red-500 text-xs">
                瑕疵：{{ item.item.defects.join('、') }}
              </div>
              <div v-if="item.item.defectPhotos && item.item.defectPhotos.length" class="mt-2 flex gap-2">
                <el-image
                  v-for="(photo, idx) in item.item.defectPhotos"
                  :key="idx"
                  :src="photo"
                  :preview-src-list="item.item.defectPhotos"
                  fit="cover"
                  class="w-16 h-16 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
          <div v-if="getBatchItemsGrouped(selectedBatch.id).length === 0" class="text-center text-gray-400 py-8">
            暂无衣物数据
          </div>
        </div>
      </div>
    </el-drawer>
  </Layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Layout from '@/components/Layout.vue';
import { useBatchStore } from '@/stores/batch';
import { useOrderStore } from '@/stores/order';
import { WASH_TYPE_LABELS, ORDER_STATUS_LABELS } from '@/constants';
import type { Batch, OrderStatus } from '@/types';

const batchStore = useBatchStore();
const orderStore = useOrderStore();

const batchDetailVisible = ref(false);
const selectedBatch = ref<Batch | null>(null);

function getWashTypeLabel(type: string) {
  return WASH_TYPE_LABELS[type] || type;
}

function getStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as OrderStatus] || status;
}

function getStatusTagType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    sorted: 'primary',
    washing: 'info',
    quality_check: '',
    rewash: 'danger',
    ready: 'success',
    delivered: 'info',
    completed: 'success'
  };
  return map[status] || '';
}

function getBatchItemsGrouped(batchId: string) {
  const items = batchStore.getBatchItems(batchId);
  const grouped: Record<string, { orderId: string; orderNo: string; items: typeof items }> = {};
  
  items.forEach(item => {
    if (!grouped[item.orderId]) {
      grouped[item.orderId] = {
        orderId: item.orderId,
        orderNo: item.orderNo,
        items: []
      };
    }
    grouped[item.orderId].items.push(item);
  });
  
  return Object.values(grouped);
}

function getActualItemCount(batchId: string) {
  return batchStore.getBatchItems(batchId).length;
}

function getUniqueOrders(batchId: string) {
  const items = batchStore.getBatchItems(batchId);
  return [...new Set(items.map(i => i.orderId))];
}

function viewBatchDetail(batch: Batch) {
  selectedBatch.value = batch;
  batchDetailVisible.value = true;
}
</script>

<style scoped>
</style>
