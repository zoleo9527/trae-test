<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
  ElButton,
  ElDivider,
  ElDialog,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElInput,
  ElMessage,
} from "element-plus";
import dayjs from "dayjs";
import { api } from "@/api";
import type { Disease, User } from "@/types";
import {
  diseaseStatusOptions,
  diseaseSeverityOptions,
  negotiationStatusOptions,
  getLabel,
  getColor,
} from "@/utils/constants";
import { DiseaseStatus } from "@/types";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const disease = ref<Disease | null>(null);
const users = ref<User[]>([]);
const statusDialogVisible = ref(false);
const statusForm = ref({
  status: "",
  operatorId: 1,
  remark: "",
});

const loadDetail = async () => {
  loading.value = true;
  try {
    [disease.value, users.value] = await Promise.all([
      api.diseases.get(Number(route.params.id)),
      api.users.list(),
    ]);
  } finally {
    loading.value = false;
  }
};

const getUserName = (id: number) => {
  return users.value.find((u) => u.id === id)?.name || "-";
};

const availableStatuses = computed(() => {
  if (!disease.value) return [];
  const flowMap: Record<string, string[]> = {
    [DiseaseStatus.REPORTED]: [DiseaseStatus.CONFIRMED, DiseaseStatus.RESOLVED],
    [DiseaseStatus.CONFIRMED]: [DiseaseStatus.TREATING, DiseaseStatus.RESOLVED],
    [DiseaseStatus.TREATING]: [DiseaseStatus.RESOLVED],
    [DiseaseStatus.RESOLVED]: [],
  };
  return flowMap[disease.value.status] || [];
});

const openStatusDialog = () => {
  statusForm.value.status = availableStatuses.value[0] || "";
  statusForm.value.remark = "";
  statusDialogVisible.value = true;
};

const handleUpdateStatus = async () => {
  if (!disease.value || !statusForm.value.status) return;

  try {
    await api.diseases.updateStatus(disease.value.id, {
      status: statusForm.value.status,
      operatorId: statusForm.value.operatorId,
      remark: statusForm.value.remark,
    });
    ElMessage.success("状态更新成功");
    statusDialogVisible.value = false;
    loadDetail();
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || "操作失败");
  }
};

const handleStartNegotiation = () => {
  if (!disease.value) return;
  router.push({
    path: "/negotiations/new",
    query: { diseaseId: String(disease.value.id) },
  });
};

const handleViewNegotiation = (id: number) => {
  router.push(`/negotiations/${id}`);
};

const getDaysOverdue = (reportedAt: string) => {
  const days = dayjs().diff(dayjs(reportedAt), "day");
  return days;
};

const timelineActions = [
  { action: "上报病害", status: "reported" },
  { action: "确认病害", status: "confirmed" },
  { action: "开始处理", status: "treating" },
  { action: "处理完成", status: "resolved" },
];

