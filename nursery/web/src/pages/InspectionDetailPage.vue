<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
  ElButton,
  ElDivider,
  ElMessage,
} from "element-plus";
import dayjs from "dayjs";
import { api } from "@/api";
import type { Inspection } from "@/types";
import { inspectionStatusOptions, getLabel, getColor } from "@/utils/constants";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const inspection = ref<Inspection | null>(null);

const loadDetail = async () => {
  loading.value = true;
  try {
    inspection.value = await api.inspections.get(Number(route.params.id));
  } finally {
    loading.value = false;
  }
};

const handleViewDisease = () => {
  if (inspection.value?.disease) {
    router.push(`/diseases/${inspection.value.disease.id}`);
  } else {
    ElMessage.info("该巡查无关联病害");
  }
};

const handleViewPlot = () => {
  router.push(`/plots`);
};

const handleReportDisease = () => {
  if (!inspection.value) return;
  router.push({
    path: "/diseases/new",
    query: {
      inspectionId: String(inspection.value.id),
      plotId: String(inspection.value.plotId),
      inspectorId: String(inspection.value.inspectorId),
    },
  });
};

onMounted(loadDetail);
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div v-if="inspection">
      <el-card class="detail-card">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <div style="display: flex; align-items: center">
            <h3 style="margin: 0; font-size: 20px">
              巡查记录 #{{ inspection.id }}
            </h3>
            <el-tag
              :color="getColor(inspectionStatusOptions, inspection.status)"
              style="margin-left: 12px"
            >
              {{ getLabel(inspectionStatusOptions, inspection.status) }}
            </el-tag>
            <el-tag
              v-if="inspection.hasDisease"
              type="danger"
              style="margin-left: 8px"
            >
              发现病害
            </el-tag>
          </div>
          <div>
            <el-button @click="handleViewPlot">查看地块</el-button>
            <el-button
              v-if="inspection.hasDisease && inspection.disease"
              type="danger"
              @click="handleViewDisease"
            >
              查看病害
            </el-button>
            <el-button
              v-else-if="inspection.status === 'completed'"
              type="warning"
              @click="handleReportDisease"
            >
              上报病害
            </el-button>
            <el-button @click="router.back()">返回</el-button>
          </div>
        </div>

        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="地块">
            {{ inspection.plot?.name || "-" }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="品种规格">
            {{ inspection.plot?.variety }} /
            {{ inspection.plot?.specification }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="养护员">
            {{ inspection.inspector?.name || "-" }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="巡查日期">
            {{ inspection.inspectionDate }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="生长状态">
            <el-tag v-if="inspection.growthStatus === '良好'" type="success"
              >良好</el-tag
            >
            <el-tag
              v-else-if="inspection.growthStatus === '一般'"
              type="warning"
              >一般</el-tag
            >
            <el-tag v-else type="danger">较差</el-tag>
            {{ inspection.growthStatus }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="土壤状况">
            {{ inspection.soilCondition }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="水分状况">
            {{ inspection.moistureCondition }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="苗木数量">
            {{ inspection.plot?.quantity || "-" }} 株
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElDivider />

        <div>
          <div class="section-title">巡查备注</div>
          <div
            style="
              background: #f5f7fa;
              padding: 16px;
              border-radius: 4px;
              color: #606266;
            "
          >
            {{ inspection.remark || "无" }}
          </div>
        </div>

        <ElDivider />

        <div class="detail-label">记录时间</div>
        <div class="detail-value">
          创建：{{ dayjs(inspection.createdAt).format("YYYY-MM-DD HH:mm") }}
          <span style="margin-left: 24px"
            >更新：{{
              dayjs(inspection.updatedAt).format("YYYY-MM-DD HH:mm")
            }}</span
          >
        </div>
      </el-card>

      <el-card
        v-if="inspection.hasDisease && inspection.disease"
        class="detail-card"
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <h4 style="margin: 0">🔗 关联病害</h4>
          <el-button type="primary" size="small" @click="handleViewDisease"
            >查看详情</el-button
          >
        </div>
        <ElDescriptions :column="3" border size="small">
          <ElDescriptionsItem label="病害类型">{{
            inspection.disease.type
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="严重程度">
            <el-tag type="danger">{{ inspection.disease.severity }}</el-tag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前状态">
            <el-tag>{{ inspection.disease.status }}</el-tag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="影响数量" :span="3">
            {{ inspection.disease.affectedQuantity }} 株
          </ElDescriptionsItem>
        </ElDescriptions>
      </el-card>
    </div>
  </div>
</template>
