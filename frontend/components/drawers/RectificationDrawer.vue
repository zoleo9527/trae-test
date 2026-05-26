<template>
  <div class="space-y-4">
    <div v-if="payload?.inspection" class="bg-gray-50 p-3 rounded space-y-1">
      <div class="text-sm text-gray-500">关联巡检</div>
      <div class="font-medium">
        {{ payload.inspection.pool_name }} · {{ payload.inspection.inspector }}
      </div>
      <div class="text-xs text-gray-500">
        {{ formatTime(payload.inspection.inspected_at) }}
      </div>
    </div>

    <div>
      <label class="block text-sm text-gray-600 mb-1">整改负责人</label>
      <input
        v-model="form.owner"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        placeholder="如：李教练"
      />
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">问题概述</label>
      <textarea
        v-model="form.issue_summary"
        rows="2"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        placeholder="如：余氯偏低(0.2mg/L)，低于标准下限"
      ></textarea>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1"
        >整改措施（每行一条）</label
      >
      <textarea
        v-model="measuresText"
        rows="3"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        placeholder="加氯片10片&#10;循环2小时&#10;30分钟后复测"
      ></textarea>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">完成期限</label>
      <input
        v-model="form.due_date"
        type="date"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
      />
    </div>

    <div v-if="error" class="text-sm text-rose-600">{{ error }}</div>
    <button class="btn-primary w-full" :disabled="loading" @click="submit">
      创建整改
    </button>
  </div>
</template>

<script setup lang="ts">
import type { WaterInspection } from "~/types";

const drawer = useDrawerStore();
const payload = computed(
  () => drawer.payload as { inspection: WaterInspection } | undefined,
);
const loading = ref(false);
const error = ref("");
const today = new Date().toISOString().slice(0, 10);
const measuresText = ref("");
const form = reactive({
  inspection_id: payload.value?.inspection.id || "",
  owner: "",
  issue_summary: payload.value?.inspection.remark || "",
  due_date: today,
});

function formatTime(t: string) {
  return new Date(t).toLocaleString("zh-CN");
}

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    await apiPost(`/inspections/${form.inspection_id}/rectify`, {
      ...form,
      measures: measuresText.value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    drawer.closeDrawer();
    await refreshNuxtData();
  } catch (e: any) {
    error.value = e?.data?.detail || "提交失败";
  } finally {
    loading.value = false;
  }
}
</script>
