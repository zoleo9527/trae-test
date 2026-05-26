<template>
  <div class="bg-white rounded-xl shadow-sm">
    <div class="p-4 border-b border-gray-100">
      <h3 class="text-lg font-semibold text-gray-800">赔付审批</h3>
    </div>

    <div class="p-4">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <el-icon class="is-loading text-3xl text-primary-500">
          <Loading />
        </el-icon>
      </div>

      <el-table v-else :data="compensations" stripe style="width: 100%">
        <el-table-column prop="complaint.customerName" label="客户名称" width="120" />
        <el-table-column prop="complaint.complaintType" label="客诉类型" width="120" />
        <el-table-column prop="amount" label="赔付金额" width="120">
          <template #default="{ row }">
            <span class="text-accent-600 font-semibold">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="compensationMethod" label="赔付方式" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['px-2 py-1 rounded text-xs', getStatusClass(row.status)]">
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="success" @click="handleApprove(row)">
                批准
              </el-button>
              <el-button size="small" type="danger" @click="handleReject(row)">
                驳回
              </el-button>
            </template>
            <span v-else class="text-gray-400 text-sm">-</span>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading } from 'element-plus';
import { compensationApi } from '../api';
import type { Compensation } from '../types';

const loading = ref(false);
const compensations = ref<Compensation[]>([]);
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

function getStatusClass(status: string) {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-700';
    case 'rejected': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'approved': return '已批准';
    case 'rejected': return '已驳回';
    default: return '待审批';
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const result = await compensationApi.getAll({
      page: currentPage.value,
      pageSize: pageSize.value,
    });
    compensations.value = result.list;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number) {
  currentPage.value = page;
  fetchData();
}

async function handleApprove(row: Compensation) {
  try {
    await ElMessageBox.confirm('确定批准此赔付申请？', '确认操作', { type: 'warning' });
    await compensationApi.approve(row.id);
    ElMessage.success('已批准');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
}

async function handleReject(row: Compensation) {
  try {
    await ElMessageBox.confirm('确定驳回此赔付申请？', '确认操作', { type: 'warning' });
    await compensationApi.reject(row.id);
    ElMessage.success('已驳回');
    fetchData();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
}

onMounted(() => {
  fetchData();
});
</script>
