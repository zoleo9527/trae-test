<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CalendarDays, AlertTriangle, CheckCircle2, User2 } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/task';
import { useOperatorStore } from '@/stores/operator';
import { useAuthStore } from '@/stores/auth';
import type { MachineType } from '@/types';
import { formatTime, timeRangeLabel } from '@/composables/useFormat';

const taskStore = useTaskStore();
const operatorStore = useOperatorStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const machineFilter = ref<MachineType | 'all'>('all');

const highlightId = computed(() => (route.query.highlight as string) || '');

const rows = computed(() => {
  const operators = machineFilter.value === 'all'
    ? operatorStore.operators
    : operatorStore.operators.filter(o => o.machineType === machineFilter.value);
  return operators.map(op => {
    const tasks = taskStore.tasks.filter(t => t.operatorId === op.id);
    return { op, tasks: tasks.sort((a, b) => a.expectedAt.localeCompare(b.expectedAt)) };
  });
});

function timeOffset(iso: string) {
  const d = new Date(iso);
  return Math.max(0, (d.getHours() + d.getMinutes() / 60 - 7) * 22);
}

function assignTo(opId: string) {
  if (!highlightId.value) return;
  try {
    taskStore.assignOperator(highlightId.value, opId, auth.currentUser!.name);
    router.replace({ path: '/schedules' });
  } catch (e: any) {
    alert(e?.message || '派单失败');
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-2xl font-semibold text-ink-950">机手排班</div>
        <div class="text-xs text-ink-900/60 mt-1">按机手 × 时段的方式看今日及近期任务，冲突一目了然</div>
      </div>
      <div class="flex items-center gap-2">
        <select v-model="machineFilter" class="field-input w-auto">
          <option value="all">全部机具</option>
          <option value="tractor">旋耕机</option>
          <option value="combine">联合收割机</option>
          <option value="sprayer">植保机</option>
          <option value="transplanter">插秧机</option>
        </select>
      </div>
    </div>

    <div v-if="highlightId" class="surface p-4 flex items-center gap-3 border-amber-450/40">
      <CalendarDays :size="16" class="text-amber-450" />
      <div class="text-sm text-ink-950">
        正在为任务 <span class="font-mono text-xs text-ink-900/70">{{ highlightId }}</span> 选择机手，点击任意机手行下方的「派给我」即可。
      </div>
      <button class="btn-ghost ml-auto" @click="router.replace('/schedules')">取消</button>
    </div>

    <div class="space-y-3">
      <div
        v-for="row in rows"
        :key="row.op.id"
        class="surface p-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-[10px] bg-ink-900/10 grid place-items-center">
              <User2 :size="16" class="text-ink-900" />
            </div>
            <div>
              <div class="text-sm font-medium text-ink-950">{{ row.op.name }}</div>
              <div class="text-[11px] text-ink-900/60">
                {{ taskStore.machineTypeLabel(row.op.machineType) }} · {{ row.op.machineNo }} · 当前：
                {{ row.op.status === 'idle' ? '空闲' : row.op.status === 'working' ? '作业中' : '维修中' }}
              </div>
            </div>
          </div>
          <button
            v-if="highlightId"
            class="btn-amber"
            @click="assignTo(row.op.id)"
          >派给我</button>
        </div>

        <div class="mt-3 pl-12 pr-2">
          <div class="grid grid-cols-[60px_repeat(12,1fr)] gap-1 text-[10px] text-ink-900/40">
            <div />
            <div v-for="h in 12" :key="h">{{ 6 + h }}:00</div>
          </div>

          <div
            v-for="t in row.tasks"
            :key="t.id"
            class="mt-1 relative"
          >
            <div
              class="rounded-[8px] border px-2 py-1.5 text-[11px] text-white relative"
              :class="t.status === 'incident'
                ? 'bg-danger-500/90 border-danger-500'
                : t.status === 'completed'
                  ? 'bg-success-500/90 border-success-500'
                  : 'bg-ink-900/90 border-ink-900'"
              :style="{ marginLeft: `${timeOffset(t.expectedAt)}px`, width: `${Math.min(t.durationHours * 22, 480)}px` }"
            >
              <div class="flex items-center gap-1">
                <CheckCircle2 :size="10" v-if="t.status === 'completed'" />
                <AlertTriangle :size="10" v-else-if="t.status === 'incident'" />
                <span class="truncate">{{ operatorStore.getPlot(t.plotId)?.name }}</span>
                <span class="ml-auto opacity-70">{{ timeRangeLabel(t.expectedAt, t.durationHours) }}</span>
              </div>
            </div>
          </div>
          <div v-if="!row.tasks.length" class="text-[11px] text-ink-900/30 py-3 pl-2">
            暂无任务
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


