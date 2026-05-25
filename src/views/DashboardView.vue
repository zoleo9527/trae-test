<template>
  <div>
    <div class="page-title">
      <div>
        <h2>工作台</h2>
        <div class="subtitle">
          一进来就能看见待处理、已驳回、需回查的核心数据
        </div>
      </div>
      <el-button type="primary" @click="goReturns">
        <el-icon class="el-icon--left"><Plus /></el-icon>
        发起退货申请
      </el-button>
    </div>

    <div class="kpi-row">
      <div class="kpi-card primary" @click="goReturns('pending')">
        <div class="label">
          <el-icon><Clock /></el-icon>待我处理
        </div>
        <div class="value">{{ store.overview.pending }}</div>
        <div class="corner">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      <div class="kpi-card danger" @click="goReturns('rejected')">
        <div class="label">
          <el-icon><CircleClose /></el-icon>已驳回
        </div>
        <div class="value">{{ store.overview.rejected }}</div>
        <div class="corner">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      <div class="kpi-card warning" @click="goReturns('review')">
        <div class="label">
          <el-icon><Warning /></el-icon>需回查
        </div>
        <div class="value">{{ store.overview.needReview }}</div>
        <div class="corner">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      <div class="kpi-card" @click="goTransfers">
        <div class="label">
          <el-icon><Van /></el-icon>调拨在途
        </div>
        <div class="value">{{ store.overview.inTransfer }}</div>
        <div class="corner">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      <div class="kpi-card warning" @click="goFinance('receipt')">
        <div class="label">
          <el-icon><DocumentDelete /></el-icon>样书回执丢失
        </div>
        <div class="value">{{ store.overview.receiptsMissing }}</div>
        <div class="corner">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
      <div class="kpi-card danger" @click="goFinance('mismatch')">
        <div class="label">
          <el-icon><Money /></el-icon>退货口径不一
        </div>
        <div class="value">{{ store.overview.mismatches }}</div>
        <div class="corner">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <section class="section-card">
      <div class="card-header">
        <div class="card-title">待处理申请</div>
        <el-button link type="primary" @click="goReturns('pending')"
          >查看全部</el-button
        >
      </div>
      <el-table
        :data="pendingList"
        stripe
        style="width: 100%"
        empty-text="暂无待处理申请"
      >
        <el-table-column prop="id" label="申请编号" width="140" />
        <el-table-column prop="channelName" label="渠道" min-width="180" />
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
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)"
              >处理</el-button
            >
            <el-button link type="warning" @click="openException(row)"
              >异常</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </section>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px">
      <section class="section-card">
        <div class="card-header">
          <div class="card-title">需回查事项</div>
          <el-button link type="primary" @click="goFinance('mismatch')"
            >对账留痕</el-button
          >
        </div>
        <div v-if="mismatches.length" class="history-list">
          <div v-for="item in mismatches" :key="item.id" class="history-line">
            <div class="dot" style="background: var(--app-warning)"></div>
            <div class="meta">
              <div>{{ item.channel }} · {{ item.bookTitle }}</div>
              <div style="margin-top: 4px">
                {{ item.caliber }} · 差额 {{ item.delta }} 册
              </div>
            </div>
            <el-button link type="primary" @click="goFinance('mismatch')"
              >回查</el-button
            >
          </div>
        </div>
        <EmptyBlock v-else text="暂无口径不一的对账项" />
      </section>

      <section class="section-card">
        <div class="card-header">
          <div class="card-title">样书回执状态</div>
          <el-button link type="primary" @click="goFinance('receipt')"
            >查看全部</el-button
          >
        </div>
        <div v-if="receiptsMissing.length" class="history-list">
          <div
            v-for="item in receiptsMissing"
            :key="item.id"
            class="history-line"
          >
            <div class="dot" style="background: var(--app-danger)"></div>
            <div class="meta">
              <div>{{ item.channel }} · {{ item.bookTitle }}</div>
              <div style="margin-top: 4px">{{ item.note }}</div>
            </div>
            <el-button link type="primary" @click="openReceipt(item)"
              >补回执</el-button
            >
          </div>
        </div>
        <EmptyBlock v-else text="样书回执状态正常" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useConsoleStore } from "@/stores/console";
import type {
  ReturnApplication,
  SampleReceipt,
  ReconciliationRecord,
} from "@/types/domain";
import EmptyBlock from "@/components/common/EmptyBlock.vue";

const store = useConsoleStore();
const router = useRouter();

const pendingList = computed(() => store.pendingReturns.slice(0, 5));
const mismatches = computed(() => store.mismatchedReconciliation.slice(0, 5));
const receiptsMissing = computed(() => store.missingReceipts.slice(0, 5));

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

function goReturns(tab?: string) {
  router.push({ path: "/returns", query: tab ? { tab } : undefined });
}

function goTransfers() {
  router.push("/transfers");
}

function goFinance(tab: string) {
  router.push({ path: "/finance", query: { tab } });
}

function openDetail(row: ReturnApplication) {
  store.selectReturn(row.id);
  store.openDrawer({
    visible: true,
    mode: "detail",
    title: `申请详情 ${row.id}`,
    context: row,
  });
}

function openException(row: ReturnApplication) {
  store.selectReturn(row.id);
  store.openDrawer({
    visible: true,
    mode: "exception",
    title: `异常处理 ${row.id}`,
    context: row,
  });
}

function openReceipt(row: SampleReceipt) {
  store.openDrawer({
    visible: true,
    mode: "receipt",
    title: `补样书回执 ${row.id}`,
    context: row,
  });
}
</script>
