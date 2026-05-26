<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm text-gray-600 mb-1">请假教练</label>
      <select
        v-model="form.coach_id"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
      >
        <option v-for="c in coaches" :key="c.id" :value="c.id">
          {{ c.name }} · {{ c.title }}
        </option>
      </select>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm text-gray-600 mb-1">类型</label>
        <select
          v-model="form.type"
          class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        >
          <option value="annual">年假</option>
          <option value="sick">病假</option>
          <option value="personal">事假</option>
          <option value="other">其他</option>
        </select>
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">顶替教练</label>
        <select
          v-model="form.substitute_coach_id"
          class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        >
          <option value="">-- 请选择 --</option>
          <option v-for="c in coaches" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm text-gray-600 mb-1">开始日期</label>
        <input
          v-model="form.start_date"
          type="date"
          class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label class="block text-sm text-gray-600 mb-1">结束日期</label>
        <input
          v-model="form.end_date"
          type="date"
          class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
      </div>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-1">原因</label>
      <textarea
        v-model="form.reason"
        rows="3"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
      ></textarea>
    </div>
    <div v-if="error" class="text-sm text-rose-600">{{ error }}</div>
    <button class="btn-primary w-full" :disabled="loading" @click="submit">
      提交申请
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Coach } from "~/types";

const drawer = useDrawerStore();
const { data: coaches } = await useApi<Coach[]>("/coaches");
const loading = ref(false);
const error = ref("");
const today = new Date().toISOString().slice(0, 10);
const form = reactive({
  coach_id: "",
  type: "sick" as "annual" | "sick" | "personal" | "other",
  start_date: today,
  end_date: today,
  reason: "",
  substitute_coach_id: "" as string,
});

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const payload: Record<string, unknown> = { ...form };
    if (!form.substitute_coach_id) delete payload.substitute_coach_id;
    await apiPost("/leaves", payload);
    drawer.closeDrawer();
    await refreshNuxtData();
  } catch (e: any) {
    error.value = e?.data?.detail || "提交失败";
  } finally {
    loading.value = false;
  }
}
</script>
