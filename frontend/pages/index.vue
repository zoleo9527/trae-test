<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">首页总览</h1>
        <p class="text-sm text-gray-500 mt-1">
          今日待处理、已驳回、需回查一眼可见
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-ghost" @click="refresh">刷新</button>
        <button class="btn-primary" @click="openInspection">新水质巡检</button>
      </div>
    </div>

    <StatsGrid v-if="data" :stats="data.stats" />

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-2 space-y-4">
        <ActivityFeed v-if="data" :activities="data.activities" />
      </div>
      <div class="space-y-4">
        <div class="card">
          <div class="text-sm font-semibold text-gray-800 mb-3">待处理</div>
          <ul class="space-y-2">
            <li
              v-for="lv in pendingLeaves"
              :key="lv.id"
              class="flex items-center justify-between text-sm"
            >
              <div>
                <div class="text-gray-800">
                  {{ coachName(lv.coach_id) }} · {{ leaveType(lv.type) }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ lv.start_date }} ~ {{ lv.end_date }}
                </div>
              </div>
              <button class="btn-ghost" @click="reviewLeave(lv)">审核</button>
            </li>
            <li v-if="pendingLeaves.length === 0" class="text-xs text-gray-400">
              暂无待处理请假
            </li>
          </ul>
        </div>

        <div class="card">
          <div class="text-sm font-semibold text-gray-800 mb-3">需回查</div>
          <ul class="space-y-2">
            <li
              v-for="r in recheckPending"
              :key="r.id"
              class="flex items-center justify-between text-sm"
            >
              <div>
                <div class="text-gray-800">
                  整改 {{ r.rectification_id.slice(0, 6) }}
                </div>
                <div class="text-xs text-gray-500">
                  回查人：{{ r.rechecker }}
                </div>
              </div>
              <button class="btn-ghost" @click="openRecheck(r)">回查</button>
            </li>
            <li
              v-if="recheckPending.length === 0"
              class="text-xs text-gray-400"
            >
              暂无待回查
            </li>
          </ul>
        </div>

        <div class="card">
          <div class="text-sm font-semibold text-gray-800 mb-3">已驳回</div>
          <ul class="space-y-2">
            <li v-for="lv in rejectedLeaves" :key="lv.id" class="text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-800"
                  >{{ coachName(lv.coach_id) }} · {{ leaveType(lv.type) }}</span
                >
                <span class="chip-rejected">已驳回</span>
              </div>
              <div v-if="lv.review_note" class="text-xs text-gray-500 mt-0.5">
                {{ lv.review_note }}
              </div>
            </li>
            <li
              v-if="rejectedLeaves.length === 0"
              class="text-xs text-gray-400"
            >
              暂无已驳回
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from "vue";
import type { DashboardResponse, LeaveRequest, Recheck, Coach } from "~/types";

const drawer = useDrawerStore();

const { data, refresh } = await useApi<DashboardResponse>("/dashboard");
const { data: coaches } = await useApi<Coach[]>("/coaches");
const { data: leaves } = await useApi<LeaveRequest[]>("/leaves");
const { data: rechecks } = await useApi<Recheck[]>("/rechecks");

const pendingLeaves = computed(() =>
  (leaves.value || []).filter((l) => l.status === "pending"),
);
const rejectedLeaves = computed(() =>
  (leaves.value || []).filter((l) => l.status === "rejected"),
);
const recheckPending = computed(() =>
  (rechecks.value || []).filter((r) => r.status === "pending"),
);

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
function reviewLeave(lv: LeaveRequest) {
  drawer.openDrawer("leave-review", "请假审核", { leave: lv });
}
function openRecheck(r: Recheck) {
  drawer.openDrawer("recheck", "整改回查", {
    rectification: {
      id: r.rectification_id,
      issue_summary: "-",
      owner: r.rechecker,
    },
  });
}
function openInspection() {
  drawer.openDrawer("inspection", "新水质巡检");
}

watch(
  () => drawer.open,
  (open, wasOpen) => {
    if (wasOpen && !open) {
      refresh();
    }
  },
);
</script>
