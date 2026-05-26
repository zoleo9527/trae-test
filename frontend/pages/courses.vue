<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">课程表</h1>
        <p class="text-sm text-gray-500 mt-1">
          按日期查看课程，支持请假、消课与状态更新
        </p>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="date"
          type="date"
          class="border border-gray-200 rounded-md px-3 py-1.5 text-sm"
        />
        <button class="btn-primary" @click="refresh">刷新</button>
      </div>
    </div>

    <div class="card">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-100">
            <th class="py-2">时间</th>
            <th class="py-2">课程</th>
            <th class="py-2">教练</th>
            <th class="py-2">容量</th>
            <th class="py-2">状态</th>
            <th class="py-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in items" :key="c.id" class="border-b border-gray-50">
            <td class="py-2">{{ c.start_time }} ~ {{ c.end_time }}</td>
            <td class="py-2">{{ c.title }}</td>
            <td class="py-2">{{ coachName(c.coach_id) }}</td>
            <td class="py-2">{{ c.enrolled }}/{{ c.capacity }}</td>
            <td class="py-2">
              <span :class="statusChip(c.status)">{{
                statusLabel(c.status)
              }}</span>
            </td>
            <td class="py-2 text-right space-x-1">
              <button class="btn-ghost" @click="updateCourse(c, 'completed')">
                完成
              </button>
              <button class="btn-ghost" @click="openConsume(c, 'leave')">
                请假消课
              </button>
              <button class="btn-ghost" @click="openConsume(c, 'cancelled')">
                取消
              </button>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="6" class="py-6 text-center text-gray-400">
              当日暂无课程
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="text-xs text-gray-500">
      提示：消课后会自动写入储值记录，若已被投诉会在「投诉回看」中留痕。
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="consumeDialog.open"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      @click.self="consumeDialog.open = false"
    >
      <div class="w-[420px] bg-white rounded-xl shadow-xl p-5">
        <div class="text-base font-semibold text-gray-800 mb-3">
          选择要消课/扣费的会员
        </div>
        <div class="text-xs text-gray-500 mb-3">
          课程：{{ consumeDialog.course?.title }}<br />
          操作：{{ consumeDialog.action === "leave" ? "请假消课" : "课程取消" }}
        </div>
        <label class="block text-sm text-gray-600 mb-2">会员</label>
        <select
          v-model="consumeDialog.memberId"
          class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        >
          <option value="">-- 请选择 --</option>
          <option v-for="m in members" :key="m.id" :value="m.id">
            {{ m.name }} · 余额¥{{ m.balance.toFixed(2) }} · 已用{{
              m.used_sessions
            }}/{{ m.total_sessions }}
          </option>
        </select>
        <div class="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">扣减金额</label>
            <input
              v-model.number="consumeDialog.amount"
              type="number"
              step="0.01"
              class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">备注</label>
            <input
              v-model="consumeDialog.note"
              class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              :placeholder="
                consumeDialog.action === 'leave' ? '请假消课' : '课程取消'
              "
            />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button class="btn-ghost" @click="consumeDialog.open = false">
            取消
          </button>
          <button
            class="btn-primary"
            :disabled="!consumeDialog.memberId || submitting"
            @click="submitConsume"
          >
            {{ submitting ? "提交中..." : "确认" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Course, Coach, CourseStatus, Member } from "~/types";

const date = ref(new Date().toISOString().slice(0, 10));
const { data: coaches } = await useApi<Coach[]>("/coaches");
const { data: members } = await useApi<Member[]>("/members");
const { data: courses, refresh } = await useApi<Course[]>("/courses", {
  query: computed(() => ({ on_date: date.value })),
});
const items = computed(() => courses.value || []);
const submitting = ref(false);

interface ConsumeDialog {
  open: boolean;
  course: Course | null;
  action: "leave" | "cancelled";
  memberId: string;
  amount: number;
  note: string;
}
const consumeDialog = reactive<ConsumeDialog>({
  open: false,
  course: null,
  action: "leave",
  memberId: "",
  amount: 64.0,
  note: "",
});

function coachName(id: string) {
  return coaches.value?.find((c) => c.id === id)?.name || "-";
}
function statusChip(s: string) {
  const map: Record<string, string> = {
    scheduled: "chip-pending",
    completed: "chip-approved",
    cancelled: "chip-closed",
    leave: "chip-rejected",
    rescheduled: "chip-recheck",
  };
  return map[s] || "chip-open";
}
function statusLabel(s: string) {
  const map: Record<string, string> = {
    scheduled: "待上",
    completed: "已完成",
    cancelled: "已取消",
    leave: "请假消课",
    rescheduled: "已改期",
  };
  return map[s] || s;
}

async function updateCourse(c: Course, status: CourseStatus) {
  await apiPatch(`/courses/${c.id}`, { status, note: `${status} 操作留痕` });
  refresh();
}

function openConsume(c: Course, action: "leave" | "cancelled") {
  consumeDialog.open = true;
  consumeDialog.course = c;
  consumeDialog.action = action;
  consumeDialog.memberId = "";
  consumeDialog.amount = 64.0;
  consumeDialog.note = "";
}

async function submitConsume() {
  if (!consumeDialog.course || !consumeDialog.memberId) return;
  submitting.value = true;
  try {
    await apiPatch(`/courses/${consumeDialog.course.id}`, {
      status: consumeDialog.action,
      note:
        consumeDialog.note ||
        (consumeDialog.action === "leave" ? "请假消课" : "课程取消"),
      member_id: consumeDialog.memberId,
      consume_amount: consumeDialog.amount,
    });
    consumeDialog.open = false;
    refresh();
  } finally {
    submitting.value = false;
  }
}
</script>
