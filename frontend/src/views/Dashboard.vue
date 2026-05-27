<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { stationApi } from '@/api';
import type { DashboardStats, Station } from '@/types';

interface Props {
  userRole?: string;
}

const props = defineProps<Props>();

const stats = ref<DashboardStats>({
  totalStations: 0,
  abnormalStations: 0,
  activePackages: 0,
  pendingRefunds: 0,
  openTasks: 0,
});

const stations = ref<Station[]>([]);
const loading = ref(true);

const statCards = [
  { key: 'totalStations', label: '站点总数', icon: '🏪', color: 'primary' },
  { key: 'abnormalStations', label: '异常站点', icon: '⚠️', color: 'danger' },
  { key: 'pendingRefunds', label: '待处理退款', icon: '🔄', color: 'warning' },
  { key: 'openTasks', label: '待办任务', icon: '📋', color: 'info' },
];

onMounted(async () => {
  try {
    const [statsRes, stationsRes] = await Promise.all([
      stationApi.getDashboard(),
      stationApi.getOverview(),
    ]);
    stats.value = statsRes.data;
    stations.value = stationsRes.data;
  } finally {
    loading.value = false;
  }
});

const getWarningLevelColor = (level: number) => {
  if (level >= 4) return 'danger';
  if (level >= 2) return 'warning';
  return 'success';
};
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center h-64">
    <div class="text-gray-500">加载中...</div>
  </div>

  <div v-else class="space-y-6">
    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="card in statCards"
        :key="card.key"
        class="card"
      >
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-500">{{ card.label }}</div>
              <div class="text-2xl font-semibold mt-1">{{ stats[card.key as keyof DashboardStats] }}</div>
            </div>
            <span class="text-3xl">{{ card.icon }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header flex items-center justify-between">
        <span>站点状态概览</span>
        <span class="text-sm text-gray-500">点击站点可查看详情</span>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-3 gap-4">
          <div
            v-for="station in stations"
            :key="station.id"
            class="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer"
          >
            <div class="flex items-start justify-between">
              <div>
                <div class="font-medium">{{ station.name }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ station.address }}</div>
              </div>
              <span
                class="badge"
                :class="'badge-' + getWarningLevelColor(station.warningLevel)"
              >
                {{ station.status }}
              </span>
            </div>
            <div v-if="station.lowSupplies && station.lowSupplies.length > 0" class="mt-3">
              <div class="text-xs text-gray-500 mb-1">耗材预警：</div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="supply in station.lowSupplies"
                  :key="supply.id"
                  class="badge badge-warning"
                >
                  {{ supply.supplyType }}: {{ supply.currentQty }}
                </span>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-2">
              <span class="text-xs text-gray-500">预警等级：</span>
              <div class="flex gap-1">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="w-2 h-2 rounded-full"
                  :class="i <= station.warningLevel ? 'bg-orange-500' : 'bg-gray-200'"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">快捷操作</div>
      <div class="card-body">
        <div class="flex gap-4">
          <button class="btn btn-primary" onclick="location.hash = '#/workflow'">
            处理退款申诉
          </button>
          <button class="btn btn-success" onclick="location.hash = '#/batch-review'">
            批量复核
          </button>
          <button class="btn btn-warning" onclick="location.hash = '#/tasks'">
            查看任务
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
