<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import { api } from "@/api";
import type { Plot, User } from "@/types";
import { roleOptions, getLabel } from "@/utils/constants";

const router = useRouter();
const loading = ref(false);
const plots = ref<Plot[]>([]);
const users = ref<User[]>([]);

const filterForm = reactive({
  name: null as string | null,
  location: null as string | null,
  variety: null as string | null,
  inspectorId: null as number | null,
});

const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filterForm.name) params.name = filterForm.name;
    if (filterForm.location) params.location = filterForm.location;
    if (filterForm.variety) params.variety = filterForm.variety;
    if (filterForm.inspectorId) params.inspectorId = filterForm.inspectorId;

    [plots.value, users.value] = await Promise.all([
      api.plots.list(params),
      api.users.list(),
    ]);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  filterForm.name = null;
  filterForm.location = null;
  filterForm.variety = null;
  filterForm.inspectorId = null;
  loadData();
};

const handleRowClick = (row: Plot) => {
  router.push(`/plots/${row.id}`);
};

const getInspectorName = (id: number) => {
  return users.value.find((u) => u.id === id)?.name || "-";
};

const locations = computed(() => {
  const locs = new Set(plots.value.map((p) => p.location).filter(Boolean));
  return Array.from(locs);
});

const varieties = computed(() => {
  const vars = new Set(plots.value.map((p) => p.variety).filter(Boolean));
  return Array.from(vars);
});

onMounted(loadData);
</script>

<template>
  <div class="page-container">
    <div class="filter-section">
      <div class="section-title">多条件筛选</div>
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="地块名称">
          <el-input
            v-model="filterForm.name"
            placeholder="请输入名称"
            clearable
            style="width: 140px"
            @keyup.enter="loadData"
          />
        </el-form-item>

        <el-form-item label="区域">
          <el-select
            v-model="filterForm.location"
            placeholder="请选择区域"
            clearable
            filterable
            style="width: 120px"
            @change="loadData"
          >
            <el-option
              v-for="loc in locations"
              :key="loc"
              :label="loc"
              :value="loc"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="品种">
          <el-select
            v-model="filterForm.variety"
            placeholder="请选择品种"
            clearable
            filterable
            style="width: 120px"
            @change="loadData"
          >
            <el-option v-for="v in varieties" :key="v" :label="v" :value="v" />
          </el-select>
        </el-form-item>

        <el-form-item label="养护员">
          <el-select
            v-model="filterForm.inspectorId"
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
          地块列表 ({{ plots.length }})
        </div>
        <el-button type="primary">+ 新增地块</el-button>
      </div>

      <el-table
        :data="plots"
        style="width: 100%"
        @row-click="handleRowClick"
        :row-style="{ cursor: 'pointer' }"
      >
        <el-table-column label="编号" width="80" prop="id" />
        <el-table-column label="地块名称" width="120" prop="name" />
        <el-table-column label="区域" width="100" prop="location" />
        <el-table-column label="品种" width="120" prop="variety" />
        <el-table-column label="规格" width="140" prop="specification" />
        <el-table-column label="数量" width="100">
          <template #default="{ row }">{{ row.quantity }} 株</template>
        </el-table-column>
        <el-table-column label="养护员" width="120">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 6px">
              <span>{{ getInspectorName(row.inspectorId) }}</span>
              <el-tag size="small" type="success">养护员</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString("zh-CN") }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
