<template>
  <div class="bg-white rounded-xl shadow-sm">
    <div class="p-4 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-800">历史记录</h3>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索客户名或单号"
          class="w-64"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <component :is="Search" class="w-4 h-4 text-gray-400" />
          </template>
        </el-input>
      </div>
    </div>

    <div class="p-4">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <el-icon class="is-loading text-3xl text-primary-500">
          <Loading />
        </el-icon>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="complaint in complaints"
          :key="complaint.id"
          class="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer"
          @click="openDetail(complaint)"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h4 class="font-semibold text-gray-800">{{ complaint.customerName }}</h4>
              <p class="text-sm text-gray-500">{{ complaint.complaintType }} · {{ complaint.weightNoteNo || '无单号' }}</p>
            </div>
            <span :class="['px-3 py-1 rounded-full text-xs font-medium', STATUS_COLORS[complaint.status]]">
              {{ STATUS_LABELS[complaint.status] }}
            </span>
          </div>

          <div v-if="complaint.statusLogs && complaint.statusLogs.length > 0" class="relative pl-6 mt-4">
            <div class="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div
              v-for="(log, index) in complaint.statusLogs.slice(0, 3)"
              :key="log.id"
              class="relative pb-3 last:pb-0"
            >
              <div :class="['absolute left-[-20px] w-4 h-4 rounded-full border-2 border-white', index === 0 ? 'bg-primary-500' : 'bg-gray-300']"></div>
              <div class="text-sm">
                <span :class="['px-2 py-0.5 rounded text-xs', STATUS_COLORS[log.toStatus as keyof typeof STATUS_COLORS]]">
                  {{ STATUS_LABELS[log.toStatus as keyof typeof STATUS_LABELS] }}
                </span>
                <span class="text-gray-500 ml-2">{{ log.operator?.name || '系统' }}</span>
                <span class="text-gray-400 text-xs ml-2">{{ formatDate(log.createdAt) }}</span>
              </div>
              <p v-if="log.remark" class="text-xs text-gray-600 mt-1">{{ log.remark }}</p>
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Loading } from 'element-plus';
import { Search, Inbox } from 'lucide-vue-next';
import { complaintApi } from '../api';
import { STATUS_LABELS, STATUS_COLORS, type Complaint } from '../types';
import ComplaintDetail from '../components/ComplaintDetail.vue';

const loading = ref(false);
const complaints = ref<Complaint[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const showDetail = ref(false);
const selectedComplaintId = ref('');

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
  loading.value = true;
  try {
    const result = await complaintApi.getAll({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
    });
    complaints.value = result.list;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  fetchData();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  fetchData();
}

function openDetail(complaint: Complaint) {
  selectedComplaintId.value = complaint.id;
  showDetail.value = true;
}

onMounted(() => {
  fetchData();
});
</script>
