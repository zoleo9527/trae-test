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
  ElInputNumber,
  ElDatePicker,
  ElMessage,
} from "element-plus";
import dayjs from "dayjs";
import { api } from "@/api";
import type { Negotiation, User, Disease } from "@/types";
import {
  negotiationStatusOptions,
  diseaseSeverityOptions,
  getLabel,
  getColor,
} from "@/utils/constants";
import { NegotiationStatus, UserRole } from "@/types";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const negotiation = ref<Negotiation | null>(null);
const disease = ref<Disease | null>(null);
const users = ref<User[]>([]);
const statusDialogVisible = ref(false);
const statusForm = ref({
  status: "",
  operatorId: 1,
  salesOpinion: "",
  baseOpinion: "",
  replantQuantity: null as number | null,
  replantVariety: "",
  replantDate: "",
});

const loadDetail = async () => {
  loading.value = true;
  try {
    const id = Number(route.params.id);
    [negotiation.value, users.value] = await Promise.all([
      api.negotiations.get(id),
      api.users.list(),
    ]);
    if (negotiation.value?.diseaseId) {
      disease.value = await api.diseases.get(negotiation.value.diseaseId);
    }
  } finally {
    loading.value = false;
  }
};

const getUserName = (id: number) => {
  return users.value.find((u) => u.id === id)?.name || "-";
};

const baseManagers = computed(() => {
  return users.value.filter((u) => u.role === UserRole.BASE_MANAGER);
});

const salesUsers = computed(() => {
  return users.value.filter((u) => u.role === UserRole.SALES);
});

const availableStatuses = computed(() => {
  if (!negotiation.value) return [];
  const flowMap: Record<string, string[]> = {
    [NegotiationStatus.PENDING]: [
      NegotiationStatus.IN_PROGRESS,
      NegotiationStatus.CLOSED,
    ],
    [NegotiationStatus.IN_PROGRESS]: [
      NegotiationStatus.CONFIRMED,
      NegotiationStatus.CLOSED,
    ],
    [NegotiationStatus.CONFIRMED]: [NegotiationStatus.CLOSED],
    [NegotiationStatus.CLOSED]: [],
  };
  return flowMap[negotiation.value.status] || [];
});

const openStatusDialog = () => {
  statusForm.value.status = availableStatuses.value[0] || "";
  statusForm.value.salesOpinion = negotiation.value?.salesOpinion || "";
  statusForm.value.baseOpinion = negotiation.value?.baseOpinion || "";
  statusForm.value.replantQuantity = negotiation.value?.replantQuantity || null;
  statusForm.value.replantVariety = negotiation.value?.replantVariety || "";
  statusForm.value.replantDate = negotiation.value?.replantDate || "";
  statusDialogVisible.value = true;
};

const handleUpdateStatus = async () => {
  if (!negotiation.value || !statusForm.value.status) return;

  try {
    await api.negotiations.updateStatus(negotiation.value.id, {
      status: statusForm.value.status,
      operatorId: statusForm.value.operatorId,
      salesOpinion: statusForm.value.salesOpinion,
      baseOpinion: statusForm.value.baseOpinion,
      replantQuantity: statusForm.value.replantQuantity || undefined,
      replantVariety: statusForm.value.replantVariety || undefined,
      replantDate: statusForm.value.replantDate || undefined,
    });
    ElMessage.success("状态更新成功");
    statusDialogVisible.value = false;
    loadDetail();
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || "操作失败");
  }
};

const handleViewDisease = () => {
  if (negotiation.value?.diseaseId) {
    router.push(`/diseases/${negotiation.value.diseaseId}`);
  }
};

