<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElButton,
  ElMessage,
  ElInputNumber,
  ElAlert,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
} from "element-plus";
import dayjs from "dayjs";
import { api } from "@/api";
import type { Disease, User } from "@/types";
import { diseaseSeverityOptions, getLabel, getColor } from "@/utils/constants";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const diseases = ref<Disease[]>([]);
const users = ref<User[]>([]);
const selectedDisease = ref<Disease | null>(null);

const fromDisease = computed(
  () => !!route.query.diseaseId && route.query.diseaseId !== "new",
);
const prefilledDiseaseId = computed(() => {
  const id = route.query.diseaseId;
  return id && id !== "new" ? Number(id) : null;
});
const prefilledInitiatorId = computed(() =>
  route.query.initiatorId ? Number(route.query.initiatorId) : null,
);

const formRef = ref();
const form = reactive({
  diseaseId: prefilledDiseaseId.value,
  initiatorId: prefilledInitiatorId.value,
  salesOpinion: "",
  baseOpinion: "",
  replantQuantity: null as number | null,
  replantVariety: "",
  replantDate: "",
  status: "in_progress",
});

const loadOptions = async () => {
  [diseases.value, users.value] = await Promise.all([
    api.diseases.list({ status: "reported" }),
    api.users.list(),
  ]);

  if (prefilledDiseaseId.value) {
    try {
      selectedDisease.value = await api.diseases.get(prefilledDiseaseId.value);

      // 如果下拉列表中没有这个病害（刚创建的），手动添加
      if (!diseases.value.find((d) => d.id === prefilledDiseaseId.value)) {
        diseases.value.unshift(selectedDisease.value);
      }

      // 自动填入补植品种
      if (!form.replantVariety && selectedDisease.value.plot?.variety) {
        form.replantVariety = selectedDisease.value.plot.variety;
      }

      // 自动设置发起人为病害上报人
      if (!form.initiatorId && selectedDisease.value.reporterId) {
        form.initiatorId = selectedDisease.value.reporterId;
      }

      // 自动填入补植数量（建议值为影响数量）
      if (!form.replantQuantity && selectedDisease.value.affectedQuantity) {
        form.replantQuantity = selectedDisease.value.affectedQuantity;
      }
    } catch (e) {
      console.error("加载关联病害失败", e);
    }
  }
};

const handleDiseaseChange = async (id: number) => {
  if (id) {
    try {
      selectedDisease.value = await api.diseases.get(id);
    } catch (e) {
      selectedDisease.value = null;
    }
  } else {
    selectedDisease.value = null;
  }
};

const handleSubmit = async () => {
  if (!form.diseaseId || !form.initiatorId) {
    ElMessage.warning("请选择关联病害和发起人");
    return;
  }

  loading.value = true;
  try {
    const data = {
      diseaseId: form.diseaseId,
      initiatorId: form.initiatorId,
      salesOpinion: form.salesOpinion || undefined,
      baseOpinion: form.baseOpinion || undefined,
      replantQuantity: form.replantQuantity || undefined,
      replantVariety: form.replantVariety || undefined,
      replantDate: form.replantDate || undefined,
      status: form.status,
    };

    const negotiation = await api.negotiations.create(data);
    ElMessage.success("协商创建成功");
    router.push(`/negotiations/${negotiation.id}`);
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || "创建失败");
  } finally {
    loading.value = false;
  }
};

const salesUsers = computed(() =>
  users.value.filter((u) => u.role === "sales"),
);
const baseManagerUsers = computed(() =>
  users.value.filter((u) => u.role === "base_manager"),
);
const otherUsers = computed(() =>
  users.value.filter((u) => u.role === "inspector"),
);

onMounted(loadOptions);
</script>

