<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">水质巡检</h1>
        <p class="text-sm text-gray-500 mt-1">
          记录巡检数据，异常项自动进入整改流程
        </p>
      </div>
      <button class="btn-primary" @click="newInspection">新巡检</button>
    </div>

    <div class="card">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-100">
            <th class="py-2">泳池</th>
            <th class="py-2">巡检人</th>
            <th class="py-2">时间</th>
            <th class="py-2">读数</th>
            <th class="py-2">状态</th>
            <th class="py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="i in items" :key="i.id" class="border-b border-gray-50">
            <td class="py-2">{{ i.pool_name }}</td>
            <td class="py-2">{{ i.inspector }}</td>
            <td class="py-2">{{ formatTime(i.inspected_at) }}</td>
            <td class="py-2">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="r in i.readings"
                  :key="r.item"
                  class="text-xs px-2 py-0.5 rounded"
                  :class="
                    r.is_abnormal
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-700'
                  "
                >
                  {{ r.item }} {{ r.value }}{{ r.unit }}
                </span>
              </div>
            </td>
            <td class="py-2">
              <span :class="statusChip(i.status)">{{
                statusLabel(i.status)
              }}</span>
            </td>
            <td class="py-2 text-right space-x-1">
              <button
                v-if="i.status === 'abnormal'"
                class="btn-ghost"
                @click="rectify(i)"
              >
                创建整改
              </button>
              <button
                v-if="i.rectification_id"
                class="btn-ghost"
                @click="goRectify"
              >
                查看整改
              </button>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="6" class="py-6 text-center text-gray-400">
              暂无巡检记录
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WaterInspection } from "~/types";

const drawer = useDrawerStore();
const router = useRouter();

const { data: inspections, refresh } =
  await useApi<WaterInspection[]>("/inspections");
const items = computed(() => inspections.value || []);

function statusChip(s: string) {
  const map: Record<string, string> = {
    pending: "chip-pending",
    recorded: "chip-approved",
    abnormal: "chip-abnormal",
    rectifying: "chip-rectifying",
    recheck_pending: "chip-recheck",
    recheck_passed: "chip-passed",
    closed: "chip-closed",
  };
  return map[s] || "chip-open";
}
function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: "待录",
    recorded: "已记录",
    abnormal: "异常",
    rectifying: "整改中",
    recheck_pending: "待回查",
    recheck_passed: "回查通过",
    closed: "已关闭",
  };
  return map[s] || s;
}
function formatTime(t: string) {
  return new Date(t).toLocaleString("zh-CN");
}
function newInspection() {
  drawer.openDrawer("inspection", "新水质巡检");
}
function rectify(i: WaterInspection) {
  drawer.openDrawer("rectification", "创建整改", { inspection: i });
}
function goRectify() {
  router.push("/rectifications");
}
</script>
