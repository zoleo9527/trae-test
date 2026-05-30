<template>
  <Layout>
    <div class="h-full flex flex-col">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">待分拣</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ orderStore.pendingCount }}</p>
            </div>
            <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-amber-500 text-xl"><Clock /></el-icon>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">质检中</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ orderStore.qualityCheckCount }}</p>
            </div>
            <div class="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-cyan-500 text-xl"><CircleCheck /></el-icon>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">需返洗</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ orderStore.rewashCount }}</p>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-red-500 text-xl"><RefreshLeft /></el-icon>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">客诉处理</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ complaintStore.pendingComplaints.length }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-orange-500 text-xl"><Warning /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 flex gap-6 min-h-0">
        <div class="flex-1 bg-white rounded-lg border border-gray-100 flex flex-col">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">批量复核面板</h3>
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
                <el-option label="客诉中" value="complaint" />
              </el-select>
            </div>
          </div>

          <div class="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <el-checkbox
                :indeterminate="isIndeterminate"
                v-model="checkAll"
                @change="handleCheckAll"
              >
                全选
              </el-checkbox>
              <span class="text-sm text-gray-500">
                已选择 {{ orderStore.selectedOrderIds.length }} 项
              </span>
            </div>
            <div class="flex items-center gap-2">
              <el-button
                size="small"
                type="primary"
                :disabled="orderStore.selectedOrderIds.length === 0"
                @click="showBatchModal('sorted')"
              >
                批量分拣
              </el-button>
              <el-button
                size="small"
                type="success"
                :disabled="orderStore.selectedOrderIds.length === 0"
                @click="showBatchModal('ready')"
              >
                批量质检通过
              </el-button>
              <el-button
                size="small"
                type="warning"
                :disabled="orderStore.selectedOrderIds.length === 0"
                @click="showBatchModal('rewash')"
              >
                批量返洗
              </el-button>
            </div>
          </div>

          <div class="flex-1 overflow-auto">
            <el-table
              :data="orderStore.filteredOrders"
              style="width: 100%"
              @selection-change="handleSelectionChange"
              :row-class-name="tableRowClassName"
              stripe
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column prop="orderNo" label="订单号" width="150" />
              <el-table-column prop="storeName" label="门店" width="110" />
              <el-table-column prop="customerName" label="客户" width="90" />
              <el-table-column label="衣物数量" width="90">
                <template #default="{ row }">
                  <span>{{ row.items.length }} 件</span>
                </template>
              </el-table-column>
              <el-table-column prop="totalAmount" label="金额" width="90">
                <template #default="{ row }">
                  <span>¥{{ row.totalAmount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="receivedAt" label="收衣时间" width="150" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="viewDetail(row)">
                    详情
                  </el-button>
                  <el-button link type="success" size="small" @click="viewHandover(row)">
                    交接
                  </el-button>
                  <el-button link type="primary" size="small" @click="viewHistory(row)">
                    历史
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="w-96 bg-white rounded-lg border border-gray-100 flex flex-col">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">{{ selectedOrder ? '订单详情' : '操作历史' }}</h3>
            <el-button link type="primary" size="small" @click="selectedOrder = null" v-if="selectedOrder">
              返回
            </el-button>
          </div>

          <div class="flex-1 overflow-auto p-4">
            <template v-if="selectedOrder">
              <div class="space-y-4">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-500">订单号</span>
                    <span class="font-medium">{{ selectedOrder.orderNo }}</span>
                  </div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-500">门店</span>
                    <span>{{ selectedOrder.storeName }}</span>
                  </div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-500">客户</span>
                    <span>{{ selectedOrder.customerName }}</span>
                  </div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-500">当前状态</span>
                    <el-tag :type="getStatusTagType(selectedOrder.status)" size="small">
                      {{ getStatusLabel(selectedOrder.status) }}
                    </el-tag>
                  </div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-500">操作人</span>
                    <span>{{ selectedOrder.updatedBy }}</span>
                  </div>
                </div>

                <el-divider class="my-2" />

                <div class="flex gap-2">
                  <el-button type="primary" size="small" @click="viewHandover(selectedOrder)" class="flex-1">
                    <el-icon class="mr-1"><DocumentCopy /></el-icon>
                    交接回单
                  </el-button>
                </div>

                <el-divider class="my-2" />

                <div>
                  <h4 class="font-medium text-gray-800 mb-3">衣物明细</h4>
                  <div v-for="item in selectedOrder.items" :key="item.id" class="bg-gray-50 rounded-lg p-3 mb-2">
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="font-medium text-sm">{{ item.name }}</p>
                        <p class="text-xs text-gray-500 mt-1">
                          {{ getClothingTypeLabel(item.type) }} · {{ getWashTypeLabel(item.washType) }} · ¥{{ item.price }}
                        </p>
                        <p v-if="item.brand" class="text-xs text-gray-500">{{ item.brand }} · {{ item.color }}</p>
                      </div>
                      <el-tag :type="getStatusTagType(item.status)" size="small">
                        {{ getStatusLabel(item.status) }}
                      </el-tag>
                    </div>
                    <div v-if="item.defects && item.defects.length > 0" class="mt-2">
                      <p class="text-xs text-red-500">瑕疵记录：{{ item.defects.join('、') }}</p>
                    </div>
                    <div v-if="item.remark" class="mt-2">
                      <p class="text-xs text-gray-500">备注：{{ item.remark }}</p>
                    </div>
                    <div v-if="item.rewashCount > 0" class="mt-2">
                      <el-tag type="warning" size="small">返洗 {{ item.rewashCount }} 次</el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <el-timeline class="history-timeline">
                <el-timeline-item
                  v-for="item in recentHistory"
                  :key="item.id"
                  :timestamp="item.createdAt"
                  placement="top"
                >
                  <div class="text-sm">
                    <p class="font-medium text-gray-800">
                      {{ getStatusLabel(item.fromStatus) }} → {{ getStatusLabel(item.toStatus) }}
                    </p>
                    <p class="text-gray-500 mt-1">{{ item.operator }}</p>
                    <p v-if="item.remark" class="text-gray-500 mt-1">{{ item.remark }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </template>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="batchModalVisible" :title="batchModalTitle" width="500px">
      <el-form :model="batchForm" label-width="80px">
        <el-form-item label="操作人">
          <el-input v-model="batchForm.operator" disabled />
        </el-form-item>
        <el-form-item label="处理数量">
          <el-input :value="orderStore.selectedOrderIds.length + ' 项'" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchForm.remark" type="textarea" :rows="3" placeholder="请输入处理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchAction">确认执行</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="historyDrawerVisible" title="状态流转历史" size="500px">
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
    </el-drawer>

    <el-drawer v-model="handoverDrawerVisible" title="交接回单记录" size="500px">
      <div v-if="handoverOrder" class="space-y-4">
        <div class="bg-blue-50 rounded-lg p-4">
          <p class="font-medium text-blue-800">{{ handoverOrder.orderNo }}</p>
          <p class="text-sm text-blue-600 mt-1">
            {{ handoverOrder.storeName }} · {{ handoverOrder.customerName }} · {{ handoverOrder.items.length }} 件
          </p>
        </div>

        <div v-if="handoverRecords.length > 0">
          <div v-for="record in handoverRecords" :key="record.id" class="border border-gray-200 rounded-lg p-4 mb-3">
            <div class="flex items-center justify-between mb-3">
              <el-tag :type="record.type === 'receive' ? 'primary' : 'success'" size="small">
                {{ record.type === 'receive' ? '工厂收衣' : '门店交付' }}
              </el-tag>
              <span class="text-sm text-gray-500">{{ record.createdAt }}</span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">操作人</span>
                <span>{{ record.operator }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">接收人</span>
                <span>{{ record.receiver }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">数量</span>
                <span>{{ record.itemCount }} 件</span>
              </div>
            </div>
            <div v-if="record.remark" class="mt-3 pt-3 border-t border-gray-100">
              <p class="text-sm text-gray-600">备注：{{ record.remark }}</p>
            </div>
            <div v-if="record.photos && record.photos.length" class="mt-3 flex gap-2">
              <el-image
                v-for="(photo, idx) in record.photos"
                :key="idx"
                :src="photo"
                :preview-src-list="record.photos"
                fit="cover"
                class="w-16 h-16 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 py-12">
          <el-icon class="text-4xl mb-2"><Document /></el-icon>
          <p>暂无交接记录</p>
        </div>
      </div>
    </el-drawer>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import Layout from '@/components/Layout.vue';
import { useOrderStore } from '@/stores/order';
import { useUserStore } from '@/stores/user';
import { useComplaintStore } from '@/stores/complaint';
import { useHandoverStore } from '@/stores/handover';
import { ORDER_STATUS_LABELS, CLOTHING_TYPE_LABELS, WASH_TYPE_LABELS } from '@/constants';
import type { Order, OrderStatus } from '@/types';

const orderStore = useOrderStore();
const userStore = useUserStore();
const complaintStore = useComplaintStore();
const handoverStore = useHandoverStore();

const searchKeyword = ref('');
const filterStatus = ref<OrderStatus | ''>('');
const checkAll = ref(false);
const selectedOrder = ref<Order | null>(null);
const handoverOrder = ref<Order | null>(null);
const batchModalVisible = ref(false);
const batchTargetStatus = ref<OrderStatus>('sorted');
const historyDrawerVisible = ref(false);
const handoverDrawerVisible = ref(false);
const currentHistoryOrderId = ref('');

const batchForm = reactive({
  operator: '',
  remark: ''
});

const isIndeterminate = computed(() => {
  const count = orderStore.selectedOrderIds.length;
  return count > 0 && count < orderStore.filteredOrders.length;
});

const recentHistory = computed(() => {
  return [...orderStore.statusHistory]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);
});

const orderHistory = computed(() => {
  return orderStore.getOrderHistory(currentHistoryOrderId.value);
});

const handoverRecords = computed(() => {
  if (!handoverOrder.value) return [];
  return handoverStore.getRecordsByOrderId(handoverOrder.value.id);
});

const batchModalTitle = computed(() => {
  const titles: Record<string, string> = {
    sorted: '批量分拣确认',
    ready: '批量质检通过',
    rewash: '批量返洗确认'
  };
  return titles[batchTargetStatus.value] || '批量操作';
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
    storeId: '',
    keyword: searchKeyword.value
  });
}

function handleSelectionChange(selection: Order[]) {
  orderStore.selectedOrderIds = selection.map(o => o.id);
  checkAll.value = selection.length === orderStore.filteredOrders.length;
}

function handleCheckAll(val: boolean) {
  if (val) {
    orderStore.selectAllOrders();
  } else {
    orderStore.clearSelection();
  }
}

function viewDetail(row: Order) {
  selectedOrder.value = row;
}

function viewHistory(row: Order) {
  currentHistoryOrderId.value = row.id;
  historyDrawerVisible.value = true;
}

function viewHandover(row: Order) {
  handoverOrder.value = row;
  handoverDrawerVisible.value = true;
}

function showBatchModal(status: OrderStatus) {
  batchTargetStatus.value = status;
  batchForm.operator = userStore.currentUser.name;
  batchForm.remark = '';
  batchModalVisible.value = true;
}

function confirmBatchAction() {
  orderStore.batchUpdateStatus(
    orderStore.selectedOrderIds,
    batchTargetStatus.value,
    batchForm.operator,
    batchForm.remark
  );
  batchModalVisible.value = false;
  ElMessage.success('批量操作成功');
}
</script>

<style scoped>
</style>