<template>
  <div class="page-container">
    <el-card class="detail-card">
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        "
      >
        <div style="display: flex; align-items: center; gap: 12px">
          <h3 style="margin: 0; font-size: 20px">🤝 新建补苗协商</h3>
          <el-tag v-if="fromDisease" type="warning">来自病害</el-tag>
        </div>
        <div>
          <el-button @click="router.back()">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            创建协商
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="fromDisease && selectedDisease"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #title>
          关联病害：{{ selectedDisease.plot?.name }} -
          {{ selectedDisease.type }}
          <el-tag
            :color="getColor(diseaseSeverityOptions, selectedDisease.severity)"
            style="margin-left: 8px"
          >
            {{ getLabel(diseaseSeverityOptions, selectedDisease.severity) }}
          </el-tag>
        </template>
        <template #default>
          影响 {{ selectedDisease.affectedQuantity || 0 }} 株， 上报于
          {{ dayjs(selectedDisease.reportedAt).format("YYYY-MM-DD HH:mm") }}
        </template>
      </el-alert>

      <el-form
        ref="formRef"
        :model="form"
        label-width="120px"
        style="max-width: 800px"
      >
        <el-divider content-position="left">关联信息</el-divider>

        <el-form-item label="关联病害" required>
          <el-select
            v-model="form.diseaseId"
            placeholder="请选择关联的病害"
            :disabled="fromDisease && prefilledDiseaseId"
            style="width: 100%"
            @change="handleDiseaseChange"
          >
            <el-option
              v-for="d in diseases"
              :key="d.id"
              :label="`#${d.id} ${d.plot?.name} - ${d.type}（${getLabel(diseaseSeverityOptions, d.severity)}）`"
              :value="d.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="发起人" required>
          <el-select
            v-model="form.initiatorId"
            placeholder="请选择发起人（通常为销售）"
            :disabled="fromDisease && prefilledInitiatorId"
            style="width: 100%"
          >
            <el-option-group label="销售">
              <el-option
                v-for="user in salesUsers"
                :key="user.id"
                :label="user.name"
                :value="user.id"
              />
            </el-option-group>
            <el-option-group label="基地负责人">
              <el-option
                v-for="user in baseManagerUsers"
                :key="user.id"
                :label="user.name"
                :value="user.id"
              />
            </el-option-group>
            <el-option-group label="养护员">
              <el-option
                v-for="user in otherUsers"
                :key="user.id"
                :label="user.name"
                :value="user.id"
              />
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-divider content-position="left">双方意见</el-divider>

        <el-form-item label="销售意见">
          <el-input
            v-model="form.salesOpinion"
            type="textarea"
            :rows="3"
            placeholder="销售方意见：如客户要求、交付压力、索赔风险等..."
          />
        </el-form-item>

        <el-form-item label="基地意见">
          <el-input
            v-model="form.baseOpinion"
            type="textarea"
            :rows="3"
            placeholder="基地方意见：如处理措施、补植能力、预计时间等..."
          />
        </el-form-item>

        <el-divider content-position="left">补植方案</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="补植数量">
              <el-input-number
                v-model="form.replantQuantity"
                :min="0"
                :max="10000"
                placeholder="数量"
                style="width: 100%"
              />
              <span style="margin-left: 4px; color: #909399">株</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="补植品种">
              <el-input v-model="form.replantVariety" placeholder="如：桂花" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="补植日期">
              <el-date-picker
                v-model="form.replantDate"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
            size="large"
          >
            创建协商
          </el-button>
          <el-button size="large" @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="selectedDisease" class="detail-card">
      <div class="section-title">🔗 病害详情参考</div>
      <ElDescriptions :column="2" border size="small">
        <ElDescriptionsItem label="地块">
          {{ selectedDisease.plot?.name }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="品种">
          {{ selectedDisease.plot?.variety }} /
          {{ selectedDisease.plot?.specification }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病害类型">
          {{ selectedDisease.type }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="严重程度">
          <el-tag
            :color="getColor(diseaseSeverityOptions, selectedDisease.severity)"
          >
            {{ getLabel(diseaseSeverityOptions, selectedDisease.severity) }}
          </el-tag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="影响数量">
          {{ selectedDisease.affectedQuantity || 0 }} 株
        </ElDescriptionsItem>
        <ElDescriptionsItem label="地块总量">
          {{ selectedDisease.plot?.quantity || 0 }} 株
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病害描述" :span="2">
          {{ selectedDisease.description || "无" }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </el-card>
  </div>
</template>
