<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  ElForm,
  ElFormItem,
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
import type { Negotiation, Disease, User } from "@/types";
import {
  negotiationStatusOptions,
  getLabel,
  getColor,
} from "@/utils/constants";

const router = useRouter();
const loading = ref(false);
const negotiations = ref<Negotiation[]>([]);
const diseases = ref<Disease[]>([]);
const users = ref<User[]>([]);

const filterForm = reactive({
  diseaseId: null as number | null,
  status: null as string | null,
  initiatorId: null as number | null,
  dateRange: null as [Date, Date] | null,
});

const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filterForm.diseaseId) params.diseaseId = filterForm.diseaseId;
    if (filterForm.status) params.status = filterForm.status;
    if (filterForm.initiatorId) params.initiatorId = filterForm.initiatorId;
    if (filterForm.dateRange) {
      params.startDate = dayjs(filterForm.dateRange[0]).format("YYYY-MM-DD");
      params.endDate = dayjs(filterForm.dateRange[1]).format("YYYY-MM-DD");
    }

    [negotiations.value, diseases.value, users.value] = await Promise.all([
      api.negotiations.list(params),
      api.diseases.list(),
      api.users.list(),
    ]);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  filterForm.diseaseId = null;
  filterForm.status = null;
  filterForm.initiatorId = null;
  filterForm.dateRange = null;
  loadData();
};

const handleRowClick = (row: Negotiation) => {
  router.push(`/negotiations/${row.id}`);
};

const getDiseaseInfo = (id: number) => {
  const d = diseases.value.find((x) => x.id === id);
  return d ? `${d.plot?.name || ""} ${d.type}` : "-";
};

const getUserName = (id: number) => {
  return users.value.find((u) => u.id === id)?.name || "-";
};

onMounted(loadData);
</script>

<template>
  <div class="page-container">
    <div class="filter-section">
      <div class="section-title">多条件筛选</div>
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关联病害">
          <el-select
            v-model="filterForm.diseaseId"
            placeholder="请选择病害"
            filterable
            clearable
            style="width: 180px"
            @change="loadData"
          >
            <el-option
              v-for="d in diseases"
              :key="d.id"
              :label="`${d.plot?.name || ''} - ${d.type}`"
              :value="d.id"
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
              v-for="opt in negotiationStatusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="发起人">
          <el-select
            v-model="filterForm.initiatorId"
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

        <el-form-item label="创建日期">
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
          协商记录 ({{ negotiations.length }})
        </div>
        <el-button type="primary" @click="router.push('/negotiations/new')"
          >+ 新建协商</el-button
        >
      </div>

      <el-table
        :data="negotiations"
        style="width: 100%"
        @row-click="handleRowClick"
        :row-style="{ cursor: 'pointer' }"
      >
        <el-table-column label="编号" width="80" prop="id" />
        <el-table-column label="关联病害" width="180">
          <template #default="{ row }">{{
            getDiseaseInfo(row.diseaseId)
          }}</template>
        </el-table-column>
        <el-table-column label="发起人" width="100">
          <template #default="{ row }">{{
            getUserName(row.initiatorId)
          }}</template>
        </el-table-column>
        <el-table-column label="补植数量" width="100">
          <template #default="{ row }">
            {{ row.replantQuantity ? row.replantQuantity + " 株" : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="补植品种" width="120">
          <template #default="{ row }">{{
            row.replantVariety || "-"
          }}</template>
        </el-table-column>
        <el-table-column label="补植日期" width="120">
          <template #default="{ row }">{{ row.replantDate || "-" }}</template>
        </el-table-column>
        <el-table-column label="确认人" width="100">
          <template #default="{ row }">
            {{ row.confirmedById ? getUserName(row.confirmedById) : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :color="getColor(negotiationStatusOptions, row.status)">
              {{ getLabel(negotiationStatusOptions, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.createdAt).format("YYYY-MM-DD HH:mm") }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
