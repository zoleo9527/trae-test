<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
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
} from "element-plus";
import dayjs from "dayjs";
import { api } from "@/api";
import type { Inspection, Plot, User } from "@/types";
import { inspectionStatusOptions, getLabel, getColor } from "@/utils/constants";

const router = useRouter();
const loading = ref(false);
const inspections = ref<Inspection[]>([]);
const plots = ref<Plot[]>([]);
const inspectors = ref<User[]>([]);

const filterForm = reactive({
  plotId: null as number | null,
  inspectorId: null as number | null,
  status: null as string | null,
  hasDisease: null as boolean | null,
  dateRange: null as [Date, Date] | null,
});

const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filterForm.plotId) params.plotId = filterForm.plotId;
    if (filterForm.inspectorId) params.inspectorId = filterForm.inspectorId;
    if (filterForm.status) params.status = filterForm.status;
    if (filterForm.hasDisease !== null)
      params.hasDisease = filterForm.hasDisease;
    if (filterForm.dateRange) {
      params.startDate = dayjs(filterForm.dateRange[0]).format("YYYY-MM-DD");
      params.endDate = dayjs(filterForm.dateRange[1]).format("YYYY-MM-DD");
    }

    [inspections.value, plots.value, inspectors.value] = await Promise.all([
      api.inspections.list(params),
      api.plots.list(),
      api.users.list(),
    ]);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  filterForm.plotId = null;
  filterForm.inspectorId = null;
  filterForm.status = null;
  filterForm.hasDisease = null;
  filterForm.dateRange = null;
  loadData();
};

const handleRowClick = (row: Inspection) => {
  router.push(`/inspections/${row.id}`);
};

const getPlotName = (id: number) => {
  return plots.value.find((p) => p.id === id)?.name || "-";
};

const getInspectorName = (id: number) => {
  return inspectors.value.find((u) => u.id === id)?.name || "-";
};

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
            style="width: 160px"
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

        <el-form-item label="养护员">
          <el-select
            v-model="filterForm.inspectorId"
            placeholder="请选择养护员"
            clearable
            style="width: 140px"
            @change="loadData"
          >
            <el-option
              v-for="user in inspectors"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="filterForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 140px"
            @change="loadData"
          >
            <el-option
              v-for="opt in inspectionStatusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="是否有病害">
          <el-select
            v-model="filterForm.hasDisease"
            placeholder="请选择"
            clearable
            style="width: 140px"
            @change="loadData"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item label="巡查日期">
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
          巡查记录 ({{ inspections.length }})
        </div>
        <el-button type="primary" @click="router.push('/inspections/new')"
          >+ 新增巡查</el-button
        >
      </div>

      <el-table
        :data="inspections"
        style="width: 100%"
        @row-click="handleRowClick"
        :row-style="{ cursor: 'pointer' }"
      >
        <el-table-column label="编号" width="80" prop="id" />
        <el-table-column label="地块" width="120">
          <template #default="{ row }">{{ getPlotName(row.plotId) }}</template>
        </el-table-column>
        <el-table-column label="品种" width="120">
          <template #default="{ row }">{{ row.plot?.variety || "-" }}</template>
        </el-table-column>
        <el-table-column label="养护员" width="100">
          <template #default="{ row }">{{
            getInspectorName(row.inspectorId)
          }}</template>
        </el-table-column>
        <el-table-column label="长势" width="100" prop="growthStatus" />
        <el-table-column label="土壤" width="100" prop="soilCondition" />
        <el-table-column label="水分" width="100" prop="moistureCondition" />
        <el-table-column label="病害" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.hasDisease" type="danger">有病害</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :color="getColor(inspectionStatusOptions, row.status)">
              {{ getLabel(inspectionStatusOptions, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="巡查日期" width="120" prop="inspectionDate" />
      </el-table>
    </div>
  </div>
</template>
