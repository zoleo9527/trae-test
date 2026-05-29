<template>
  <div class="film-rolls-page">
    <div class="page-header">
      <h1 class="page-title">胶卷管理</h1>
    </div>

    <div class="filter-bar">
      <select v-model="filters.status" class="filter-select">
        <option value="">全部状态</option>
        <option value="registered">已登记</option>
        <option value="developing">冲洗中</option>
        <option value="scanning">扫描中</option>
        <option value="completed">已完成</option>
        <option value="problem">问题胶卷</option>
      </select>

      <label class="checkbox-label">
        <input type="checkbox" v-model="filters.mixedOnly" />
        只看混号胶卷
      </label>

      <input
        v-model="filters.search"
        type="text"
        placeholder="搜索胶卷号、客户名、电话..."
        class="search-input"
      />
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>胶卷号</th>
            <th>客户</th>
            <th>胶卷信息</th>
            <th>状态</th>
            <th>混号</th>
            <th>登记时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="roll in filteredFilmRolls" :key="roll.id">
            <td class="roll-number">{{ roll.rollNumber }}</td>
            <td>
              <div class="customer-name">{{ roll.customerName }}</div>
              <div class="customer-phone">{{ roll.customerPhone }}</div>
            </td>
            <td>
              {{ roll.filmBrand }} {{ roll.iso }} / {{ roll.exposures }}张
            </td>
            <td>
              <span class="status-tag" :class="roll.status">
                {{ getStatusLabel(roll.status) }}
              </span>
            </td>
            <td>
              <span v-if="roll.isMixed" class="mixed-tag">
                ⚠️ 混号
              </span>
              <span v-else>-</span>
            </td>
            <td class="date">{{ formatDate(roll.registeredAt) }}</td>
            <td>
              <button class="link-btn" @click="viewWorkOrders(roll)">
                查看关联工单
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredFilmRolls.length === 0" class="empty-state">
        暂无数据
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFilmRollsStore } from '@/stores/filmRolls';
import dayjs from 'dayjs';

const router = useRouter();
const filmRollsStore = useFilmRollsStore();

const filters = ref({
  status: '',
  mixedOnly: false,
  search: '',
});

const filteredFilmRolls = computed(() => {
  let list = filmRollsStore.filmRolls;

  if (filters.value.status) {
    list = list.filter((item) => item.status === filters.value.status);
  }

  if (filters.value.mixedOnly) {
    list = list.filter((item) => item.isMixed);
  }

  if (filters.value.search) {
    const kw = filters.value.search.toLowerCase();
    list = list.filter(
      (item) =>
        item.rollNumber.toLowerCase().includes(kw) ||
        item.customerName.toLowerCase().includes(kw) ||
        item.customerPhone.includes(kw),
    );
  }

  return list;
});

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    registered: '已登记',
    developing: '冲洗中',
    scanning: '扫描中',
    completed: '已完成',
    problem: '问题',
  };
  return labels[status] || status;
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

function viewWorkOrders(roll: any) {
  router.push(`/search?filmRollId=${roll.id}`);
}

onMounted(() => {
  filmRollsStore.fetchFilmRolls();
});
</script>

<style scoped>
.film-rolls-page {
  padding: 24px 32px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 24px;
}

.filter-bar {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d2d2d7;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
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

.table-container {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background: #f5f5f7;
  font-weight: 600;
  font-size: 13px;
  color: #86868b;
}

.roll-number {
  font-weight: 600;
  color: #007aff;
}

.customer-name {
  font-weight: 500;
}

.customer-phone {
  font-size: 12px;
  color: #86868b;
  margin-top: 2px;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.problem {
  background: #fff1f0;
  color: #ff3b30;
}

.status-tag.completed {
  background: #f0fff4;
  color: #34c759;
}

.status-tag.developing,
.status-tag.scanning {
  background: #e8f0fe;
  color: #007aff;
}

.status-tag.registered {
  background: #fff5e6;
  color: #ff9500;
}

.mixed-tag {
  color: #ff9500;
  font-size: 13px;
  font-weight: 500;
}

.date {
  font-size: 13px;
  color: #86868b;
}

.link-btn {
  background: none;
  color: #007aff;
  font-size: 13px;
  padding: 4px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #86868b;
}
</style>
