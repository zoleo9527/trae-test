<template>
  <div>
    <div class="page-title">
      <div>
        <h2>退货申请</h2>
        <div class="subtitle">
          按渠道经理、发行专员的协作节奏处理；常用动作已沉淀在列表与详情中
        </div>
      </div>
      <div>
        <el-button
          type="primary"
          :disabled="store.role !== 'channel'"
          @click="store.createDraftReturn()"
        >
          <el-icon class="el-icon--left"><Plus /></el-icon>
          新建申请
        </el-button>
      </div>
    </div>

    <RoleBanner />

    <section class="section-card">
      <div class="card-header">
        <div class="card-title">申请列表</div>
        <div style="display: flex; gap: 12px">
          <el-radio-group
            :model-value="activeTab"
            @change="activeTab = $event"
            size="small"
          >
            <el-radio-button value="pending">待处理</el-radio-button>
            <el-radio-button value="approved">已通过</el-radio-button>
            <el-radio-button value="rejected">已驳回</el-radio-button>
            <el-radio-button value="all">全部</el-radio-button>
          </el-radio-group>
          <el-input
            v-model="keyword"
            size="small"
            placeholder="搜索渠道 / 申请编号"
            style="width: 200px"
            clearable
          >
            <template #prefix
              ><el-icon><Search /></el-icon
            ></template>
          </el-input>
        </div>
      </div>

      <el-table :data="filtered" stripe style="width: 100%">
        <el-table-column prop="id" label="申请编号" width="150" />
        <el-table-column prop="channelName" label="渠道" min-width="180">
          <template #default="{ row }">{{
            row.channelName || "未填写"
          }}</template>
        </el-table-column>
        <el-table-column prop="manager" label="渠道经理" width="100" />
        <el-table-column label="退货金额" width="120">
          <template #default="{ row }"
            >¥{{ row.totalAmount.toFixed(2) }}</template
          >
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{
              statusLabel(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止" width="110" />
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)"
              >查看</el-button
            >
            <el-button
              v-if="store.role === 'channel' && row.status === 'draft'"
              link
              type="primary"
              @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button
              v-if="store.role === 'channel' && row.status === 'draft'"
              link
              type="success"
              @click="trySubmit(row)"
              >提交</el-button
            >
            <el-button
              v-if="
                store.role === 'issuer' &&
                (row.status === 'submitted' || row.status === 'reviewing')
              "
              link
              type="success"
              @click="approve(row)"
              >通过</el-button
            >
            <el-button
              v-if="
                store.role === 'issuer' &&
                (row.status === 'submitted' || row.status === 'reviewing')
              "
              link
              type="danger"
              @click="openException(row)"
              >驳回</el-button
            >
            <el-button link type="warning" @click="openException(row)"
              >异常</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <EmptyBlock
        v-if="!filtered.length"
        text="当前视图下暂无数据"
        hint="尝试切换标签或清空搜索"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useConsoleStore } from "@/stores/console";
import RoleBanner from "@/components/common/RoleBanner.vue";
import EmptyBlock from "@/components/common/EmptyBlock.vue";
import type { ReturnApplication } from "@/types/domain";

const route = useRoute();
const router = useRouter();
const store = useConsoleStore();

const activeTab = ref<string>((route.query.tab as string) || "pending");
const keyword = ref("");

watch(
  () => route.query.tab,
  (t) => {
    if (t) activeTab.value = t as string;
  },
);

const filtered = computed(() => {
  let list = store.returns;
  if (activeTab.value === "pending") list = store.pendingReturns;
  if (activeTab.value === "approved") list = store.approvedReturns;
  if (activeTab.value === "rejected") list = store.rejectedReturns;
  const kw = keyword.value.trim().toLowerCase();
  if (kw) {
    list = list.filter(
      (r) =>
        (r.channelName || "").toLowerCase().includes(kw) ||
        r.id.toLowerCase().includes(kw),
    );
  }
  return list;
});

function statusLabel(status: ReturnApplication["status"]) {
  const map: Record<string, string> = {
    draft: "草稿",
    submitted: "待审核",
    reviewing: "审核中",
    approved: "已通过",
    rejected: "已驳回",
    closed: "已关闭",
  };
  return map[status] || status;
}

function statusTag(status: ReturnApplication["status"]) {
  const map: Record<string, "" | "info" | "warning" | "success" | "danger"> = {
    draft: "info",
    submitted: "warning",
    reviewing: "warning",
    approved: "success",
    rejected: "danger",
    closed: "info",
  };
  return map[status] || "";
}

function openDetail(row: ReturnApplication) {
  store.selectReturn(row.id);
  store.openDrawer({
    visible: true,
    mode: "detail",
    contextKind: "return",
    title: `申请详情 ${row.id}`,
    context: row,
  });
}

function openEdit(row: ReturnApplication) {
  store.selectReturn(row.id);
  store.openDrawer({
    visible: true,
    mode: "edit",
    contextKind: "return",
    title: `编辑草稿 ${row.id}`,
    context: row,
  });
}

function openException(row: ReturnApplication) {
  store.selectReturn(row.id);
  store.openDrawer({
    visible: true,
    mode: "exception",
    contextKind: "return",
    title: `异常处理 ${row.id}`,
    context: row,
  });
}

function trySubmit(row: ReturnApplication) {
  try {
    store.submitReturn(row.id);
    ElMessage.success("已提交审核");
  } catch (e) {
    ElMessage.warning((e as Error).message);
    openEdit(row);
  }
}

function approve(row: ReturnApplication) {
  store.approveReturn(row.id, "与铺货台账核对一致，审核通过");
}
</script>
