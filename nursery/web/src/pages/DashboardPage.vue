<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ElCard,
  ElRow,
  ElCol,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import dayjs from "dayjs";
import { api } from "@/api";
import type { DashboardStats } from "@/types";
import {
  getLabel,
  getColor,
  diseaseStatusOptions,
  negotiationStatusOptions,
  inspectionStatusOptions,
} from "@/utils/constants";

const router = useRouter();
const stats = ref<DashboardStats | null>(null);
const loading = ref(false);

const loadStats = async () => {
  loading.value = true;
  try {
    stats.value = await api.dashboard.getStats();
  } finally {
    loading.value = false;
  }
};

const getActivityTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    inspection: "巡查",
    disease: "病害",
    negotiation: "协商",
  };
  return map[type] || type;
};

const getActivityTypeColor = (type: string) => {
  const map: Record<string, string> = {
    inspection: "#409eff",
    disease: "#f56c6c",
    negotiation: "#e6a23c",
  };
  return map[type] || "#909399";
};

const handleActivityClick = (activity: any) => {
  const routes: Record<string, string> = {
    inspection: `/inspections/${activity.id}`,
    disease: `/diseases/${activity.id}`,
    negotiation: `/negotiations/${activity.id}`,
  };
  if (routes[activity.type]) {
    router.push(routes[activity.type]);
  }
};

const statCards = computed(() => {
  if (!stats.value) return [];
  return [
    { label: "地块总数", value: stats.value.totalPlots, class: "" },
    { label: "巡查记录", value: stats.value.totalInspections, class: "" },
    {
      label: "待处理巡查",
      value: stats.value.pendingInspections,
      class: "warning",
    },
    { label: "病害总数", value: stats.value.totalDiseases, class: "" },
    { label: "活跃病害", value: stats.value.activeDiseases, class: "warning" },
    { label: "逾期病害", value: stats.value.overdueDiseases, class: "danger" },
    { label: "协商记录", value: stats.value.totalNegotiations, class: "" },
    {
      label: "协商中",
      value: stats.value.pendingNegotiations,
      class: "warning",
    },
  ];
});

onMounted(loadStats);
</script>

<template>
  <div class="page-container">
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="6" v-for="(card, idx) in statCards" :key="idx">
        <div :class="['stat-card', card.class]">
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="detail-card">
          <div class="section-title">病害按严重程度</div>
          <el-row v-if="stats">
            <el-col
              :span="8"
              v-for="(count, severity) in stats.diseaseBySeverity"
              :key="severity"
            >
              <div style="text-align: center">
                <div style="font-size: 24px; font-weight: 600; color: #f56c6c">
                  {{ count }}
                </div>
                <div style="color: #909399; font-size: 13px">
                  {{
                    getLabel(diseaseStatusOptions, severity as string) ||
                    severity
                  }}
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="detail-card">
          <div class="section-title">病害按处理状态</div>
          <el-row v-if="stats">
            <el-col
              :span="6"
              v-for="(count, status) in stats.diseaseByStatus"
              :key="status"
            >
              <div style="text-align: center">
                <div style="font-size: 24px; font-weight: 600; color: #409eff">
                  {{ count }}
                </div>
                <div style="color: #909399; font-size: 13px">
                  {{ getLabel(diseaseStatusOptions, status as string) }}
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="detail-card" style="margin-top: 20px" v-loading="loading">
      <div class="section-title">最近动态</div>
      <el-table
        :data="stats?.recentActivities || []"
        style="width: 100%"
        @row-click="handleActivityClick"
        :row-style="{ cursor: 'pointer' }"
      >
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :color="getActivityTypeColor(row.type)" effect="plain">
              {{ getActivityTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容" prop="title" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag
              v-if="row.type === 'inspection'"
              :color="getColor(inspectionStatusOptions, row.status)"
            >
              {{ getLabel(inspectionStatusOptions, row.status) }}
            </el-tag>
            <el-tag
              v-else-if="row.type === 'disease'"
              :color="getColor(diseaseStatusOptions, row.status)"
            >
              {{ getLabel(diseaseStatusOptions, row.status) }}
            </el-tag>
            <el-tag
              v-else
              :color="getColor(negotiationStatusOptions, row.status)"
            >
              {{ getLabel(negotiationStatusOptions, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ dayjs(row.time).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
