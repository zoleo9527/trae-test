<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">请假与消课</h1>
        <p class="text-sm text-gray-500 mt-1">
          请假审批与消课留痕，避免前后台各说各话
        </p>
      </div>
      <button class="btn-primary" @click="newLeave">新请假申请</button>
    </div>

    <div class="card">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-100">
            <th class="py-2">申请人</th>
            <th class="py-2">类型</th>
            <th class="py-2">时间段</th>
            <th class="py-2">原因</th>
            <th class="py-2">顶替</th>
            <th class="py-2">状态</th>
            <th class="py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lv in items" :key="lv.id" class="border-b border-gray-50">
            <td class="py-2">{{ coachName(lv.coach_id) }}</td>
            <td class="py-2">{{ leaveType(lv.type) }}</td>
            <td class="py-2">{{ lv.start_date }} ~ {{ lv.end_date }}</td>
            <td class="py-2 max-w-xs truncate" :title="lv.reason">
              {{ lv.reason }}
            </td>
            <td class="py-2">
              {{
                lv.substitute_coach_id ? coachName(lv.substitute_coach_id) : "-"
              }}
            </td>
            <td class="py-2">
              <span :class="statusChip(lv.status)">{{
                statusLabel(lv.status)
              }}</span>
            </td>
            <td class="py-2 text-right">
              <button
                v-if="lv.status === 'pending'"
                class="btn-ghost"
                @click="review(lv)"
              >
                审核
              </button>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="7" class="py-6 text-center text-gray-400">暂无请假</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LeaveRequest, Coach } from "~/types";

const drawer = useDrawerStore();
const { data: leaves, refresh } = await useApi<LeaveRequest[]>("/leaves");
const { data: coaches } = await useApi<Coach[]>("/coaches");
const items = computed(() => leaves.value || []);

function coachName(id: string) {
  return coaches.value?.find((c) => c.id === id)?.name || "-";
}
function leaveType(t: string) {
  const map: Record<string, string> = {
    annual: "年假",
    sick: "病假",
    personal: "事假",
    other: "其他",
  };
  return map[t] || t;
}
function statusChip(s: string) {
  const map: Record<string, string> = {
    pending: "chip-pending",
    approved: "chip-approved",
    rejected: "chip-rejected",
  };
  return map[s] || "chip-open";
}
function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: "待审核",
    approved: "已通过",
    rejected: "已驳回",
  };
  return map[s] || s;
}
function review(lv: LeaveRequest) {
  drawer.openDrawer("leave-review", "请假审核", { leave: lv });
  setTimeout(() => refresh(), 300);
}
function newLeave() {
  drawer.openDrawer("leave-create", "新请假申请");
}
</script>
