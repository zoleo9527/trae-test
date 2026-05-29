<template>
  <div class="review-board">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">批量复核面板</h1>
        <p class="page-subtitle">集中处理退款协商与赔付复核工单</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="stat in statCards" :key="stat.key" :style="{ '--color': stat.color }">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>

        <select v-model="filters.problemType" class="filter-select">
          <option value="">全部问题</option>
          <option v-for="(label, key) in PROBLEM_TYPE_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>

        <label class="checkbox-label" v-if="authStore.userRole !== 'owner'">
          <input type="checkbox" v-model="filters.myOnly" />
          只看我的
        </label>

        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索工单号、客户、胶卷号..."
          class="search-input"
        />
      </div>

      <div class="batch-actions" v-if="selectedIds.length > 0">
        <span class="selected-count">已选 {{ selectedIds.length }} 项</span>
        <button v-if="canBatchNegotiate" @click="batchUpdateStatus('negotiating')" class="btn-secondary">
          转入协商
        </button>
        <button v-if="canBatchReview" @click="batchUpdateStatus('reviewing')" class="btn-secondary">
          提交复核
        </button>
        <button v-if="canBatchApprove" @click="batchUpdateStatus('approved')" class="btn-primary">
          批量批准
        </button>
        <button v-if="canBatchComplete" @click="batchUpdateStatus('completed')" class="btn-secondary">
          标记完成
        </button>
        <button @click="clearSelection" class="btn-text">取消</button>
      </div>
    </div>

    <div class="kanban-board">
      <div
        class="kanban-column"
        v-for="column in visibleColumns"
        :key="column.status"
      >
        <div class="column-header">
          <span class="column-dot" :style="{ background: STATUS_COLORS[column.status] }"></span>
          <span class="column-title">{{ column.label }}</span>
          <span class="column-count">{{ getColumnWorkOrders(column.status).length }}</span>
        </div>

        <div class="column-content">
          <div
            v-for="wo in getColumnWorkOrders(column.status)"
            :key="wo.id"
            class="work-order-card"
            :class="{ selected: selectedIds.includes(wo.id) }"
            @click="toggleSelect(wo.id)"
          >
            <div class="card-header">
              <span class="order-number">{{ wo.orderNumber }}</span>
              <span
                class="problem-tag"
                :class="wo.problemType"
                v-if="wo.problemType"
              >
                {{ PROBLEM_TYPE_LABELS[wo.problemType] }}
              </span>
            </div>

            <h3 class="card-title" @click.stop="goToDetail(wo.id)">{{ wo.title }}</h3>

            <div class="card-meta" v-if="wo.filmRoll">
              <span class="meta-item">🎞️ {{ wo.filmRoll.rollNumber }}</span>
              <span class="meta-item">👤 {{ wo.filmRoll.customerName }}</span>
              <span class="meta-item warning" v-if="wo.filmRoll.isMixed">⚠️ 混号</span>
              <span class="meta-item warning" v-if="wo.problemType === 'wrong_version'">⚠️ 错版</span>
            </div>

            <div class="card-footer">
              <span class="assignee" v-if="wo.assignee">
                {{ wo.assignee.avatar }} {{ wo.assignee.name }}
              </span>
              <span class="date">{{ formatDate(wo.createdAt) }}</span>
            </div>
          </div>

          <div v-if="getColumnWorkOrders(column.status).length === 0" class="empty-column">
            暂无工单
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWorkOrdersStore } from '@/stores/workOrders';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PROBLEM_TYPE_LABELS,
} from '@/utils/constants';
import dayjs from 'dayjs';

const router = useRouter();
const authStore = useAuthStore();
const workOrdersStore = useWorkOrdersStore();

const filters = ref({
  status: '',
  problemType: '',
  myOnly: false,
  search: '',
});

const selectedIds = ref<string[]>([]);

const allColumns = [
  { status: 'pending', label: '待处理', roles: ['owner', 'printer', 'customer_service'] },
  { status: 'negotiating', label: '协商中', roles: ['owner', 'printer', 'customer_service'] },
  { status: 'reviewing', label: '复核中', roles: ['owner'] },
  { status: 'approved', label: '已批准', roles: ['owner', 'customer_service'] },
  { status: 'completed', label: '已完成', roles: ['owner'] },
  { status: 'closed', label: '已关闭', roles: ['owner'] },
];

const visibleColumns = computed(() => {
  const role = authStore.userRole;
  if (!role) return [];
  return allColumns.filter((col) => col.roles.includes(role));
});

