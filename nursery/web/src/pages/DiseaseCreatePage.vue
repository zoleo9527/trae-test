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
  ElRadioGroup,
  ElRadio,
  ElInputNumber,
  ElAlert,
} from "element-plus";
import dayjs from "dayjs";
import { api } from "@/api";
import type { Plot, User, Inspection } from "@/types";
import { diseaseSeverityOptions } from "@/utils/constants";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const plots = ref<Plot[]>([]);
const users = ref<User[]>([]);
const inspection = ref<Inspection | null>(null);

const fromInspection = computed(() => !!route.query.inspectionId);
const prefilledPlotId = computed(() =>
  route.query.plotId ? Number(route.query.plotId) : null,
);
const prefilledInspectionId = computed(() =>
  route.query.inspectionId ? Number(route.query.inspectionId) : null,
);
const prefilledReporterId = computed(() =>
  route.query.inspectorId ? Number(route.query.inspectorId) : null,
);

const formRef = ref();
const form = reactive({
  inspectionId: prefilledInspectionId.value,
  plotId: prefilledPlotId.value,
  reporterId: prefilledReporterId.value,
  type: "",
  severity: "moderate" as string,
  description: "",
  affectedQuantity: null as number | null,
  reportedAt: dayjs().format("YYYY-MM-DD HH:mm"),
});

const commonDiseaseTypes = [
  "蚜虫",
  "红蜘蛛",
  "介壳虫",
  "天牛",
  "叶斑病",
  "根腐病",
  "白粉病",
  "锈病",
  "炭疽病",
  "立枯病",
  "猝倒病",
];

const loadOptions = async () => {
  [plots.value, users.value] = await Promise.all([
    api.plots.list(),
    api.users.list(),
  ]);

  if (prefilledInspectionId.value) {
    try {
      inspection.value = await api.inspections.get(prefilledInspectionId.value);
    } catch (e) {
      console.error("加载关联巡查失败", e);
    }
  }
};

const handleSubmit = async () => {
  if (!form.plotId || !form.reporterId || !form.type) {
    ElMessage.warning("请填写完整信息：地块、上报人、病害类型");
    return;
  }

  loading.value = true;
  try {
    const data = {
      inspectionId: form.inspectionId || undefined,
      plotId: form.plotId,
      reporterId: form.reporterId,
      type: form.type,
      severity: form.severity,
      description: form.description,
      affectedQuantity: form.affectedQuantity || undefined,
      reportedAt: form.reportedAt,
    };

    const disease = await api.diseases.create(data);
    ElMessage.success("病害上报成功");

    if (
      form.severity === "major" ||
      (form.affectedQuantity && form.affectedQuantity > 20)
    ) {
      ElMessage({
        message: "该病害较为严重，建议启动补苗协商",
        type: "warning",
        duration: 3000,
      });
    }

    router.push(`/diseases/${disease.id}`);
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || "上报失败");
  } finally {
    loading.value = false;
  }
};

const handleStartNegotiation = () => {
  if (!form.plotId || !form.reporterId || !form.type) {
    ElMessage.warning("请先填写病害信息");
    return;
  }
  router.push({
    path: "/negotiations/new",
    query: {
      diseaseId: "new",
      plotId: String(form.plotId),
      initiatorId: String(form.reporterId),
      type: form.type,
      severity: form.severity,
      affectedQuantity: String(form.affectedQuantity || 0),
    },
  });
};

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
          <h3 style="margin: 0; font-size: 20px">🦠 上报病害</h3>
          <el-tag v-if="fromInspection" type="info">来自巡查</el-tag>
        </div>
        <div>
          <el-button @click="router.back()">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            提交上报
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="fromInspection && inspection"
        :title="`关联巡查 #${inspection.id}：${inspection.plot?.name} - ${inspection.remark || '无备注'}`"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-form
        ref="formRef"
        :model="form"
        label-width="120px"
        style="max-width: 800px"
      >
        <el-divider content-position="left">关联信息</el-divider>

        <el-form-item label="关联巡查" v-if="!fromInspection">
          <el-select
            v-model="form.inspectionId"
            placeholder="可选：关联巡查记录"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="ins in [inspection]"
              v-if="ins"
              :key="ins.id"
              :label="`#${ins.id} ${ins.plot?.name} - ${ins.inspectionDate}`"
              :value="ins.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="地块" required>
          <el-select
            v-model="form.plotId"
            placeholder="请选择地块"
            :disabled="fromInspection && prefilledPlotId"
            style="width: 100%"
          >
            <el-option
              v-for="plot in plots"
              :key="plot.id"
              :label="`${plot.name}（${plot.variety}，${plot.quantity}株）`"
              :value="plot.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="上报人" required>
          <el-select
            v-model="form.reporterId"
            placeholder="请选择上报人"
            :disabled="fromInspection && prefilledReporterId"
            style="width: 100%"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="上报时间">
          <el-date-picker
            v-model="form.reportedAt"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>

        <el-divider content-position="left">病害信息</el-divider>

        <el-form-item label="病害类型" required>
          <el-select
            v-model="form.type"
            placeholder="请选择或输入病害类型"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option
              v-for="type in commonDiseaseTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="严重程度">
          <el-radio-group v-model="form.severity">
            <el-radio value="minor">
              <span style="color: #67c23a">●</span> 轻度
            </el-radio>
            <el-radio value="moderate">
              <span style="color: #e6a23c">●</span> 中度
            </el-radio>
            <el-radio value="major">
              <span style="color: #f56c6c">●</span> 重度
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="影响数量">
          <el-input-number
            v-model="form.affectedQuantity"
            :min="0"
            :max="10000"
            placeholder="受影响株数"
            style="width: 200px"
          />
          <span style="margin-left: 8px; color: #909399">株</span>
        </el-form-item>

        <el-form-item label="病害描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述病害情况，如发病部位、症状、持续时间、可能原因等..."
          />
        </el-form-item>

        <el-divider />

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
            size="large"
          >
            提交上报
          </el-button>
          <el-button
            v-if="
              form.severity === 'major' ||
              (form.affectedQuantity && form.affectedQuantity > 20)
            "
            type="warning"
            :loading="loading"
            @click="handleStartNegotiation"
            size="large"
          >
            提交并启动协商
          </el-button>
          <el-button size="large" @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
