<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">概览</h1>
      <div class="text-sm text-slate-500">
        当前角色：<span class="tag-amber ml-1">{{ auth.roleName }}</span>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="card p-4">
        <div class="text-xs text-slate-500">进货批次</div>
        <div class="text-2xl font-bold mt-1">{{ stats.purchase_count }}</div>
        <div class="text-xs text-slate-400 mt-1">
          净重 {{ stats.purchase_net_kg?.toFixed(0) }} 斤
        </div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-slate-500">分级率</div>
        <div class="text-2xl font-bold mt-1">{{ pct(stats.graded_ratio) }}</div>
        <div class="text-xs text-slate-400 mt-1">
          配货率 {{ pct(stats.allocated_ratio) }}
        </div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-slate-500">损耗率</div>
        <div
          class="text-2xl font-bold mt-1"
          :class="stats.loss_ratio > 0.1 ? 'text-rose-600' : ''"
        >
          {{ pct(stats.loss_ratio) }}
        </div>
        <div class="text-xs text-slate-400 mt-1">
          进货总金额 ¥{{ stats.purchase_total_amount?.toFixed(0) }}
        </div>
      </div>
      <div class="card p-4">
        <div class="text-xs text-slate-500">未结赊销</div>
        <div class="text-2xl font-bold mt-1 text-rose-600">
          ¥{{ stats.credit_balance?.toFixed(0) }}
        </div>
        <div class="text-xs text-slate-400 mt-1">
          逾期 {{ stats.overdue_count }} 单 · 待处理异常
          {{ stats.open_exception_count }} 单
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="card p-4 lg:col-span-2">
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold">近期进货</div>
          <NuxtLink
            to="/purchases"
            class="text-sm text-brand-600 hover:underline"
            >查看全部</NuxtLink
          >
        </div>
        <table class="fruit">
          <thead>
            <tr>
              <th>单号</th>
              <th>果品</th>
              <th>净重</th>
              <th>分级</th>
              <th>配货</th>
              <th>损耗</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in recentPurchases" :key="p.id">
              <td class="font-mono text-xs">{{ p.code }}</td>
              <td>{{ p.product_name }}</td>
              <td>{{ p.net_kg }} 斤</td>
              <td>
                <span v-if="p.graded_kg > 0" class="tag-green"
                  >{{ p.graded_kg.toFixed(0) }} 斤</span
                >
                <span v-else class="tag-slate">未分级</span>
              </td>
              <td>
                <span v-if="p.allocated_kg > 0" class="tag-blue"
                  >{{ p.allocated_kg.toFixed(0) }} 斤</span
                >
                <span v-else class="tag-slate">-</span>
              </td>
              <td>
                <span v-if="p.loss_kg > 0" class="tag-red"
                  >{{ p.loss_kg.toFixed(0) }} 斤</span
                >
                <span v-else>-</span>
              </td>
              <td>
                <button
                  class="text-brand-600 hover:underline"
                  @click="$router.push(`/purchases/${p.id}`)"
                >
                  回查
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold">待处理异常</div>
          <NuxtLink
            to="/exceptions"
            class="text-sm text-brand-600 hover:underline"
            >查看全部</NuxtLink
          >
        </div>
        <div class="space-y-2">
          <div
            v-for="e in openExceptions"
            :key="e.id"
            class="border border-slate-200 rounded-lg p-3"
          >
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium">{{ e.title }}</div>
              <span class="text-xs" :class="typeColor(e.type)">{{
                e.type
              }}</span>
            </div>
            <div class="text-xs text-slate-500 mt-1">
              金额 ¥{{ e.amount?.toFixed(0) }} · {{ e.handler }}
            </div>
            <div class="mt-1">
              <span :class="statusColor(e.status)" class="text-xs">{{
                e.status
              }}</span>
            </div>
          </div>
          <div v-if="!openExceptions.length" class="text-sm text-slate-400">
            暂无
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
const auth = useAuthStore();
const api = useApi();

const stats = ref<any>({});
const recentPurchases = ref<any[]>([]);
const openExceptions = ref<any[]>([]);

onMounted(async () => {
  if (!auth.canViewDashboard) {
    navigateTo(auth.defaultRoute);
    return;
  }
  const [s, p, e] = await Promise.all([
    api("/review/dashboard"),
    api("/purchases"),
    api("/exceptions?status=待处理"),
  ]);
  stats.value = s;
  recentPurchases.value = (p as any[]).slice(0, 6);
  openExceptions.value = (e as any[]).slice(0, 6);
});

function pct(v: any) {
  return `${(Number(v) * 100).toFixed(1)}%`;
}
function typeColor(t: string) {
  return t === "损耗"
    ? "tag-red"
    : t === "客诉"
      ? "tag-amber"
      : t === "赔付"
        ? "tag-blue"
        : "tag-slate";
}
function statusColor(s: string) {
  return s === "已处理"
    ? "tag-green"
    : s === "处理中"
      ? "tag-amber"
      : "tag-red";
}
</script>
