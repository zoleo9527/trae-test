<script setup lang="ts">
import { computed } from "vue";
import { useAppStore, roleLabel, statusLabel } from "@/store/app";
import { useRouter } from "vue-router";
import {
  QrCode,
  Factory,
  FileWarning,
  AlertTriangle,
  ArrowRight,
  CircleDot,
} from "lucide-vue-next";

const store = useAppStore();
const router = useRouter();

const stats = computed(() => {
  const redeemedToday = store.orders.value.filter(
    (o) => o.status !== "pending",
  ).length;
  const refundReviewing = store.db.refunds.filter(
    (r) => r.status === "reviewing",
  ).length;
  const lostCount = store.db.transfers.filter((t) => t.lost).length;
  const overdueRepair = store.db.repairs.filter(
    (r) => r.status !== "completed",
  ).length;
  return { redeemedToday, refundReviewing, lostCount, overdueRepair };
});

const exceptions = computed(() => {
  const list: Array<{
    title: string;
    detail: string;
    action: string;
    to: string;
  }> = [];
  for (const t of store.db.transfers.filter((x) => x.lost)) {
    const o = store.orderById(t.orderId);
    list.push({
      title: "镜片调拨丢失",
      detail: `${t.fromStore} → ${t.toStore}　${t.logistics} ${t.trackingNo}　订单 ${o?.code}`,
      action: "去退款复核",
      to: "/refund",
    });
  }
  for (const r of store.db.repairs.filter((x) => x.status !== "completed")) {
    const o = store.orderById(r.orderId);
    list.push({
      title: "返修进度待跟进",
      detail: `${r.reason}　预计 ${r.eta}　订单 ${o?.code}`,
      action: "去加工与返修",
      to: "/workshop",
    });
  }
  for (const rf of store.db.refunds.filter((x) => x.status === "reviewing")) {
    const o = store.orderById(rf.orderId);
    list.push({
      title: "退款待复核",
      detail: `¥${rf.amount}　${rf.reason}　订单 ${o?.code}`,
      action: "去退款复核",
      to: "/refund",
    });
  }
  return list;
});

const recentOrders = computed(() => store.orders.value.slice(0, 4));

function roleHint() {
  switch (store.currentRole) {
    case "optometrist":
      return "今日重点：扫码核销、录入验光、追加备注。";
    case "workshop":
      return "今日重点：加工进度、镜片调拨、返修登记。";
    case "service":
      return "今日重点：发起退款、补录证据、跟踪结果。";
    default:
      return "今日重点：总览异常、退款复核、全链路证据链。";
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <section class="card p-5 grid grid-cols-[1fr_auto] items-center gap-4">
      <div>
        <div class="mono">
          WELCOME · {{ roleLabel[store.currentRole].toUpperCase() }}
        </div>
        <h1 class="font-display text-2xl tracking-wide text-paper">
          你好，{{ store.currentActor?.name }}。{{ roleHint() }}
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-primary" @click="router.push('/redeem')">
          <QrCode class="w-4 h-4" /> 扫码核销
        </button>
        <button class="btn-ghost" @click="router.push('/refund')">
          <FileWarning class="w-4 h-4" /> 退款复核
        </button>
      </div>
    </section>

    <section class="grid grid-cols-4 gap-4">
      <div class="card p-4">
        <div class="flex items-center justify-between">
          <div class="mono">今日核销</div>
          <QrCode class="w-4 h-4 text-moss-500" />
        </div>
        <div class="mt-2 font-display text-3xl">{{ stats.redeemedToday }}</div>
        <div class="mono mt-1">已核销 / 进行中订单</div>
      </div>
      <div class="card p-4">
        <div class="flex items-center justify-between">
          <div class="mono">待退款复核</div>
          <FileWarning class="w-4 h-4 text-amber2-500" />
        </div>
        <div class="mt-2 font-display text-3xl">
          {{ stats.refundReviewing }}
        </div>
        <div class="mono mt-1">待店经理复核</div>
      </div>
      <div class="card p-4">
        <div class="flex items-center justify-between">
          <div class="mono">调拨丢失</div>
          <AlertTriangle class="w-4 h-4 text-rose-400" />
        </div>
        <div class="mt-2 font-display text-3xl">{{ stats.lostCount }}</div>
        <div class="mono mt-1">需证据链闭环</div>
      </div>
      <div class="card p-4">
        <div class="flex items-center justify-between">
          <div class="mono">返修待完结</div>
          <Factory class="w-4 h-4 text-violet-400" />
        </div>
        <div class="mt-2 font-display text-3xl">{{ stats.overdueRepair }}</div>
        <div class="mono mt-1">卡单 / 在途 / 返厂</div>
      </div>
    </section>

    <section class="grid grid-cols-[1.2fr_1fr] gap-4">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="section-title">待处理异常</div>
          <div class="mono">{{ exceptions.length }} 条</div>
        </div>
        <ul class="space-y-2">
          <li
            v-for="(e, i) in exceptions"
            :key="i"
            class="rounded-xl border border-white/10 bg-ink-900/50 p-3 flex items-center gap-3"
          >
            <div
              class="w-9 h-9 rounded-lg bg-rose-500/10 grid place-items-center ring-1 ring-rose-500/30"
            >
              <AlertTriangle class="w-4 h-4 text-rose-400" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-sm text-paper/90">{{ e.title }}</div>
              <div class="mono mt-0.5 truncate">{{ e.detail }}</div>
            </div>
            <button class="btn-ghost" @click="router.push(e.to)">
              {{ e.action }} <ArrowRight class="w-4 h-4" />
            </button>
          </li>
          <li v-if="exceptions.length === 0" class="text-sm text-paper/50">
            暂无待处理异常
          </li>
        </ul>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="section-title">最近订单</div>
          <button class="btn-ghost" @click="router.push('/history')">
            历史回看 <ArrowRight class="w-4 h-4" />
          </button>
        </div>
        <ul class="space-y-2">
          <li
            v-for="o in recentOrders"
            :key="o.id"
            class="rounded-xl border border-white/10 bg-ink-900/50 p-3 flex items-center gap-3"
          >
            <CircleDot class="w-4 h-4 text-moss-500" />
            <div class="min-w-0 flex-1">
              <div class="text-sm text-paper/90">{{ o.code }}</div>
              <div class="mono truncate">
                {{ store.customerOf(o)?.name }} · {{ store.pkgOf(o)?.name }}
              </div>
            </div>
            <span class="tag border-white/10 text-paper/80">{{
              statusLabel[o.status]
            }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
