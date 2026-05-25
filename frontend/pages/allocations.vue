<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">档口配货</h1>
      <div class="flex gap-2">
        <select v-model="filterStatus" class="input w-32">
          <option value="">全部状态</option>
          <option>待提货</option>
          <option>已提货</option>
          <option>已退货</option>
        </select>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="fruit">
        <thead>
          <tr>
            <th>进货单</th>
            <th>客户</th>
            <th>档口</th>
            <th>等级</th>
            <th>数量</th>
            <th>单价</th>
            <th>金额</th>
            <th>状态</th>
            <th>配货员</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in list" :key="a.id">
            <td class="font-mono text-xs">{{ a.purchase_code }}</td>
            <td>{{ a.customer_name }}</td>
            <td>{{ a.customer_stall }}</td>
            <td>
              <span :class="gradeColor(a.grade)" class="tag">{{
                a.grade
              }}</span>
            </td>
            <td>{{ a.qty_kg }} 斤</td>
            <td>¥{{ a.unit_price }}</td>
            <td>¥{{ a.total_amount?.toFixed(0) }}</td>
            <td>
              <span :class="statusColor(a.status)" class="tag">{{
                a.status
              }}</span>
            </td>
            <td>{{ a.operator }}</td>
            <td>
              <button
                class="text-brand-600 hover:underline"
                @click="$router.push(`/purchases/${a.purchase_id}`)"
              >
                回查
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
const api = useApi();
const all = ref<any[]>([]);
const filterStatus = ref("");
const list = computed(() =>
  filterStatus.value
    ? all.value.filter((a: any) => a.status === filterStatus.value)
    : all.value,
);

onMounted(async () => {
  all.value = (await api("/allocations")) as any[];
});

function gradeColor(g: string) {
  return g === "A"
    ? "tag-green"
    : g === "B"
      ? "tag-blue"
      : g === "C"
        ? "tag-slate"
        : "tag-red";
}
function statusColor(s: string) {
  return s === "已提货"
    ? "tag-green"
    : s === "已退货"
      ? "tag-red"
      : "tag-amber";
}
</script>
