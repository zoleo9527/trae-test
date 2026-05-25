<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">进货单（过磅）</h1>
      <div class="flex gap-2">
        <input
          v-model="keyword"
          class="input w-64"
          placeholder="单号/果品/供应商"
        />
        <button class="btn-primary" @click="showCreate = true">
          新建进货单
        </button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="fruit">
        <thead>
          <tr>
            <th>单号</th>
            <th>供应商</th>
            <th>果品</th>
            <th>净重</th>
            <th>单价</th>
            <th>总金额</th>
            <th>冷库位</th>
            <th>分级</th>
            <th>配货</th>
            <th>损耗</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in list" :key="p.id">
            <td class="font-mono text-xs">{{ p.code }}</td>
            <td>{{ p.supplier_name }}</td>
            <td>{{ p.product_name }}</td>
            <td>{{ p.net_kg }} 斤</td>
            <td>¥{{ p.unit_price }}/斤</td>
            <td>¥{{ p.total_amount?.toFixed(0) }}</td>
            <td>{{ p.warehouse_in }}</td>
            <td>
              <span v-if="p.graded_kg" class="tag-green"
                >{{ p.graded_kg.toFixed(0) }} 斤</span
              ><span v-else class="tag-slate">未分级</span>
            </td>
            <td>
              <span v-if="p.allocated_kg" class="tag-blue"
                >{{ p.allocated_kg.toFixed(0) }} 斤</span
              ><span v-else>-</span>
            </td>
            <td>
              <span v-if="p.loss_kg" class="tag-red"
                >{{ p.loss_kg.toFixed(0) }} 斤</span
              ><span v-else>-</span>
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

    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div class="card w-[520px] p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold">新建进货单</div>
          <button class="btn-ghost" @click="showCreate = false">×</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">供应商</label>
            <select v-model="form.supplier_id" class="input">
              <option v-for="s in suppliers" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">果品</label>
            <select v-model="form.product_id" class="input">
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="label">毛重(斤)</label
            ><input v-model="form.gross_kg" type="number" class="input" />
          </div>
          <div>
            <label class="label">皮重(斤)</label
            ><input v-model="form.tare_kg" type="number" class="input" />
          </div>
          <div>
            <label class="label">单价(元/斤)</label
            ><input
              v-model="form.unit_price"
              type="number"
              step="0.1"
              class="input"
            />
          </div>
          <div>
            <label class="label">车牌号</label
            ><input v-model="form.truck_no" class="input" />
          </div>
          <div class="col-span-2">
            <label class="label">冷库位</label
            ><input v-model="form.warehouse_in" class="input" />
          </div>
          <div class="col-span-2">
            <label class="label">备注</label
            ><textarea v-model="form.remark" class="input" rows="2"></textarea>
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="btn-ghost" @click="showCreate = false">取消</button>
          <button class="btn-primary" @click="create">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
const api = useApi();
const keyword = ref("");
const list = ref<any[]>([]);
const suppliers = ref<any[]>([]);
const products = ref<any[]>([]);
const showCreate = ref(false);
const form = reactive({
  supplier_id: 0,
  product_id: 0,
  gross_kg: 0,
  tare_kg: 0,
  unit_price: 0,
  truck_no: "",
  warehouse_in: "",
  remark: "",
});

async function load() {
  const url = keyword.value
    ? `/purchases?keyword=${encodeURIComponent(keyword.value)}`
    : "/purchases";
  list.value = (await api(url)) as any[];
}

onMounted(async () => {
  suppliers.value = (await api("/base/suppliers")) as any[];
  products.value = (await api("/base/products")) as any[];
  if (suppliers.value[0]) form.supplier_id = suppliers.value[0].id;
  if (products.value[0]) form.product_id = products.value[0].id;
  load();
});

watch(keyword, () => load());

async function create() {
  if (!form.supplier_id || !form.product_id) return alert("请选择供应商和果品");
  try {
    await api("/purchases", { method: "POST", body: form });
    showCreate.value = false;
    Object.assign(form, { truck_no: "", warehouse_in: "", remark: "" });
    load();
  } catch (e: any) {
    alert(e?.data?.detail || "保存失败");
  }
}
</script>