const statCards = computed(() => {
  const stats = workOrdersStore.stats || {};
  const byStatus = stats.byStatus || {};
  const byProblem = stats.byProblemType || {};
  return [
    { key: 'pending', label: '待处理', value: byStatus.pending || 0, color: '#ff9500', icon: '📋' },
    { key: 'negotiating', label: '协商中', value: byStatus.negotiating || 0, color: '#5856d6', icon: '💬' },
    { key: 'reviewing', label: '复核中', value: byStatus.reviewing || 0, color: '#007aff', icon: '🔍' },
    { key: 'mixed', label: '胶卷混号', value: byProblem.mixedRoll || 0, color: '#ff3b30', icon: '🔄' },
    { key: 'version', label: '版本错发', value: byProblem.wrongVersion || 0, color: '#ff9500', icon: '⚠️' },
    { key: 'completed', label: '已完成', value: byStatus.completed || 0, color: '#34c759', icon: '✅' },
  ];
});

function getColumnWorkOrders(status: string) {
  return workOrdersStore.workOrders.filter((wo) => wo.status === status);
}

const canBatchNegotiate = computed(() => {
  return (
    authStore.userRole === 'customer_service' &&
    selectedIds.value.some((id) => {
      const wo = workOrdersStore.workOrders.find((w) => w.id === id);
      return wo?.status === 'pending';
    })
  );
});

const canBatchReview = computed(() => {
  return (
    authStore.userRole === 'customer_service' &&
    selectedIds.value.some((id) => {
      const wo = workOrdersStore.workOrders.find((w) => w.id === id);
      return wo?.status === 'negotiating';
    })
  );
});

const canBatchApprove = computed(() => {
  return (
    authStore.userRole === 'owner' &&
    selectedIds.value.some((id) => {
      const wo = workOrdersStore.workOrders.find((w) => w.id === id);
      return wo?.status === 'reviewing';
    })
  );
});

const canBatchComplete = computed(() => {
  return (
    (authStore.userRole === 'owner' || authStore.userRole === 'customer_service') &&
    selectedIds.value.some((id) => {
      const wo = workOrdersStore.workOrders.find((w) => w.id === id);
      return wo?.status === 'approved';
    })
  );
});

function toggleSelect(id: string) {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function clearSelection() {
  selectedIds.value = [];
}

async function batchUpdateStatus(status: string) {
  try {
    await workOrdersStore.batchUpdate({
      ids: selectedIds.value,
      status,
    });
    await loadData();
    clearSelection();
  } catch (e) {
    console.error('批量操作失败', e);
  }
}

function goToDetail(id: string) {
  router.push(`/work-order/${id}`);
}

function formatDate(date: string) {
  return dayjs(date).format('MM-DD HH:mm');
}

async function loadData() {
  await workOrdersStore.fetchStats();
  await workOrdersStore.fetchWorkOrders({
    ...filters.value,
    myOnly: filters.value.myOnly ? 'true' : undefined,
  });
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.review-board {
  padding: 24px 32px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #86868b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 4px solid var(--color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #86868b;
  margin-top: 4px;
}

.filter-bar {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.search-input {
  padding: 8px 14px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  font-size: 14px;
  width: 280px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-count {
  font-size: 14px;
  color: #007aff;
  font-weight: 500;
}

.btn-primary,
.btn-secondary,
.btn-text {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #007aff;
  color: #fff;
}

.btn-primary:hover {
  background: #0056cc;
}

.btn-secondary {
  background: #f5f5f7;
  color: #1d1d1f;
}

.btn-secondary:hover {
  background: #e5e5ea;
}

.btn-text {
  background: transparent;
  color: #86868b;
}

.btn-text:hover {
  color: #1d1d1f;
}

.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
}

.kanban-column {
  min-width: 300px;
  flex: 1;
  background: #f5f5f7;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.column-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e5e5ea;
}

.column-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.column-title {
  font-weight: 600;
  font-size: 14px;
  flex: 1;
}

.column-count {
  font-size: 12px;
  color: #86868b;
  background: #e5e5ea;
  padding: 2px 8px;
  border-radius: 10px;
}

.column-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 400px;
}

.work-order-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.work-order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.work-order-card.selected {
  border-color: #007aff;
  background: #f0f7ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-number {
  font-size: 12px;
  color: #86868b;
  font-weight: 500;
}

.problem-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.problem-tag.mixed_roll {
  background: #fff1f0;
  color: #ff3b30;
}

.problem-tag.wrong_version {
  background: #fff5e6;
  color: #ff9500;
}

.problem-tag.quality_issue {
  background: #fff5e6;
  color: #ff9500;
}

.problem-tag.delay {
  background: #fff1f0;
  color: #ff3b30;
}

.problem-tag.other {
  background: #f5f5f7;
  color: #86868b;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 10px;
  line-height: 1.4;
}

.card-title:hover {
  color: #007aff;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.meta-item {
  font-size: 12px;
  color: #86868b;
}

.meta-item.warning {
  color: #ff9500;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.assignee {
  font-size: 12px;
  color: #1d1d1f;
  font-weight: 500;
}

.date {
  font-size: 12px;
  color: #c7c7cc;
}

.empty-column {
  text-align: center;
  padding: 40px 20px;
  color: #c7c7cc;
  font-size: 13px;
}
</style>
