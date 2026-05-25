<template>
  <div>
    <div class="page-title">
      <div>
        <h2>库存调拨</h2>
        <div class="subtitle">
          发行专员主导调拨流程；样书回执丢失、口径异常等风险项在此显式留痕
        </div>
      </div>
      <div>
        <el-tag size="small" type="info"
          >在途 {{ store.overview.inTransfer }}</el-tag
        >
      </div>
    </div>

    <RoleBanner />

    <section class="section-card">
      <div class="card-header">
        <div class="card-title">调拨单列表</div>
        <div style="display: flex; gap: 12px">
          <el-radio-group
            :model-value="activeTab"
            @change="activeTab = $event"
            size="small"
          >
            <el-radio-button value="open">在途</el-radio-button>
            <el-radio-button value="completed">已完成</el-radio-button>
            <el-radio-button value="all">全部</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-table :data="filtered" stripe style="width: 100%">
        <el-table-column prop="id" label="调拨单号" width="150" />
        <el-table-column label="关联申请" width="160">
          <template #default="{ row }">
            <span
              v-if="row.returnApplicationId"
              class="row-link"
              @click="jumpReturn(row.returnApplicationId)"
            >
              {{ row.returnApplicationId }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="目的地" min-width="160">
          <template #default="{ row }">{{ row.lines[0]?.to || "-" }}</template>
        </el-table-column>
        <el-table-column label="风险" width="90">
          <template #default="{ row }">
            <el-tag :type="riskTag(row.risk)" size="small">{{
              riskLabel(row.risk)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="transferTag(row.status)">{{
              transferLabel(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expectedDate" label="预计" width="110" />
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)"
              >查看</el-button
            >
            <el-button
              v-if="store.role === 'issuer' && row.status === 'pending'"
              link
              type="success"
              @click="ship(row)"
              >发货</el-button
            >
            <el-button
              v-if="store.role === 'channel' && row.status === 'processing'"
              link
              type="success"
              @click="complete(row)"
              >签收</el-button
            >
            <el-button link type="warning" @click="openException(row)"
              >异常</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <EmptyBlock v-if="!filtered.length" text="暂无调拨单" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useConsoleStore } from "@/stores/console";
import RoleBanner from "@/components/common/RoleBanner.vue";
import EmptyBlock from "@/components/common/EmptyBlock.vue";
import type { StockTransfer } from "@/types/domain";

const store = useConsoleStore();
const router = useRouter();
const activeTab = ref("open");

const filtered = computed(() => {
  if (activeTab.value === "open") return store.openTransfers;
  if (activeTab.value === "completed")
    return store.transfers.filter((t) => t.status === "completed");
  return store.transfers;
});

function transferLabel(s: StockTransfer["status"]) {
  return {
    pending: "待发货",
    processing: "在途",
    completed: "已完成",
    shipped: "已发货",
    rejected: "已驳回",
  }[s];
}

function transferTag(s: StockTransfer["status"]) {
  return (
    (
      {
        pending: "warning",
        processing: "primary",
        completed: "success",
        shipped: "primary",
        rejected: "danger",
      } as const
    )[s] || ""
  );
}

function riskLabel(r: StockTransfer["risk"]) {
  return { low: "低", medium: "中", high: "高" }[r];
}

function riskTag(r: StockTransfer["risk"]) {
  return (
    ({ low: "success", medium: "warning", high: "danger" } as const)[r] || ""
  );
}

function jumpReturn(id: string) {
  store.selectReturn(id);
  router.push("/returns");
  setTimeout(() => {
    store.openDrawer({
      visible: true,
      mode: "detail",
      contextKind: "return",
      title: `申请详情 ${id}`,
    });
  }, 200);
}

function openDetail(row: StockTransfer) {
  store.selectTransfer(row.id);
  store.openDrawer({
    visible: true,
    mode: "detail",
    contextKind: "transfer",
    title: `调拨单 ${row.id}`,
    context: row,
  });
}

function openException(row: StockTransfer) {
  store.selectTransfer(row.id);
  store.openDrawer({
    visible: true,
    mode: "exception",
    contextKind: "transfer",
    title: `调拨异常 ${row.id}`,
    context: row,
  });
}

function ship(row: StockTransfer) {
  store.shipTransfer(row.id, "顺丰速递", "SF" + Date.now());
}

function complete(row: StockTransfer) {
  store.completeTransfer(row.id);
}
</script>
