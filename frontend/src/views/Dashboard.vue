<template>
  <div class="space-y-6">
    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="stat in statsCards"
        :key="stat.label"
        class="bg-white rounded-xl p-5 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-gray-800 mt-1">{{ stat.value }}</p>
          </div>
          <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', stat.bgColor]">
            <component :is="stat.icon" :class="['w-6 h-6', stat.iconColor]" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索客户名或过磅单号"
            class="w-64"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <component :is="Search" class="w-4 h-4 text-gray-400" />
            </template>
          </el-input>
          
          <el-select v-model="filterStatus" placeholder="全部状态" class="w-40" clearable @change="fetchData">
            <el-option
              v-for="(label, value) in STATUS_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </div>

        <div class="flex items-center gap-3">
          <el-button
            v-if="selectedIds.length > 0"
            type="danger"
            size="small"
            @click="complaintStore.clearSelection"
          >
            取消选择 ({{ selectedIds.length }})
          </el-button>
          <el-dropdown v-if="selectedIds.length > 0 && authStore.hasRole('manager')" @command="handleBatchAction">
            <el-button type="primary" size="small">
              批量操作
              <component :is="ChevronDown" class="w-4 h-4 ml-1" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="recheck">批量转复检</el-dropdown-item>
                <el-dropdown-item command="approve">批量通过</el-dropdown-item>
                <el-dropdown-item command="reject">批量驳回</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="p-4">
        <div v-if="loading" class="flex items-center justify-center py-20">
          <el-icon class="is-loading text-4xl text-primary-500">
            <Loading />
          </el-icon>
        </div>

        <div v-else class="grid grid-cols-2 gap-4">
          <div
            v-for="complaint in complaints"
            :key="complaint.id"
            class="border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
            :class="{ 'border-primary-400 bg-primary-50/30': selectedIds.includes(complaint.id) }"
            @click="openDetail(complaint)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <el-checkbox
                  :model-value="selectedIds.includes(complaint.id)"
                  @click.stop
                  @change="complaintStore.toggleSelect(complaint.id)"
                />
                <div>
                  <h3 class="font-semibold text-gray-800">{{ complaint.customerName }}</h3>
                  <p class="text-sm text-gray-500">{{ complaint.weightNoteNo || '无单号' }}</p>
                </div>
              </div>
              <span :class="['px-3 py-1 rounded-full text-xs font-medium', STATUS_COLORS[complaint.status]]">
                {{ STATUS_LABELS[complaint.status] }}
              </span>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2 text-gray-600">
                <component :is="Tag" class="w-4 h-4" />
                <span>{{ complaint.complaintType }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <component :is="FileText" class="w-4 h-4" />
                <span class="line-clamp-1">{{ complaint.description || '无描述' }}</span>
              </div>
              <div v-if="complaint.rechecks && complaint.rechecks.length > 0" class="flex items-center gap-2 text-primary-600">
                <component :is="CheckCircle" class="w-4 h-4" />
                <span>已复检 · 损耗 {{ complaint.rechecks[0].lossRatio }}%</span>
              </div>
            </div>

            <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <component :is="Clock" class="w-3 h-3" />
                <span>{{ formatDate(complaint.createdAt) }}</span>
              </div>
              <div class="flex items-center gap-2" @click.stop>
                <el-button size="small" text type="primary" @click="openDetail(complaint)">
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!loading && complaints.length === 0" class="text-center py-20">
          <component :is="Inbox" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">暂无数据</p>
        </div>
      </div>

      <div class="p-4 border-t border-gray-100 flex items-center justify-between">
        <p class="text-sm text-gray-500">共 {{ total }} 条记录</p>
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <transition name="slide">
      <ComplaintDetail
        v-if="showDetail"
        :complaint-id="selectedComplaintId"
        @close="showDetail = false"
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  ChevronDown,
  Clock,
  Tag,
  FileText,
  CheckCircle,
  Inbox,
  AlertCircle,
  Clock4,
  DollarSign,
  CheckCircle2,
} from 'lucide-vue-next';
import { Loading } from 'element-plus';
import { useComplaintStore } from '../stores/complaint';
import { useAuthStore } from '../stores/auth';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import ComplaintDetail from '../components/ComplaintDetail.vue';

const complaintStore = useComplaintStore();
const authStore = useAuthStore();

const searchKeyword = ref('');
const filterStatus = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const showDetail = ref(false);
const selectedComplaintId = ref('');

const loading = computed(() => complaintStore.loading);
const complaints = computed(() => complaintStore.complaints);
const total = computed(() => complaintStore.total);
const selectedIds = computed(() => complaintStore.selectedIds);
const statistics = computed(() => complaintStore.statistics);

const statsCards = computed(() => [
  {
    label: '总客诉',
    value: statistics.value?.total || 0,
    icon: AlertCircle,
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
  {
    label: '待处理',
    value: statistics.value?.byStatus?.pending || 0,
    icon: Clock4,
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    label: '待回款',
    value: statistics.value?.byStatus?.payment_pending || 0,
    icon: DollarSign,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    label: '已完成',
    value: statistics.value?.byStatus?.completed || 0,
    icon: CheckCircle2,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
]);

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchData() {
  await Promise.all([
    complaintStore.fetchComplaints({
      status: filterStatus.value,
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
    }),
    complaintStore.fetchStatistics(),
  ]);
}

function handleSearch() {
  currentPage.value = 1;
  fetchData();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  fetchData();
}

function openDetail(complaint: any) {
  selectedComplaintId.value = complaint.id;
  showDetail.value = true;
}

async function handleBatchAction(action: string) {
  try {
    await ElMessageBox.confirm(
      `确定对选中的 ${selectedIds.value.length} 条记录执行此操作吗？`,
      '确认操作',
      { type: 'warning' }
    );
    const result = await complaintStore.batchAction(action);
    ElMessage.success(`操作成功：${result?.success || 0} 条`);
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