onMounted(loadDetail);
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div v-if="negotiation">
      <el-card class="detail-card">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <div style="display: flex; align-items: center; gap: 12px">
            <h3 style="margin: 0; font-size: 20px">
              补苗协商 #{{ negotiation.id }}
            </h3>
            <el-tag
              :color="getColor(negotiationStatusOptions, negotiation.status)"
            >
              {{ getLabel(negotiationStatusOptions, negotiation.status) }}
            </el-tag>
          </div>
          <div>
            <el-button type="primary" @click="handleViewDisease"
              >查看病害</el-button
            >
            <el-button
              v-if="availableStatuses.length > 0"
              type="success"
              @click="openStatusDialog"
            >
              更新状态
            </el-button>
            <el-button @click="router.back()">返回</el-button>
          </div>
        </div>

        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="关联病害">
            <span v-if="disease">
              {{ disease.plot?.name }} - {{ disease.type }}
              <el-tag
                :color="getColor(diseaseSeverityOptions, disease.severity)"
                style="margin-left: 8px"
              >
                {{ getLabel(diseaseSeverityOptions, disease.severity) }}
              </el-tag>
            </span>
            <span v-else>-</span>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="影响数量">
            {{ disease?.affectedQuantity || "-" }} 株
          </ElDescriptionsItem>
          <ElDescriptionsItem label="发起人">
            {{ getUserName(negotiation.initiatorId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="确认人">
            {{
              negotiation.confirmedById
                ? getUserName(negotiation.confirmedById)
                : "-"
            }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="补植数量">
            {{
              negotiation.replantQuantity
                ? negotiation.replantQuantity + " 株"
                : "待定"
            }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="补植品种">
            {{ negotiation.replantVariety || "待定" }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="补植日期">
            {{ negotiation.replantDate || "待定" }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="确认时间">
            {{
              negotiation.confirmedAt
                ? dayjs(negotiation.confirmedAt).format("YYYY-MM-DD HH:mm")
                : "-"
            }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </el-card>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="detail-card">
            <div class="section-title">📊 销售意见</div>
            <div
              style="
                background: #ecf5ff;
                padding: 16px;
                border-radius: 4px;
                color: #606266;
                min-height: 100px;
              "
            >
              {{ negotiation.salesOpinion || "暂无销售意见" }}
            </div>
            <div style="margin-top: 8px; color: #909399; font-size: 12px">
              提交人：{{
                negotiation.initiator?.name ||
                getUserName(negotiation.initiatorId)
              }}（销售）
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="detail-card">
            <div class="section-title">🌱 基地意见</div>
            <div
              style="
                background: #f0f9eb;
                padding: 16px;
                border-radius: 4px;
                color: #606266;
                min-height: 100px;
              "
            >
              {{ negotiation.baseOpinion || "暂无基地意见" }}
            </div>
            <div style="margin-top: 8px; color: #909399; font-size: 12px">
              确认人：{{
                negotiation.confirmedBy?.name ||
                (negotiation.confirmedById
                  ? getUserName(negotiation.confirmedById)
                  : "待确认")
              }}（基地负责人）
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card v-if="disease?.timelines?.length" class="detail-card">
        <div class="section-title">🔄 关联处理时间线</div>
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
      </el-card>
    </div>

    <el-dialog v-model="statusDialogVisible" title="更新协商状态" width="600px">
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="新状态" required>
          <el-select v-model="statusForm.status" style="width: 100%">
            <el-option
              v-for="status in availableStatuses"
              :key="status"
              :label="getLabel(negotiationStatusOptions, status)"
              :value="status"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人" required>
          <el-select v-model="statusForm.operatorId" style="width: 100%">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-divider>补植方案</el-divider>

        <el-form-item label="销售意见">
          <el-input
            v-model="statusForm.salesOpinion"
            type="textarea"
            :rows="2"
            placeholder="请输入销售方意见"
          />
        </el-form-item>
        <el-form-item label="基地意见">
          <el-input
            v-model="statusForm.baseOpinion"
            type="textarea"
            :rows="2"
            placeholder="请输入基地方意见"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="补植数量">
              <el-input-number
                v-model="statusForm.replantQuantity"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="补植品种">
              <el-input
                v-model="statusForm.replantVariety"
                placeholder="如：桂花"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="补植日期">
              <el-date-picker
                v-model="statusForm.replantDate"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateStatus">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
