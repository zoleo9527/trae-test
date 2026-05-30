<template>
  <Layout>
    <div class="h-full flex flex-col">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">本月订单</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ currentMonthStats.totalOrders }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-blue-500 text-xl"><Document /></el-icon>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">本月衣物</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">{{ currentMonthStats.totalItems }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-green-500 text-xl"><Tickets /></el-icon>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">洗涤收入</p>
              <p class="text-2xl font-bold text-gray-800 mt-1">¥{{ currentMonthStats.totalAmount }}</p>
            </div>
            <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-amber-500 text-xl"><Money /></el-icon>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 card-hover border border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">赔付金额</p>
              <p class="text-2xl font-bold text-red-500 mt-1">¥{{ currentMonthStats.totalCompensation }}</p>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-red-500 text-xl"><Warning /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 flex gap-6 min-h-0">
        <div class="flex-1 bg-white rounded-lg border border-gray-100 flex flex-col">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">月结对账列表</h3>
            <el-select
              v-model="selectedMonth"
              placeholder="选择月份"
              size="small"
              style="width: 140px"
              @change="refreshSettlements"
            >
              <el-option label="2024年5月" value="2024-05" />
              <el-option label="2024年4月" value="2024-04" />
              <el-option label="2024年3月" value="2024-03" />
            </el-select>
          </div>
          <div class="flex-1 overflow-auto">
            <el-table
              :data="dynamicSettlements"
              style="width: 100%"
              stripe
              @row-click="viewSettlementDetail"
            >
              <el-table-column prop="month" label="月份" width="110">
                <template #default="{ row }">{{ row.month }}</template>
              </el-table-column>
              <el-table-column prop="storeName" label="门店" width="110" />
              <el-table-column label="订单数" width="90">
                <template #default="{ row }">{{ row.totalOrders }} 单</template>
              </el-table-column>
              <el-table-column label="衣物数" width="90">
                <template #default="{ row }">{{ row.totalItems }} 件</template>
              </el-table-column>
              <el-table-column label="洗涤收入" width="120">
                <template #default="{ row }" class="text-green-600">
                  ¥{{ row.totalAmount }}
                </template>
              </el-table-column>
              <el-table-column label="赔付金额" width="120">
                <template #default="{ row }" class="text-red-500">
                  ¥{{ row.totalCompensation }}
                </template>
              </el-table-column>
              <el-table-column label="结算金额" width="120">
                <template #default="{ row }" class="font-semibold">
                  ¥{{ row.netAmount }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="工厂确认" width="130">
                <template #default="{ row }">
                  <span v-if="row.factoryConfirmedBy" class="text-sm">
                    {{ row.factoryConfirmedBy }}
                  </span>
                  <span v-else class="text-gray-400 text-sm">待确认</span>
                </template>
              </el-table-column>
              <el-table-column label="门店确认" width="130">
                <template #default="{ row }">
                  <span v-if="row.storeConfirmedBy" class="text-sm">
                    {{ row.storeConfirmedBy }}
                  </span>
                  <span v-else class="text-gray-400 text-sm">待确认</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="w-[440px] bg-white rounded-lg border border-gray-100 flex flex-col">
          <div class="p-4 border-b border-gray-100">
            <h3 class="font-semibold text-gray-800">对账单详情</h3>
          </div>
          <div class="flex-1 overflow-auto p-4">
            <template v-if="selectedSettlement">
              <div class="space-y-5">
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-4">
                    <span class="font-medium">{{ selectedSettlement.month }} · {{ selectedSettlement.storeName }}</span>
                    <el-tag :type="getStatusTagType(selectedSettlement.status)" size="small">
                      {{ getStatusLabel(selectedSettlement.status) }}
                    </el-tag>
                  </div>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">订单总数</span>
                      <span>{{ selectedSettlement.totalOrders }} 单</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">衣物总数</span>
                      <span>{{ selectedSettlement.totalItems }} 件</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">洗涤收入</span>
                      <span class="text-green-600">¥{{ selectedSettlement.totalAmount }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500">赔付金额</span>
                      <span class="text-red-500">¥{{ selectedSettlement.totalCompensation }}</span>
                    </div>
                  </div>
                  <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span class="font-medium">净结算金额</span>
                    <span class="text-xl font-bold text-blue-600">¥{{ selectedSettlement.netAmount }}</span>
                  </div>
                </div>

                <div>
                  <h4 class="font-medium text-gray-800 mb-3">确认状态</h4>
                  <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div class="flex items-center">
                        <el-icon :class="selectedSettlement.factoryConfirmedBy ? 'text-green-500' : 'text-gray-300'">
                          <CircleCheck />
                        </el-icon>
                        <span class="ml-2 text-sm">工厂确认</span>
                      </div>
                      <div v-if="selectedSettlement.factoryConfirmedBy" class="text-sm">
                        <span>{{ selectedSettlement.factoryConfirmedBy }}</span>
                        <span class="text-gray-400 ml-2">{{ selectedSettlement.factoryConfirmedAt }}</span>
                      </div>
                      <span v-else class="text-gray-400 text-sm">待确认</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div class="flex items-center">
                        <el-icon :class="selectedSettlement.storeConfirmedBy ? 'text-green-500' : 'text-gray-300'">
                          <CircleCheck />
                        </el-icon>
                        <span class="ml-2 text-sm">门店确认</span>
                      </div>
                      <div v-if="selectedSettlement.storeConfirmedBy" class="text-sm">
                        <span>{{ selectedSettlement.storeConfirmedBy }}</span>
                        <span class="text-gray-400 ml-2">{{ selectedSettlement.storeConfirmedAt }}</span>
                      </div>
                      <span v-else class="text-gray-400 text-sm">待确认</span>
                    </div>
                  </div>
                </div>

                <div v-if="selectedSettlement.status !== 'completed'">
                  <h4 class="font-medium text-gray-800 mb-3">确认操作</h4>
                  <div class="flex gap-2">
                    <el-button
                      type="primary"
                      @click="confirmFactory"
                      :disabled="!userStore.isFactoryManager || selectedSettlement.factoryConfirmedBy"
                      class="flex-1"
                    >
                      工厂确认
                    </el-button>
                    <el-button
                      type="success"
                      @click="confirmStore"
                      :disabled="!userStore.isStoreManager || selectedSettlement.storeConfirmedBy"
                      class="flex-1"
                    >
                      门店确认
                    </el-button>
                  </div>
                  <p class="text-xs text-gray-500 mt-2">
                    * 厂长可执行工厂确认，门店经理可执行门店确认，双方确认后完成对账
                  </p>
                </div>

                <div>
                  <h4 class="font-medium text-gray-800 mb-3">对账明细</h4>
                  <div v-if="selectedSettlement.items && selectedSettlement.items.length > 0">
                    <div
                      v-for="(item, idx) in selectedSettlement.items"
                      :key="idx"
                      class="border border-gray-100 rounded-lg p-3 mb-2"
                    >
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">{{ item.orderNo }}</span>
                        <el-tag size="small" :type="item.status === 'confirmed' ? 'success' : 'warning'">
                          {{ item.status === 'confirmed' ? '已确认' : '待确认' }}
                        </el-tag>
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ item.customerName }} · {{ item.itemCount }}件 · 订单¥{{ item.orderAmount }}
                        <span v-if="item.compensationAmount > 0" class="text-red-500 ml-2">
                          赔付¥{{ item.compensationAmount }}
                        </span>
                      </div>
                      <div class="text-xs text-blue-600 mt-1">
                        净额：¥{{ item.netAmount }}
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center text-gray-400 py-8 text-sm">
                    暂无明细数据
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="text-center text-gray-400 py-20">
                <el-icon class="text-4xl mb-2"><Document /></el-icon>
                <p>请点击左侧列表查看对账单详情</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import Layout from '@/components/Layout.vue';
import { useSettlementStore } from '@/stores/settlement';
import { useUserStore } from '@/stores/user';
import type { MonthlySettlement } from '@/types';

const settlementStore = useSettlementStore();
const userStore = useUserStore();

const selectedMonth = ref('2024-05');
const selectedSettlement = ref<MonthlySettlement | null>(null);

const dynamicSettlements = computed(() => {
  return settlementStore.getDynamicSettlements();
});

const currentMonthStats = computed(() => {
  return settlementStore.calculateMonthStats(selectedMonth.value);
});

function refreshSettlements() {
  selectedSettlement.value = null;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成'
  };
  return map[status] || status;
}

function getStatusTagType(status: string) {
  const map: Record<string, string> = {
    draft: 'info',
    pending: 'warning',
    confirmed: 'primary',
    completed: 'success'
  };
  return map[status] || '';
}

function viewSettlementDetail(row: MonthlySettlement) {
  selectedSettlement.value = row;
}

function confirmFactory() {
  if (!selectedSettlement.value) return;
  settlementStore.confirmFactorySettlement(
    selectedSettlement.value.id,
    userStore.currentUser.name
  );
  ElMessage.success('工厂确认成功');
}

function confirmStore() {
  if (!selectedSettlement.value) return;
  settlementStore.confirmStoreSettlement(
    selectedSettlement.value.id,
    userStore.currentUser.name
  );
  ElMessage.success('门店确认成功');
}
</script>

<style scoped>
</style>
