<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">分级记录</h1>
    </div>

    <div class="card overflow-hidden">
      <table class="fruit">
        <thead>
          <tr>
            <th>进货单</th>
            <th>果品</th>
            <th>等级</th>
            <th>重量</th>
            <th>占比</th>
            <th>备注</th>
            <th>时间</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in list" :key="g.id">
            <td class="font-mono text-xs">{{ g.code }}</td>
            <td>{{ g.product_name }}</td>
            <td>
              <span :class="color(g.grade)" class="tag">{{ g.grade }}</span>
            </td>
            <td>{{ g.weight_kg }} 斤</td>
            <td>{{ (g.ratio * 100).toFixed(1) }}%</td>
            <td class="text-xs text-slate-500">{{ g.remark }}</td>
            <td class="text-xs">{{ g.created_at }}</td>
            <td>
              <button
                class="text-brand-600 hover:underline"
                @click="$router.push(`/purchases/${g.purchase_id}`)"
              >
                关联进货单
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
const list = ref<any[]>([]);

onMounted(async () => {
  const rows = (await api("/gradings")) as any[];
  const purchases = (await api("/purchases")) as any[];
  const pmap = new Map(purchases.map((p: any) => [p.id, p]));
  list.value = rows.map((g: any) => ({
    ...g,
    code: pmap.get(g.purchase_id)?.code,
    product_name: pmap.get(g.purchase_id)?.product_name,
  }));
});

function color(g: string) {
  return g === "A"
    ? "tag-green"
    : g === "B"
      ? "tag-blue"
      : g === "C"
        ? "tag-slate"
        : "tag-red";
}
</script>
