<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">投诉回看</h1>
        <p class="text-sm text-gray-500 mt-1">每条投诉留痕，避免"没有这回事"</p>
      </div>
    </div>

    <div class="card">
      <ul class="divide-y divide-gray-100">
        <li v-for="c in items" :key="c.id" class="py-3">
          <div class="flex items-center justify-between">
            <div class="font-medium text-gray-800">{{ c.title }}</div>
            <span :class="statusChip(c.status)">{{
              statusLabel(c.status)
            }}</span>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            处理人：{{ c.handler || "-" }} · {{ formatTime(c.created_at) }}
          </div>
          <div class="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded">
            {{ c.content }}
          </div>
        </li>
        <li v-if="items.length === 0" class="py-6 text-center text-gray-400">
          暂无投诉
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Complaint } from "~/types";

const { data: complaints } = await useApi<Complaint[]>("/complaints");
const items = computed(() => complaints.value || []);

function statusChip(s: string) {
  const map: Record<string, string> = {
    open: "chip-open",
    processing: "chip-pending",
    closed: "chip-closed",
  };
  return map[s] || "chip-open";
}
function statusLabel(s: string) {
  const map: Record<string, string> = {
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
