<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm text-gray-600 mb-1">泳池</label>
      <input
        v-model="form.pool_name"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
      />
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">巡检人</label>
      <input
        v-model="form.inspector"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
      />
    </div>

    <div>
      <label class="block text-sm text-gray-600 mb-2">水质读数</label>
      <div class="space-y-2">
        <div
          v-for="(r, i) in form.readings"
          :key="i"
          class="grid grid-cols-12 gap-2 items-center"
        >
          <div class="col-span-3 text-sm text-gray-700">{{ r.item }}</div>
          <input
            v-model.number="r.value"
            type="number"
            step="0.01"
            class="col-span-3 border border-gray-200 rounded px-2 py-1 text-sm"
          />
          <div class="col-span-3 text-xs text-gray-500">
            范围：{{ r.normal_range }}
          </div>
          <label class="col-span-3 flex items-center gap-1 text-xs">
            <input type="checkbox" v-model="r.is_abnormal" />
            <span>异常</span>
          </label>
        </div>
      </div>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">备注</label>
      <textarea
        v-model="form.remark"
        rows="2"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
      ></textarea>
    </div>
    <div v-if="error" class="text-sm text-rose-600">{{ error }}</div>
    <button class="btn-primary w-full" :disabled="loading" @click="submit">
      提交巡检
    </button>
  </div>
</template>

<script setup lang="ts">
import type { WaterReading } from "~/types";

const drawer = useDrawerStore();
const loading = ref(false);
const error = ref("");

const defaultReadings: WaterReading[] = [
  {
    item: "pH",
    value: 7.4,
    unit: "",
    normal_range: "6.8-8.2",
    is_abnormal: false,
  },
  {
    item: "余氯",
    value: 0.4,
    unit: "mg/L",
    normal_range: "0.3-0.5",
    is_abnormal: false,
  },
  {
    item: "浊度",
    value: 0.6,
    unit: "NTU",
    normal_range: "≤1.0",
    is_abnormal: false,
  },
  {
    item: "水温",
    value: 26.5,
    unit: "℃",
    normal_range: "25-28",
    is_abnormal: false,
  },
];

const form = reactive({
  pool_name: "主泳池",
  inspector: "",
  readings: defaultReadings.map((r) => ({ ...r })),
  photo_urls: [] as string[],
  remark: "",
});

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    await apiPost("/inspections", form);
    drawer.closeDrawer();
    await refreshNuxtData();
  } catch (e: any) {
    error.value = e?.data?.detail || "提交失败";
  } finally {
    loading.value = false;
  }
}
</script>
