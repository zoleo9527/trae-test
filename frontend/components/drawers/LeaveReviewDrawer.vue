<template>
  <div class="space-y-4">
    <div v-if="payload?.leave" class="space-y-2">
      <div class="text-sm text-gray-500">申请人</div>
      <div class="text-base font-medium">{{ coachName }}</div>

      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <div class="text-sm text-gray-500">请假类型</div>
          <div>{{ leaveTypeLabel(payload.leave.type) }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">时间段</div>
          <div>
            {{ payload.leave.start_date }} ~ {{ payload.leave.end_date }}
          </div>
        </div>
      </div>
      <div>
        <div class="text-sm text-gray-500">请假原因</div>
        <div class="mt-1 text-sm bg-gray-50 p-3 rounded">
          {{ payload.leave.reason }}
        </div>
      </div>
      <div v-if="payload.leave.substitute_coach_id">
        <div class="text-sm text-gray-500">建议顶替教练</div>
        <div>{{ substituteName }}</div>
      </div>
      <div v-if="payload.leave.review_note">
        <div class="text-sm text-gray-500">历史审核意见</div>
        <div class="text-sm bg-gray-50 p-3 rounded">
          {{ payload.leave.review_note }}
        </div>
      </div>
    </div>

    <div class="pt-3 border-t border-gray-100">
      <label class="block text-sm text-gray-600 mb-2">审核结果</label>
      <div class="flex gap-2">
        <button
          class="btn-primary flex-1"
          :disabled="loading"
          @click="submit('approved')"
        >
          通过
        </button>
        <button
          class="btn-danger flex-1"
          :disabled="loading"
          @click="submit('rejected')"
        >
          驳回
        </button>
      </div>
    </div>
    <div>
      <label class="block text-sm text-gray-600 mb-2">审核备注</label>
      <textarea
        v-model="note"
        rows="3"
        class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
        placeholder="例如：课程冲突，请改期；或 同意请假，已安排顶替。"
      ></textarea>
    </div>
    <div v-if="error" class="text-sm text-rose-600">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import type { LeaveRequest, Coach } from "~/types";

const drawer = useDrawerStore();
const payload = computed(
  () => drawer.payload as { leave: LeaveRequest } | undefined,
);
const loading = ref(false);
const error = ref("");
const note = ref("");

const { data: coaches } = await useApi<Coach[]>("/coaches");
const coachName = computed(
  () =>
    coaches.value?.find((c) => c.id === payload.value?.leave.coach_id)?.name ||
    "-",
);
const substituteName = computed(
  () =>
    coaches.value?.find(
      (c) => c.id === payload.value?.leave.substitute_coach_id,
    )?.name || "-",
);

function leaveTypeLabel(t: string) {
  const map: Record<string, string> = {
    annual: "年假",
    sick: "病假",
    personal: "事假",
    other: "其他",
  };
  return map[t] || t;
}

async function submit(status: "approved" | "rejected") {
  if (!payload.value?.leave) return;
  loading.value = true;
  error.value = "";
  try {
    await apiPost(`/leaves/${payload.value.leave.id}/review`, {
      status,
      reviewer: "馆长",
      review_note: note.value || undefined,
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
