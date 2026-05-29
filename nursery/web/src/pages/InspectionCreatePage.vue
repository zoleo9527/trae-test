<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
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
} from "element-plus";
import dayjs from "dayjs";
import { api } from "@/api";
import type { Plot, User } from "@/types";
import { inspectionStatusOptions } from "@/utils/constants";

const router = useRouter();
const loading = ref(false);
const plots = ref<Plot[]>([]);
const inspectors = ref<User[]>([]);

const formRef = ref();
const form = reactive({
  plotId: null as number | null,
  inspectorId: null as number | null,
  growthStatus: "良好",
  soilCondition: "正常",
  moistureCondition: "适宜",
  remark: "",
  status: "pending",
  inspectionDate: dayjs().format("YYYY-MM-DD"),
  hasDisease: false,
});

const loadOptions = async () => {
  [plots.value, inspectors.value] = await Promise.all([
    api.plots.list(),
    api.users.list(),
  ]);
};

const handleSubmit = async () => {
  if (!form.plotId || !form.inspectorId) {
    ElMessage.warning("请选择地块和养护员");
    return;
  }

  loading.value = true;
  try {
    const data = {
      plotId: form.plotId,
      inspectorId: form.inspectorId,
      growthStatus: form.growthStatus,
      soilCondition: form.soilCondition,
      moistureCondition: form.moistureCondition,
      remark: form.remark,
      status: form.status,
      inspectionDate: form.inspectionDate,
      hasDisease: form.hasDisease,
    };

    const inspection = await api.inspections.create(data);
    ElMessage.success("巡查记录创建成功");

    if (form.hasDisease) {
      router.push({
        path: "/diseases/new",
        query: {
          inspectionId: String(inspection.id),
          plotId: String(form.plotId),
          inspectorId: String(form.inspectorId),
        },
      });
    } else {
      router.push(`/inspections/${inspection.id}`);
    }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || "创建失败");
  } finally {
    loading.value = false;
  }
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
        <h3 style="margin: 0; font-size: 20px">📝 新增巡查记录</h3>
        <div>
          <el-button @click="router.back()">取消</el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            提交
          </el-button>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        label-width="120px"
        style="max-width: 800px"
      >
        <el-divider content-position="left">基础信息</el-divider>

        <el-form-item label="巡查地块" required>
          <el-select
            v-model="form.plotId"
            placeholder="请选择巡查地块"
            style="width: 100%"
          >
            <el-option
              v-for="plot in plots"
              :key="plot.id"
              :label="`${plot.name}（${plot.variety}）`"
              :value="plot.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="养护员" required>
          <el-select
            v-model="form.inspectorId"
            placeholder="请选择养护员"
            style="width: 100%"
          >
            <el-option
              v-for="user in inspectors"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="巡查日期" required>
          <el-date-picker
            v-model="form.inspectionDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-divider content-position="left">巡查情况</el-divider>

        <el-form-item label="生长状态">
          <el-radio-group v-model="form.growthStatus">
            <el-radio value="良好">良好</el-radio>
            <el-radio value="一般">一般</el-radio>
            <el-radio value="较差">较差</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="土壤状况">
          <el-radio-group v-model="form.soilCondition">
            <el-radio value="正常">正常</el-radio>
            <el-radio value="偏干">偏干</el-radio>
            <el-radio value="偏湿">偏湿</el-radio>
            <el-radio value="板结">板结</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="水分状况">
          <el-radio-group v-model="form.moistureCondition">
            <el-radio value="适宜">适宜</el-radio>
            <el-radio value="不足">不足</el-radio>
            <el-radio value="过湿">过湿</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="是否发现病害">
          <el-radio-group v-model="form.hasDisease">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="巡查备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入巡查备注，如发现异常请详细描述..."
          />
        </el-form-item>

        <el-form-item label="提交状态">
          <el-radio-group v-model="form.status">
            <el-radio value="pending">保存草稿</el-radio>
            <el-radio value="completed">直接完成</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider />

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
            size="large"
          >
            {{ form.hasDisease ? "提交并上报病害" : "提交巡查" }}
          </el-button>
          <el-button size="large" @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
