<template>
  <div class="card">
    <div class="text-sm font-semibold text-gray-800 mb-3">最近动态</div>
    <ul class="divide-y divide-gray-100">
      <li
        v-for="a in activities"
        :key="a.id"
        class="py-2.5 flex items-center gap-3"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium"
          :class="kindStyle(a.kind).bg + ' ' + kindStyle(a.kind).text"
        >
          {{ kindStyle(a.kind).label }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-800 truncate">{{ a.title }}</span>
            <span :class="statusChip(a.status)">{{
              statusLabel(a.status)
            }}</span>
          </div>
          <div class="text-xs text-gray-400 mt-0.5">
            {{ formatTime(a.time) }}
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { ActivityItem } from "~/types";

defineProps<{ activities: ActivityItem[] }>();

function kindStyle(kind: string) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    leave: { label: "假", bg: "bg-amber-50", text: "text-amber-700" },
    inspection: { label: "检", bg: "bg-sky-50", text: "text-sky-700" },
    rectification: { label: "整", bg: "bg-violet-50", text: "text-violet-700" },
    recheck: { label: "回", bg: "bg-emerald-50", text: "text-emerald-700" },
    complaint: { label: "诉", bg: "bg-rose-50", text: "text-rose-700" },
    course: { label: "课", bg: "bg-brand-50", text: "text-brand-700" },
  };
  return map[kind] || { label: "·", bg: "bg-gray-50", text: "text-gray-700" };
}

function statusChip(status: string) {
  const map: Record<string, string> = {
    pending: "chip-pending",
    approved: "chip-approved",
    rejected: "chip-rejected",
    abnormal: "chip-abnormal",
    rectifying: "chip-rectifying",
    recheck_pending: "chip-recheck",
    recheck_passed: "chip-passed",
    passed: "chip-passed",
    failed: "chip-failed",
    recorded: "chip-approved",
    open: "chip-open",
    processing: "chip-pending",
    closed: "chip-closed",
  };
  return map[status] || "chip-open";
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    approved: "已通过",
    rejected: "已驳回",
    abnormal: "异常",
    rectifying: "整改中",
    recheck_pending: "待回查",
    recheck_passed: "回查通过",
    passed: "通过",
    failed: "未通过",
    recorded: "已记录",
    open: "开放",
    processing: "处理中",
    closed: "已关闭",
  };
  return map[s] || s;
}

function formatTime(t: string) {
  return new Date(t).toLocaleString("zh-CN");
}
</script>