onMounted(loadDetail);
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div v-if="disease">
      <el-card class="detail-card">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <div
            style="
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 8px;
            "
          >
            <h3 style="margin: 0; font-size: 20px">
              {{ disease.plot?.name }} - {{ disease.type }}
            </h3>
            <el-tag :color="getColor(diseaseSeverityOptions, disease.severity)">
              {{ getLabel(diseaseSeverityOptions, disease.severity) }}
            </el-tag>
            <el-tag :color="getColor(diseaseStatusOptions, disease.status)">
              {{ getLabel(diseaseStatusOptions, disease.status) }}
            </el-tag>
            <el-tag v-if="disease.isOverdue" type="danger" effect="dark">
              ⚠️ 已逾期 {{ getDaysOverdue(disease.reportedAt) }} 天
            </el-tag>
          </div>
          <div>
            <el-button
              v-if="availableStatuses.length > 0"
              type="primary"
              @click="openStatusDialog"
            >
              更新状态
            </el-button>
            <el-button
              v-if="
                disease.status !== 'resolved' && !disease.negotiations?.length
              "
              type="warning"
              @click="handleStartNegotiation"
            >
              启动协商
            </el-button>
            <el-button @click="router.back()">返回</el-button>
          </div>
        </div>

        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="地块">
            {{ disease.plot?.name || "-" }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="品种规格">
            {{ disease.plot?.variety }} / {{ disease.plot?.specification }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="上报人">
            {{ disease.reporter?.name || "-" }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="影响数量">
            {{ disease.affectedQuantity || "-" }} 株
          </ElDescriptionsItem>
          <ElDescriptionsItem label="上报时间">
            {{ dayjs(disease.reportedAt).format("YYYY-MM-DD HH:mm") }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="确认时间">
            {{
              disease.confirmedAt
                ? dayjs(disease.confirmedAt).format("YYYY-MM-DD HH:mm")
                : "-"
            }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="解决时间">
            {{
              disease.resolvedAt
                ? dayjs(disease.resolvedAt).format("YYYY-MM-DD HH:mm")
                : "-"
            }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="关联巡查">
            <template v-if="disease.inspectionId">
              <el-button
                type="text"
                @click="router.push(`/inspections/${disease.inspectionId}`)"
              >
                #{{ disease.inspectionId }} 查看
              </el-button>
            </template>
            <template v-else>
              <span style="color: #909399">独立上报，无关联巡查</span>
            </template>
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElDivider />

        <div>
          <div class="section-title">病害描述</div>
          <div
            style="
              background: #f5f7fa;
              padding: 16px;
              border-radius: 4px;
              color: #606266;
            "
          >
            {{ disease.description || "无" }}
          </div>
        </div>
      </el-card>

      <el-card v-if="disease.negotiations?.length" class="detail-card">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <h4 style="margin: 0">🔗 关联协商记录</h4>
        </div>
        <div
          v-for="neg in disease.negotiations"
          :key="neg.id"
          style="
            border: 1px solid #e4e7ed;
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 12px;
            cursor: pointer;
          "
          @click="handleViewNegotiation(neg.id)"
        >
          <div
            style="
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            "
          >
            <span style="font-weight: 600">协商 #{{ neg.id }}</span>
            <el-tag :color="getColor(negotiationStatusOptions, neg.status)">
              {{ getLabel(negotiationStatusOptions, neg.status) }}
            </el-tag>
          </div>
          <div style="color: #909399; font-size: 13px">
            发起人：{{ getUserName(neg.initiatorId) }} ·
            {{ neg.replantQuantity ? `补植${neg.replantQuantity}株` : "" }}
            {{ neg.replantDate ? ` · 日期：${neg.replantDate}` : "" }}
          </div>
        </div>
      </el-card>

      <el-card class="detail-card">
        <div class="section-title">处理进度时间线</div>
        <div v-if="disease.timelines?.length">
          <div
            v-for="(timeline, idx) in disease.timelines"
            :key="timeline.id"
            class="timeline-item"
          >
            <div class="timeline-action">
              {{ timeline.action }}
              <span
                style="
                  font-weight: normal;
                  color: #909399;
                  font-size: 13px;
                  margin-left: 8px;
                "
              >
                {{ getUserName(timeline.operatorId) }}
              </span>
            </div>
            <div class="timeline-content">{{ timeline.content }}</div>
            <div class="timeline-meta">
              {{ dayjs(timeline.operatedAt).format("YYYY-MM-DD HH:mm") }}
            </div>
          </div>
        </div>
        <div v-else style="color: #c0c4cc; text-align: center; padding: 20px">
          暂无操作记录
        </div>
      </el-card>
    </div>

    <el-dialog v-model="statusDialogVisible" title="更新病害状态" width="500px">
      <el-form :model="statusForm" label-width="80px">
        <el-form-item label="新状态">
          <el-select v-model="statusForm.status" style="width: 100%">
            <el-option
              v-for="status in availableStatuses"
              :key="status"
              :label="getLabel(diseaseStatusOptions, status)"
              :value="status"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-select v-model="statusForm.operatorId" style="width: 100%">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input
            v-model="statusForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入处理说明（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateStatus">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
