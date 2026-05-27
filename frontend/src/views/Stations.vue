<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { stationApi, taskApi } from '@/api';
import type { Station } from '@/types';

interface Props {
  userRole?: string;
}

defineProps<Props>();

const stations = ref<Station[]>([]);
const selectedStation = ref<Station | null>(null);
const anomalies = ref<any>(null);
const loading = ref(true);
const showAnomalyModal = ref(false);
const escalateReason = ref('');

const loadStations = async () => {
  loading.value = true;
  try {
    const res = await stationApi.getOverview();
    stations.value = res.data;
  } finally {
    loading.value = false;
  }
};

const checkAnomalies = async (station: Station) => {
  selectedStation.value = station;
  const res = await stationApi.getAnomalies(station.id);
  anomalies.value = res.data;
  showAnomalyModal.value = true;
};

const escalateIssue = async () => {
  if (!selectedStation.value || !escalateReason.value) return;
  
  await stationApi.escalateIssue(selectedStation.value.id, escalateReason.value);
  showAnomalyModal.value = false;
  escalateReason.value = '';
  await loadStations();
};

const createReplenishmentTask = async (stationId: string, supplyType: string) => {
  await taskApi.createReplenishment(stationId, supplyType);
  alert('补货任务已创建');
};

onMounted(() => {
  loadStations();
});

const getWarningLevelColor = (level: number) => {
  if (level >= 4) return 'danger';
  if (level >= 2) return 'warning';
  return 'success';
};
</script>

<template>
  <div class="space-y-4">
    <div class="card">
      <div class="card-header flex items-center justify-between">
        <span>站点列表</span>
        <button class="btn btn-outline" @click="loadStations">刷新</button>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="station in stations"
            :key="station.id"
            class="p-4 border rounded-lg hover:border-primary transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="font-medium text-lg">{{ station.name }}</div>
                <div class="text-sm text-gray-500">{{ station.address }}</div>
              </div>
              <span
                class="badge"
                :class="'badge-' + getWarningLevelColor(station.warningLevel)"
              >
                {{ station.status }}
              </span>
            </div>

            <div class="flex items-center gap-2 mb-3">
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

            <div v-if="station.lowSupplies && station.lowSupplies.length > 0" class="mb-3">
              <div class="text-xs text-gray-500 mb-2">耗材预警</div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="supply in station.lowSupplies"
                  :key="supply.id"
                  class="flex items-center gap-2 px-2 py-1 bg-orange-50 rounded text-xs"
                >
                  <span>{{ supply.supplyType }}</span>
                  <span class="text-orange-600 font-medium">{{ supply.currentQty }}/{{ supply.warningQty }}</span>
                  <button 
                    class="text-primary hover:underline"
                    @click="createReplenishmentTask(station.id, supply.supplyType)"
                  >
                    补货
                  </button>
                </div>
              </div>
            </div>

            <div class="flex gap-2">
              <button 
                class="btn btn-outline text-xs flex-1"
                @click="checkAnomalies(station)"
              >
                异常检测
              </button>
              <button 
                class="btn btn-warning text-xs flex-1"
                @click="escalateReason = '人工介入'; selectedStation = station; escalateIssue()"
              >
                紧急升级
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAnomalyModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-lg max-h-[80vh] overflow-auto">
        <div class="p-4 border-b flex items-center justify-between">
          <span class="font-semibold">站点异常检测 - {{ selectedStation?.name }}</span>
          <button @click="showAnomalyModal = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div class="p-4" v-if="anomalies">
          <div class="mb-4">
            <span class="text-sm text-gray-500">整体风险评估：</span>
            <span 
              class="badge ml-2"
              :class="anomalies.overallRisk === 'high' ? 'badge-danger' : anomalies.overallRisk === 'medium' ? 'badge-warning' : 'badge-success'"
            >
              {{ anomalies.overallRisk === 'high' ? '高风险' : anomalies.overallRisk === 'medium' ? '中风险' : '低风险' }}
            </span>
          </div>

          <div v-if="anomalies.anomalies.length > 0" class="space-y-3">
            <div
              v-for="(item, idx) in anomalies.anomalies"
              :key="idx"
              class="p-3 rounded"
              :class="item.severity === 'high' ? 'bg-red-50' : 'bg-yellow-50'"
            >
              <div class="flex items-center gap-2 mb-1">
                <span 
                  class="badge"
                  :class="item.severity === 'high' ? 'badge-danger' : 'badge-warning'"
                >
                  {{ item.severity === 'high' ? '严重' : '警告' }}
                </span>
                <span class="font-medium">{{ item.message }}</span>
              </div>
              <div v-if="item.details" class="text-sm text-gray-600 mt-1">
                <div v-for="(d, i) in item.details" :key="i" class="ml-2">
                  • {{ d.issueDesc || d.supplyType }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-gray-500">
            ✓ 未检测到异常情况
          </div>

          <div v-if="anomalies.anomalies.length > 0" class="mt-6 pt-4 border-t">
            <div class="text-sm text-gray-500 mb-2">升级为紧急任务</div>
            <textarea 
              v-model="escalateReason" 
              class="textarea mb-3" 
              placeholder="请输入升级原因..."
            ></textarea>
            <button class="btn btn-danger w-full" @click="escalateIssue">
              确认升级
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
