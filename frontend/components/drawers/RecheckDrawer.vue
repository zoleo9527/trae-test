<template>
  <div class="space-y-4">
    <div v-if="payload?.rectification" class="bg-gray-50 p-3 rounded space-y-1">
      <div class="text-sm text-gray-500">整改任务</div>
      <div class="font-medium">{{ payload.rectification.issue_summary }}</div>
      <div class="text-xs text-gray-500">
        负责人：{{ payload.rectification.owner }}
      </div>
    </div>

    <div>
      <label class="block text-sm text-gray-600 mb-1">回查人</label>
      <input
        v-model="form.rechecker"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        placeholder="如：张教练"
      />
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">复测读数（可选）</label>
      <div
        class="border border-dashed border-gray-200 rounded p-2 text-xs text-gray-500"
      >
        此处演示中未做动态表单；可在下方结论中直接记录读数。
      </div>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">回查结论</label>
      <textarea
        v-model="form.conclusion"
        rows="3"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        placeholder="如：加氯后余氯恢复至0.4mg/L，水质正常，整改通过。"
      ></textarea>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">结果</label>
      <div class="flex gap-2">
        <button
          class="btn-primary flex-1"
          :disabled="loading"
          @click="submit('passed')"
        >
          通过
        </button>
        <button
          class="btn-danger flex-1"
          :disabled="loading"
          @click="submit('failed')"
        >
          不通过
        </button>
      </div>
    </div>
    <div v-if="error" class="text-sm text-rose-600">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import type { Rectification } from "~/types";

const drawer = useDrawerStore();
const payload = computed(
  () => drawer.payload as { rectification: Rectification } | undefined,
);
const loading = ref(false);
const error = ref("");
const form = reactive({
  rectification_id: payload.value?.rectification.id || "",
  rechecker: "",
  conclusion: "",
});

async function submit(status: "passed" | "failed") {
  loading.value = true;
  error.value = "";
  try {
    await apiPost("/rechecks", {
      ...form,
      status,
      readings: [],
      photo_urls: [],
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
