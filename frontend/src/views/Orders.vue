<template>
  <Layout>
    <div class="h-full flex flex-col">
      <div class="bg-white rounded-lg border border-gray-100 flex flex-col flex-1">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-800">订单管理</h3>
          <div class="flex items-center gap-3">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索订单号/客户/门店"
              size="small"
              class="w-56"
              clearable
              @input="handleFilter"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="filterStatus"
              placeholder="状态筛选"
              size="small"
              clearable
              @change="handleFilter"
            >
              <el-option label="待分拣" value="pending" />
              <el-option label="已分拣" value="sorted" />
              <el-option label="洗涤中" value="washing" />
              <el-option label="质检中" value="quality_check" />
              <el-option label="需返洗" value="rewash" />
              <el-option label="待交付" value="ready" />
              <el-option label="已交付" value="delivered" />
              <el-option label="客诉中" value="complaint" />
              <el-option label="已完成" value="completed" />
            </el-select>
            <el-select
              v-model="filterStore"
              placeholder="门店筛选"
              size="small"
              clearable
              @change="handleFilter"
            >
              <el-option
                v-for="store in stores"
                :key="store.id"
                :label="store.name"
                :value="store.id"
              />
            </el-select>
          </div>
        </div>

        <div class="flex-1 overflow-auto">
          <el-table
            :data="orderStore.filteredOrders"
            style="width: 100%"
            stripe
            :row-class-name="tableRowClassName"
            @row-click="viewDetail"
          >
            <el-table-column prop="orderNo" label="订单号" width="150" />
            <el-table-column prop="storeName" label="门店" width="110" />
            <el-table-column prop="customerName" label="客户" width="90" />
            <el-table-column label="衣物明细" min-width="250">
              <template #default="{ row }">
                <div class="flex flex-wrap gap-1">
                  <el-tag
                    v-for="item in row.items"
                    :key="item.id"
                    size="small"
                    type="info"
                    effect="plain"
                  >
                    {{ item.name }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="70">
              <template #default="{ row }">{{ row.items.length }} 件</template>
            </el-table-column>
            <el-table-column label="金额" width="90">
              <template #default="{ row }">¥{{ row.totalAmount }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="收衣时间" width="160">
              <template #default="{ row }">{{ row.receivedAt }}</template>
            </el-table-column>
            <el-table-column label="预计交付" width="160">
              <template #default="{ row }">{{ row.expectedDeliveryAt }}</template>
            </el-table-column>
            <el-table-column label="操作人" width="90">
              <template #default="{ row }">{{ row.updatedBy }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <el-drawer v-model="detailDrawerVisible" title="订单详情" size="600px">
      <div v-if="selectedOrder" class="space-y-6">
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <span class="text-lg font-semibold">{{ selectedOrder.orderNo }}</span>
            <el-tag :type="getStatusTagType(selectedOrder.status)" size="small">
              {{ getStatusLabel(selectedOrder.status) }}
            </el-tag>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-500">门店</span>
              <span>{{ selectedOrder.storeName }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">客户</span>
              <span>{{ selectedOrder.customerName }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">收衣时间</span>
              <span>{{ selectedOrder.receivedAt }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">预计交付</span>
              <span>{{ selectedOrder.expectedDeliveryAt }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">总金额</span>
              <span class="font-semibold">¥{{ selectedOrder.totalAmount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">操作人</span>
              <span>{{ selectedOrder.updatedBy }}</span>
            </div>
          </div>
          <div v-if="selectedOrder.remark" class="mt-4 pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-500">备注：{{ selectedOrder.remark }}</p>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-gray-800 mb-3">衣物明细</h4>
          <div v-for="item in selectedOrder.items" :key="item.id" class="bg-gray-50 rounded-lg p-4 mb-3">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-medium">{{ item.name }}</p>
                <p class="text-sm text-gray-500 mt-1">
                  {{ getClothingTypeLabel(item.type) }} · {{ getWashTypeLabel(item.washType) }} · ¥{{ item.price }}
                </p>
                <p v-if="item.brand" class="text-sm text-gray-500">{{ item.brand }} · {{ item.color }}</p>
              </div>
              <el-tag :type="getStatusTagType(item.status)" size="small">
                {{ getStatusLabel(item.status) }}
              </el-tag>
            </div>
            <div v-if="item.defects && item.defects.length" class="mt-2">
              <p class="text-sm text-red-500">瑕疵记录：{{ item.defects.join('、') }}</p>
            </div>
            <div v-if="item.defectPhotos && item.defectPhotos.length" class="mt-3 flex gap-2">
              <el-image
                v-for="(photo, idx) in item.defectPhotos"
                :key="idx"
                :src="photo"
                :preview-src-list="item.defectPhotos"
                fit="cover"
                class="w-20 h-20 rounded cursor-pointer"
              />
            </div>
            <div v-if="item.remark" class="mt-2">
              <p class="text-sm text-gray-500">备注：{{ item.remark }}</p>
            </div>
            <div v-if="item.rewashCount > 0" class="mt-2">
              <el-tag type="warning" size="small">返洗 {{ item.rewashCount }} 次</el-tag>
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-gray-800 mb-3">状态流转历史</h4>
          <el-timeline class="history-timeline">
            <el-timeline-item
              v-for="item in orderHistory"
              :key="item.id"
              :timestamp="item.createdAt"
              placement="top"
            >
              <div class="text-sm">
                <p class="font-medium text-gray-800">
                  {{ getStatusLabel(item.fromStatus) }} → {{ getStatusLabel(item.toStatus) }}
                </p>
                <p class="text-gray-500 mt-1">操作人：{{ item.operator }}</p>
                <p v-if="item.remark" class="text-gray-500 mt-1">备注：{{ item.remark }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-drawer>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Layout from '@/components/Layout.vue';
import { useOrderStore } from '@/stores/order';
import { ORDER_STATUS_LABELS, CLOTHING_TYPE_LABELS, WASH_TYPE_LABELS, STORES } from '@/constants';
import type { Order, OrderStatus } from '@/types';

const orderStore = useOrderStore();

const searchKeyword = ref('');
const filterStatus = ref<OrderStatus | ''>('');
const filterStore = ref('');
const detailDrawerVisible = ref(false);
const selectedOrder = ref<Order | null>(null);

const stores = computed(() => STORES);

const orderHistory = computed(() => {
  if (!selectedOrder.value) return [];
  return orderStore.getOrderHistory(selectedOrder.value.id);
});

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
    complaint: 'danger',
    completed: 'success'
  };
  return map[status] || '';
}

function getClothingTypeLabel(type: string) {
  return CLOTHING_TYPE_LABELS[type] || type;
}

function getWashTypeLabel(type: string) {
  return WASH_TYPE_LABELS[type] || type;
}

function tableRowClassName({ row }: { row: Order }) {
  if (row.status === 'rewash' || row.status === 'complaint') {
    return 'warning-row';
  }
  return '';
}

function handleFilter() {
  orderStore.setFilters({
    status: filterStatus.value,
    storeId: filterStore.value,
    keyword: searchKeyword.value
  });
}

function viewDetail(row: Order) {
  selectedOrder.value = row;
  detailDrawerVisible.value = true;
}
</script>

<style scoped>
</style>
