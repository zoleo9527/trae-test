<template>
  <div>
    <div class="page-title">
      <div>
        <h2>工作台</h2>
        <div class="subtitle">
          常用动作沉到页面，不靠记忆记步骤；一眼看到待处理、已驳回和需回查的数据
        </div>
      </div>
      <div>
        <el-button @click="openReturnList">进入退货申请</el-button>
      </div>
    </div>

    <RoleBanner />

    <section class="kpi-row">
      <div
        v-for="k in kpis"
        :key="k.label"
        class="kpi-card"
        :style="{ background: k.tone }"
        @click="k.click"
      >
        <div class="kpi-label">{{ k.label }}</div>
        <div class="kpi-value">{{ k.value }}</div>
        <div class="kpi-hint">点击{{ k.hint }}</div>
      </div>
    </section>

    <section class="section-card">
      <div class="card-header">
        <div class="card-title">待处理</div>
        <div>
          <el-button link type="primary" @click="openReturnList"
            >全部待处理 →</el-button
          >
        </div>
      </div>
      <el-table :data="store.pendingReturns" stripe style="width: 100%">
        <el-table-column prop="id" label="申请编号" width="150" />
        <el-table-column prop="channelName" label="渠道" min-width="160" />
        <el-table-column label="退货金额" width="120">
          <template #default="{ row }"
            >¥{{ row.totalAmount.toFixed(2) }}</template
          >
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="tag(row.status)">{{ label(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止" width="110" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)"
              >查看</el-button
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
        v-if="!store.pendingReturns.length"
        text="当前没有待处理的申请"
        hint="切换到退货申请或库存调拨查看更多"
      />
    </section>

    <section class="section-card">
      <div class="card-header">
        <div class="card-title">已驳回</div>
        <div>
          <el-button link type="primary" @click="openReturnList('rejected')"
            >全部已驳回 →</el-button
          >
        </div>
      </div>
      <el-table :data="store.rejectedReturns" stripe style="width: 100%">
        <el-table-column prop="id" label="申请编号" width="150" />
        <el-table-column prop="channelName" label="渠道" min-width="160" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag type="danger">已驳回</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="驳回原因" min-width="220">
          <template #default="{ row }">
            {{ row.rejectReason || "详见留痕" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)"
              >查看</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <EmptyBlock v-if="!store.rejectedReturns.length" text="暂无已驳回申请" />
    </section>

    <section class="section-card">
      <div class="card-header">
        <div class="card-title">需回查 · 口径不一</div>
        <div>
          <el-button link type="primary" @click="openFinance('mismatch')"
            >前往对账 →</el-button
          >
        </div>
      </div>
      <el-table :data="mismatches" stripe style="width: 100%">
        <el-table-column prop="id" label="台账编号" width="150" />
        <el-table-column prop="channel" label="渠道" min-width="160" />
        <el-table-column prop="bookTitle" label="书名" min-width="160" />
        <el-table-column label="应退" width="80">
          <template #default="{ row }">{{ row.expectedReturn }}</template>
        </el-table-column>
        <el-table-column label="实退" width="80">
          <template #default="{ row }">{{ row.actualReturn }}</template>
        </el-table-column>
        <el-table-column prop="caliber" label="口径说明" min-width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="openRecon(row)"
              >查看</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <EmptyBlock v-if="!mismatches.length" text="暂无口径不一致" />
    </section>

    <section class="section-card">
      <div class="card-header">
        <div class="card-title">样书回执跟踪</div>
        <div>
          <el-button link type="primary" @click="openFinance('receipt')"
            >前往对账 →</el-button
          >
        </div>
      </div>
      <el-table :data="receipts" stripe style="width: 100%">
        <el-table-column prop="id" label="回执单" width="150" />
        <el-table-column prop="channel" label="渠道" min-width="160" />
        <el-table-column prop="bookTitle" label="书名" min-width="160" />
        <el-table-column prop="qty" label="册数" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="receiptTag(row.status)">{{
              receiptLabel(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="openReceipt(row)"
              >查看</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <EmptyBlock v-if="!receipts.length" text="暂无回执记录" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useConsoleStore } from "@/stores/console";
import RoleBanner from "@/components/common/RoleBanner.vue";
import EmptyBlock from "@/components/common/EmptyBlock.vue";
import type {
  ReconciliationRecord,
  ReturnApplication,
  SampleReceipt,
} from "@/types/domain";

const store = useConsoleStore();
const router = useRouter();

const kpis = computed(() => [
  {
    label: "待处理申请",
    value: store.overview.pending,
    hint: "进入退货申请",
    tone: "var(--card-warm)",
    click: () => openReturnList(),
  },
  {
    label: "已驳回",
    value: store.overview.rejected,
    hint: "查看已驳回",
    tone: "var(--card-danger)",
    click: () => openReturnList("rejected"),
  },
  {
    label: "在途调拨",
    value: store.overview.inTransfer,
    hint: "进入调拨",
    tone: "var(--card-blue)",
    click: () => router.push("/transfers"),
  },
  {
    label: "回执丢失",
    value: store.overview.receiptsMissing,
    hint: "前往对账",
    tone: "var(--card-warn)",
    click: () => openFinance("receipt"),
  },
  {
    label: "口径不一",
    value: store.overview.mismatches,
    hint: "前往对账",
    tone: "var(--card-warn)",
    click: () => openFinance("mismatch"),
  },
  {
    label: "累计对账",
    value: store.overview.reconciled,
    hint: "查看对账",
    tone: "var(--card-success)",
    click: () => router.push("/finance"),
  },
]);

const mismatches = computed(() =>
  store.reconciliations.filter((r) => r.status === "mismatch"),
);

const receipts = computed(() =>
  store.receipts.filter(
    (r) => r.status === "missing" || r.status === "pending",
  ),
);

function label(s: ReturnApplication["status"]) {
  return (
    {
      draft: "草稿",
      submitted: "待审核",
      reviewing: "审核中",
      approved: "已通过",
      rejected: "已驳回",
      closed: "已关闭",
    } as const
  )[s];
}
function tag(s: ReturnApplication["status"]) {
  return (
    (
      {
        draft: "info",
        submitted: "warning",
        reviewing: "warning",
        approved: "success",
        rejected: "danger",
        closed: "info",
      } as const
    )[s] || ""
  );
}

function receiptLabel(s: SampleReceipt["status"]) {
  return (
    {
      pending: "待提交",
      submitted: "已提交",
      missing: "丢失",
      confirmed: "已确认",
    } as const
  )[s];
}
function receiptTag(s: SampleReceipt["status"]) {
  return (
    (
      {
        pending: "info",
        submitted: "warning",
        missing: "danger",
        confirmed: "success",
      } as const
    )[s] || ""
  );
}

function openReturnList(tab = "pending") {
  router.push({ path: "/returns", query: { tab } });
}
function openFinance(tab: string) {
  router.push({ path: "/finance", query: { tab } });
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

function approve(row: ReturnApplication) {
  store.approveReturn(row.id, "与铺货台账核对一致，审核通过");
}

function openRecon(row: ReconciliationRecord) {
  store.selectReconciliation(row.id);
  store.openDrawer({
    visible: true,
    mode: "detail",
    contextKind: "reconciliation",
    title: `对账台账 ${row.id}`,
    context: row,
  });
}

function openReceipt(row: SampleReceipt) {
  store.selectReceipt(row.id);
  store.openDrawer({
    visible: true,
    mode: "detail",
    contextKind: "receipt",
    title: `回执详情 ${row.id}`,
    context: row,
  });
}
</script>
