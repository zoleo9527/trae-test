<template>
  <div class="grid grid-cols-7 gap-3">
    <div v-for="item in items" :key="item.label" class="stat">
      <div class="stat-label">{{ item.label }}</div>
      <div class="flex items-end justify-between mt-1">
        <div class="stat-value" :class="item.color">{{ item.value }}</div>
        <div class="text-xs text-gray-400">{{ item.unit }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardStats } from "~/types";

interface StatItem {
  label: string;
  value: number;
  unit: string;
  color: string;
}

const props = defineProps<{ stats: DashboardStats }>();
const items = computed<StatItem[]>(() => [
  {
    label: "待处理请假",
    value: props.stats.pending_leaves,
    unit: "条",
    color: "text-amber-600",
  },
  {
    label: "已驳回请假",
    value: props.stats.rejected_leaves,
    unit: "条",
    color: "text-rose-600",
  },
  {
    label: "需回查",
    value: props.stats.recheck_pending,
    unit: "条",
    color: "text-violet-600",
  },
  {
    label: "异常水质",
    value: props.stats.abnormal_inspections,
    unit: "次",
    color: "text-orange-600",
  },
  {
    label: "今日课程",
    value: props.stats.today_courses,
    unit: "节",
    color: "text-brand-600",
  },
  {
    label: "进行中投诉",
    value: props.stats.open_complaints,
    unit: "条",
    color: "text-gray-700",
  },
  {
    label: "待关闭整改",
    value: props.stats.pending_rectifications,
    unit: "条",
    color: "text-sky-600",
  },
]);
</script>
