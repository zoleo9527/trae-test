<script setup lang="ts">
import { computed } from 'vue';
import { Play, CheckCircle2, AlertTriangle } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/task';
import { useOperatorStore } from '@/stores/operator';
import { useAuthStore } from '@/stores/auth';
import { useDrawerStore } from '@/stores/drawer';
import { useIncidentStore } from '@/stores/incident';
import { formatDateTime } from '@/composables/useFormat';

const taskStore = useTaskStore();
const operatorStore = useOperatorStore();
const auth = useAuthStore();
const drawer = useDrawerStore();
const incidentStore = useIncidentStore();

const myTasks = computed(() => {
  if (!auth.currentUser) return [];
  return taskStore.tasksSorted
    .filter(t => t.operatorId === auth.currentUser!.id)
    .filter(t => t.status !== 'completed');
});

function start(tid: string) { taskStore.startTask(tid, auth.currentUser!.name); }
function done(tid: string) { taskStore.completeTask(tid, auth.currentUser!.name); }
function openIncident(tid: string) {
  const list = incidentStore.forTask(tid);
  if (list.length) drawer.openIncident(list[0].id);
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <div class="text-2xl font-semibold text-ink-950">我的任务</div>
      <div class="text-xs text-ink-900/60 mt-1">机手视角：领取、开始、完成，有异常直接上报</div>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
      <div
        v-for="t in myTasks"
        :key="t.id"
        class="surface p-5"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-ink-950">
            {{ operatorStore.getPlot(t.plotId)?.name }}
          </div>
          <span class="chip border-ink-900/10 bg-ink-900/5 text-ink-900/70">
            {{ taskStore.machineTypeLabel(t.machineType) }}
          </span>
        </div>
        <div class="mt-2 text-xs text-ink-900/60">
          {{ t.crop }} · {{ t.area }}亩 · {{ formatDateTime(t.expectedAt) }} · {{ t.durationHours }}h
        </div>
        <div v-if="t.notes" class="mt-2 text-xs text-ink-900/50 leading-relaxed">
          备注：{{ t.notes }}
        </div>

        <div class="mt-4 flex items-center gap-2">
          <button
            v-if="t.status === 'assigned' || t.status === 'confirmed'"
            class="btn-primary"
            @click="start(t.id)"
          >
            <Play :size="12" />
            开始作业
          </button>
          <button
            v-if="t.status === 'in_progress'"
            class="btn-primary"
            @click="done(t.id)"
          >
            <CheckCircle2 :size="12" />
            完成作业
          </button>
          <button
            v-if="incidentStore.forTask(t.id).length"
            class="btn-amber"
            @click="openIncident(t.id)"
          >
            <AlertTriangle :size="12" />
            查看异常
          </button>
          <button
            class="btn-ghost"
            @click="drawer.openIncident(incidentStore.create({
              taskId: t.id,
              type: 'progress',
              severity: 'medium',
              title: '机手上报异常',
              description: '请在抽屉内补充具体异常细节。',
              reporterId: auth.currentUser!.id,
            }).id)"
          >
            上报异常
          </button>
        </div>

        <div class="mt-4 space-y-1 text-[11px] text-ink-900/60">
          <div v-for="(e, idx) in [...t.timeline].reverse()" :key="idx">
            · {{ e.actor }} · {{ e.action }}
            <span v-if="e.note" class="text-ink-900/40"> · {{ e.note }}</span>
          </div>
        </div>
      </div>

      <div v-if="!myTasks.length" class="md:col-span-2 surface p-10 text-center text-sm text-ink-900/40">
        当前没有分配给你的任务
      </div>
    </div>
  </div>
</template>
