<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">整改与回查</h1>
        <p class="text-sm text-gray-500 mt-1">巡检异常后的整改与回查闭环</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <div class="card">
        <div class="text-sm font-semibold text-gray-800 mb-3">整改任务</div>
        <ul class="space-y-3">
          <li
            v-for="r in rects"
            :key="r.id"
            class="border border-gray-100 rounded-lg p-3"
          >
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-gray-800">
                {{ r.issue_summary }}
              </div>
              <span :class="statusChip(r.status)">{{
                statusLabel(r.status)
              }}</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              负责人：{{ r.owner }} · 截止：{{ r.due_date || "-" }}
            </div>
            <ul
              class="list-disc list-inside text-xs text-gray-600 mt-2 space-y-0.5"
            >
              <li v-for="(m, i) in r.measures" :key="i">{{ m }}</li>
            </ul>
            <div class="mt-2 flex gap-2">
              <button
                v-if="r.status === 'rectifying'"
                class="btn-ghost"
                @click="submitRect(r)"
              >
                提交待回查
              </button>
              <button
                v-if="r.status === 'recheck_pending'"
                class="btn-ghost"
                @click="recheck(r)"
              >
                回查
              </button>
            </div>
          </li>
          <li
            v-if="rects.length === 0"
            class="text-xs text-gray-400 py-4 text-center"
          >
            暂无整改任务
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="text-sm font-semibold text-gray-800 mb-3">回查记录</div>
        <ul class="space-y-3">
          <li
            v-for="r in rechecks"
            :key="r.id"
            class="border border-gray-100 rounded-lg p-3"
          >
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-gray-800">
                整改 {{ r.rectification_id.slice(0, 6) }}
              </div>
              <span
                :class="
                  r.status === 'passed'
                    ? 'chip-passed'
                    : r.status === 'failed'
                      ? 'chip-failed'
                      : 'chip-recheck'
                "
              >
                {{
                  r.status === "passed"
                    ? "通过"
                    : r.status === "failed"
                      ? "未通过"
                      : "待回查"
                }}
              </span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              回查人：{{ r.rechecker }}
            </div>
            <div
              v-if="r.conclusion"
              class="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded"
            >
              {{ r.conclusion }}
            </div>
          </li>
          <li
            v-if="rechecks.length === 0"
            class="text-xs text-gray-400 py-4 text-center"
          >
            暂无回查记录
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Rectification, Recheck } from "~/types";

const drawer = useDrawerStore();
const { data: rects, refresh: refreshRects } =
  await useApi<Rectification[]>("/rectifications");
const { data: rechecks, refresh: refreshRechecks } =
  await useApi<Recheck[]>("/rechecks");

function statusChip(s: string) {
  const map: Record<string, string> = {
    rectifying: "chip-rectifying",
    recheck_pending: "chip-recheck",
    closed: "chip-closed",
  };
  return map[s] || "chip-open";
}
function statusLabel(s: string) {
  const map: Record<string, string> = {
    rectifying: "整改中",
    recheck_pending: "待回查",
    closed: "已关闭",
  };
  return map[s] || s;
}

async function submitRect(r: Rectification) {
  await apiPost(`/rectifications/${r.id}/submit`, {});
  refreshRects();
}
function recheck(r: Rectification) {
  drawer.openDrawer("recheck", "整改回查", { rectification: r });
  setTimeout(() => refreshRechecks(), 300);
}
</script>
