<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElSwitch,
} from "element-plus";
import dayjs from "dayjs";
import { api } from "@/api";
import type { Disease, Plot, User } from "@/types";
import {
  diseaseStatusOptions,
  diseaseSeverityOptions,
  getLabel,
  getColor,
} from "@/utils/constants";

const router = useRouter();
const loading = ref(false);
const diseases = ref<Disease[]>([]);
const plots = ref<Plot[]>([]);
const users = ref<User[]>([]);

const filterForm = reactive({
  plotId: null as number | null,
  status: null as string | null,
  severity: null as string | null,
  type: null as string | null,
  reporterId: null as number | null,
  isOverdue: null as boolean | null,
  dateRange: null as [Date, Date] | null,
});

const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filterForm.plotId) params.plotId = filterForm.plotId;
    if (filterForm.status) params.status = filterForm.status;
    if (filterForm.severity) params.severity = filterForm.severity;
    if (filterForm.type) params.type = filterForm.type;
    if (filterForm.reporterId) params.reporterId = filterForm.reporterId;
    if (filterForm.isOverdue !== null) params.isOverdue = filterForm.isOverdue;
    if (filterForm.dateRange) {
      params.startDate = dayjs(filterForm.dateRange[0]).format("YYYY-MM-DD");
      params.endDate = dayjs(filterForm.dateRange[1]).format("YYYY-MM-DD");
    }

    [diseases.value, plots.value, users.value] = await Promise.all([
      api.diseases.list(params),
      api.plots.list(),
      api.users.list(),
    ]);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  filterForm.plotId = null;
  filterForm.status = null;
  filterForm.severity = null;
  filterForm.type = null;
  filterForm.reporterId = null;
  filterForm.isOverdue = null;
  filterForm.dateRange = null;
  loadData();
};

const handleRowClick = (row: Disease) => {
  router.push(`/diseases/${row.id}`);
};

const getPlotName = (id: number) => {
  return plots.value.find((p) => p.id === id)?.name || "-";
};

const getUserName = (id: number) => {
  return users.value.find((u) => u.id === id)?.name || "-";
};

const diseaseTypes = computed(() => {
  const types = new Set(diseases.value.map((d) => d.type));
  return Array.from(types);
});

onMounted(loadData);
</script>

<template>
  <div class="page-container">
    <div class="filter-section">
      <div class="section-title">多条件筛选</div>
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="地块">
          <el-select
            v-model="filterForm.plotId"
            placeholder="请选择地块"
            clearable
            style="width: 140px"
            @change="loadData"
          >
            <el-option
              v-for="plot in plots"
              :key="plot.id"
              :label="plot.name"
              :value="plot.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="filterForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
            @change="loadData"
          >
            <el-option
              v-for="opt in diseaseStatusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="严重程度">
          <el-select
            v-model="filterForm.severity"
            placeholder="请选择"
            clearable
            style="width: 120px"
            @change="loadData"
          >
            <el-option
              v-for="opt in diseaseSeverityOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="病害类型">
          <el-select
            v-model="filterForm.type"
            placeholder="请选择"
            clearable
            filterable
            style="width: 120px"
            @change="loadData"
          >
            <el-option
              v-for="type in diseaseTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="上报人">
          <el-select
            v-model="filterForm.reporterId"
            placeholder="请选择"
            clearable
            style="width: 120px"
            @change="loadData"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="仅看逾期">
          <el-switch
            v-model="filterForm.isOverdue"
            active-text="是"
            inactive-text="全部"
            @change="loadData"
          />
        </el-form-item>

        <el-form-item label="上报日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="loadData"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-section" v-loading="loading">
      <div
        style="
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        "
      >
        <div class="section-title" style="margin-bottom: 0">
          病害记录 ({{ diseases.length }})
        </div>
        <div>
          <el-button
            v-if="diseases.some((d) => d.isOverdue)"
            type="danger"
            plain
            size="small"
          >
            ⚠️ {{ diseases.filter((d) => d.isOverdue).length }} 条已逾期
          </el-button>
        </div>
      </div>

      <el-table
        :data="diseases"
        style="width: 100%"
        @row-click="handleRowClick"
        :row-style="{ cursor: 'pointer' }"
      >
        <el-table-column label="编号" width="80" prop="id" />
        <el-table-column label="地块" width="120">
          <template #default="{ row }">{{ getPlotName(row.plotId) }}</template>
        </el-table-column>
        <el-table-column label="病害类型" width="120" prop="type" />
        <el-table-column label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :color="getColor(diseaseSeverityOptions, row.severity)">
              {{ getLabel(diseaseSeverityOptions, row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="影响数量" width="100">
          <template #default="{ row }"
            >{{ row.affectedQuantity || "-" }} 株</template
          >
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <div style="display: flex; align-items: center">
              <el-tag :color="getColor(diseaseStatusOptions, row.status)">
                {{ getLabel(diseaseStatusOptions, row.status) }}
              </el-tag>
              <span v-if="row.isOverdue" class="overdue-badge">逾期</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="上报人" width="100">
          <template #default="{ row }">{{
            getUserName(row.reporterId)
          }}</template>
        </el-table-column>
        <el-table-column label="上报时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.reportedAt).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
        <el-table-column label="处理进度" width="180">
          <template #default="{ row }">
            <div
              style="
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
              "
            >
              <el-tag
                size="small"
                :type="row.timelines?.length > 0 ? 'success' : 'info'"
                >上报</el-tag
              >
              <span style="color: #dcdfe6">→</span>
              <el-tag
                size="small"
                :type="
                  row.timelines?.some((t) => t.action.includes('确认'))
                    ? 'success'
                    : 'info'
                "
                >确认</el-tag
              >
              <span style="color: #dcdfe6">→</span>
              <el-tag
                size="small"
                :type="
                  row.timelines?.some((t) => t.action.includes('处理'))
                    ? 'success'
                    : 'info'
                "
                >处理</el-tag
              >
              <span style="color: #dcdfe6">→</span>
              <el-tag
                size="small"
                :type="row.status === 'resolved' ? 'success' : 'info'"
                >完成</el-tag
              >
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
