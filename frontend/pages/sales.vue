<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">赊销结算</h1>
      <div class="flex gap-2">
        <label class="flex items-center gap-1 text-sm text-slate-600">
          <input type="checkbox" v-model="overdueOnly" /> 只看逾期
        </label>
        <select v-model="filterStatus" class="input w-32">
          <option value="">全部</option>
          <option>赊销中</option>
          <option>部分回款</option>
          <option>已结清</option>
          <option>逾期</option>
        </select>
      </div>
    </div>

    <div class="card p-3 mb-3 flex gap-4 text-sm">
      <div>
        未结赊销总额：<b class="text-rose-600"
          >¥{{ totalBalance.toFixed(0) }}</b
        >
      </div>
      <div>
        逾期单数：<b class="text-rose-600">{{ overdueCount }}</b>
      </div>
      <div>
        已结清单数：<b class="text-emerald-600">{{ settledCount }}</b>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="fruit">
        <thead>
          <tr>
            <th>赊销单号</th>
            <th>客户</th>
            <th>关联配货</th>
            <th>金额</th>
            <th>已回款</th>
            <th>未结</th>
            <th>到期</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id">
            <td class="font-mono text-xs">XS{{ s.id }}</td>
            <td>{{ s.customer_name }}</td>
            <td class="text-xs">#{{ s.allocation_id }}</td>
            <td>¥{{ s.total_amount?.toFixed(0) }}</td>
            <td>¥{{ s.paid_amount?.toFixed(0) }}</td>
            <td class="text-rose-600">¥{{ s.balance?.toFixed(0) }}</td>
            <td class="text-xs">{{ s.due_date }}</td>
            <td>
              <span :class="statusColor(s.status)" class="tag">{{
                s.status
              }}</span>
            </td>
            <td class="space-x-2 text-xs">
              <button
                v-if="auth.canManagePayments && s.balance > 0"
                class="text-brand-600 hover:underline"
                @click="openPay(s)"
              >
                登记回款
              </button>
              <button
                class="text-slate-500 hover:underline"
                @click="
                  $router.push(`/purchases/${purchaseOf(s.allocation_id)}`)
                "
              >
                回查
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showPay"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div class="card w-[400px] p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold">登记回款</div>
          <button class="btn-ghost" @click="showPay = false">×</button>
        </div>
        <div class="text-sm mb-2">
          未结余额：<b class="text-rose-600"
            >¥{{ current?.balance?.toFixed(2) }}</b
          >
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">金额</label
            ><input v-model="form.amount" type="number" class="input" />
          </div>
          <div>
            <label class="label">方式</label>
            <select v-model="form.method" class="input">
              <option>现金</option>
              <option>微信</option>
              <option>转账</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="label">备注</label
            ><input v-model="form.remark" class="input" />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="btn-ghost" @click="showPay = false">取消</button>
          <button class="btn-primary" @click="submitPay">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
const auth = useAuthStore();
const api = useApi();
const all = ref<any[]>([]);
const allocations = ref<any[]>([]);
const filterStatus = ref("");
const overdueOnly = ref(false);
const showPay = ref(false);
const current = ref<any>(null);
const form = reactive({ amount: 0, method: "现金", remark: "" });

const filtered = computed(() => {
  return all.value.filter((s: any) => {
    if (overdueOnly.value && s.status !== "逾期") return false;
    if (filterStatus.value && s.status !== filterStatus.value) return false;
    return true;
  });
});
const totalBalance = computed(() =>
  filtered.value.reduce((s: number, x: any) => s + Number(x.balance || 0), 0),
);
const overdueCount = computed(
  () => all.value.filter((s: any) => s.status === "逾期").length,
);
const settledCount = computed(
  () => all.value.filter((s: any) => s.status === "已结清").length,
);

onMounted(async () => {
  all.value = (await api("/sales")) as any[];
  allocations.value = (await api("/allocations")) as any[];
});

function purchaseOf(allocId: number) {
  return allocations.value.find((a: any) => a.id === allocId)?.purchase_id;
}

function openPay(s: any) {
  current.value = s;
  form.amount = s.balance;
  form.remark = "";
  showPay.value = true;
}

async function submitPay() {
  if (!form.amount) return;
  try {
    await api(`/sales/${current.value.id}/pay`, { method: "POST", body: form });
    showPay.value = false;
    all.value = (await api("/sales")) as any[];
  } catch (e: any) {
    alert(e?.data?.detail || "保存失败");
  }
}

function statusColor(s: string) {
  return s === "已结清"
    ? "tag-green"
    : s === "逾期"
      ? "tag-red"
      : s === "部分回款"
        ? "tag-blue"
        : "tag-amber";
}
</script>
