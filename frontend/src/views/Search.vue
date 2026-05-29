<template>
  <div class="search-page">
    <div class="page-header">
      <h1 class="page-title">综合查询 <span v-if="searchScopeHint" class="scope-hint">{{ searchScopeHint }}</span></h1>
    </div>

    <div class="search-bar">
      <input
        v-model="keyword"
        type="text"
        placeholder="搜索工单号、胶卷号、客户名..."
        class="search-input-large"
        @keyup.enter="doSearch"
      />
      <button @click="doSearch" class="btn-primary">搜索</button>
    </div>

    <div class="results-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'workOrders' }"
        @click="activeTab = 'workOrders'"
      >
        工单 ({{ workOrdersResults.length }})
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'filmRolls' }"
        @click="activeTab = 'filmRolls'"
      >
        胶卷 ({{ filmRollsResults.length }})
      </button>
    </div>

    <div class="results-content">
      <div v-if="activeTab === 'workOrders'">
        <div
          v-for="wo in workOrdersResults"
          :key="wo.id"
          class="result-card"
          @click="goToWorkOrder(wo.id)"
        >
          <div class="card-header">
            <span class="order-number">{{ wo.orderNumber }}</span>
            <span class="status-tag" :style="{ background: STATUS_COLORS[wo.status] }">
              {{ STATUS_LABELS[wo.status] }}
            </span>
          </div>
          <h3 class="card-title">{{ wo.title }}</h3>
          <div class="card-meta">
            <span v-if="wo.filmRoll">🎞️ {{ wo.filmRoll.rollNumber }}</span>
            <span v-if="wo.filmRoll">👤 {{ wo.filmRoll.customerName }}</span>
          </div>
        </div>
        <div v-if="workOrdersResults.length === 0" class="empty-state">
          暂无匹配的工单
        </div>
      </div>

      <div v-if="activeTab === 'filmRolls'">
        <div
          v-for="roll in filmRollsResults"
          :key="roll.id"
          class="result-card"
        >
          <div class="card-header">
            <span class="order-number">{{ roll.rollNumber }}</span>
            <span class="status-tag small" v-if="roll.isMixed">⚠️ 混号</span>
          </div>
          <h3 class="card-title">{{ roll.customerName }}</h3>
          <div class="card-meta">
            <span>{{ roll.filmBrand }} {{ roll.iso }}</span>
            <span>{{ roll.exposures }}张</span>
          </div>
        </div>
        <div v-if="filmRollsResults.length === 0" class="empty-state">
          暂无匹配的胶卷
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWorkOrdersStore } from '@/stores/workOrders';
import { useFilmRollsStore } from '@/stores/filmRolls';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const workOrdersStore = useWorkOrdersStore();
const filmRollsStore = useFilmRollsStore();

const keyword = ref('');
const activeTab = ref<'workOrders' | 'filmRolls'>('workOrders');

const workOrdersResults = computed(() => {
  if (!keyword.value) return workOrdersStore.workOrders;
  const kw = keyword.value.toLowerCase();
  return workOrdersStore.workOrders.filter(
    (wo) =>
      wo.orderNumber.toLowerCase().includes(kw) ||
      wo.title.toLowerCase().includes(kw) ||
      wo.filmRoll?.rollNumber.toLowerCase().includes(kw) ||
      wo.filmRoll?.customerName.toLowerCase().includes(kw),
  );
});

const filmRollsResults = computed(() => {
  if (!keyword.value) return filmRollsStore.filmRolls;
  const kw = keyword.value.toLowerCase();
  return filmRollsStore.filmRolls.filter(
    (roll) =>
      roll.rollNumber.toLowerCase().includes(kw) ||
      roll.customerName.toLowerCase().includes(kw) ||
      roll.customerPhone.includes(kw),
  );
});

const searchScopeHint = computed(() => {
  const role = authStore.userRole;
  if (role === 'owner') return '';
  if (role === 'customer_service') return '（仅搜索您负责的工单）';
  if (role === 'printer') return '（仅搜索冲印问题工单）';
  return '';
});

function doSearch() {
  // 搜索逻辑已在 computed 中处理
}

function goToWorkOrder(id: string) {
  router.push(`/work-order/${id}`);
}

onMounted(async () => {
  await workOrdersStore.fetchWorkOrders();
  await filmRollsStore.fetchFilmRolls();

  if (route.query.filmRollId) {
    const roll = filmRollsStore.filmRolls.find(
      (r) => r.id === route.query.filmRollId,
    );
    if (roll) {
      keyword.value = roll.rollNumber;
      activeTab.value = 'workOrders';
    }
  }
});
</script>

<style scoped>
.search-page {
  padding: 24px 32px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 24px;
}

.scope-hint {
  font-size: 14px;
  font-weight: 400;
  color: #86868b;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input-large {
  flex: 1;
  padding: 14px 18px;
  border: 1px solid #d2d2d7;
  border-radius: 10px;
  font-size: 15px;
}

.btn-primary {
  padding: 0 24px;
  background: #007aff;
  color: #fff;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
}

.results-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: #f5f5f7;
  padding: 4px;
  border-radius: 10px;
  width: fit-content;
}

.tab-btn {
  padding: 10px 20px;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  color: #86868b;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #fff;
  color: #1d1d1f;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.result-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-number {
  font-size: 13px;
  color: #007aff;
  font-weight: 500;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.small {
  background: #fff5e6;
  color: #ff9500;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 8px;
}

.card-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #86868b;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #86868b;
}
</style>
