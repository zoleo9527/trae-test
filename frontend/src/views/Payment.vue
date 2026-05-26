<template>
  <div class="bg-white rounded-xl shadow-sm">
    <div class="p-4 border-b border-gray-100">
      <h3 class="text-lg font-semibold text-gray-800">回款跟踪</h3>
    </div>

    <div class="p-4">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <el-icon class="is-loading text-3xl text-primary-500">
          <Loading />
        </el-icon>
      </div>

      <el-table v-else :data="payments" stripe style="width: 100%">
        <el-table-column prop="compensation.complaint.customerName" label="客户名称" width="120" />
        <el-table-column prop="amount" label="回款金额" width="120">
          <template #default="{ row }">
            <span class="text-green-600 font-semibold">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="回款方式" width="120" />
        <el-table-column prop="paymentDate" label="回款日期" width="160">
          <template #default="{ row }">
            {{ row.paymentDate ? formatDate(row.paymentDate) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="recorder.name" label="登记人" width="100" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="登记时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="p-4 border-t border-gray-100">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Loading } from 'element-plus';
import { paymentApi } from '../api';
import type { Payment } from '../types';

const loading = ref(false);
const payments = ref<Payment[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

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

async function fetchData() {
  loading.value = true;
  try {
    const result = await paymentApi.getAll({
      page: currentPage.value,
      pageSize: pageSize.value,
    });
    payments.value = result.list;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number) {
  currentPage.value = page;
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>
