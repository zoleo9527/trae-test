<script setup lang="ts">
import { computed, ref } from 'vue';
import { AlertTriangle, AlertCircle, CheckCircle2, Clock, ChevronRight, Filter } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/task';
import { useIncidentStore } from '@/stores/incident';
import { useOperatorStore } from '@/stores/operator';
import { useAuthStore } from '@/stores/auth';
import { useDrawerStore } from '@/stores/drawer';
import { formatDateTime, formatTime, roleLabel } from '@/composables/useFormat';

const taskStore = useTaskStore();
const incidentStore = useIncidentStore();
const operatorStore = useOperatorStore();
const auth = useAuthStore();
const drawer = useDrawerStore();

const stats = computed(() => ({
  today: taskStore.todayTasks.length,
  pending: taskStore.statusGroups.pending.length,
  incident: taskStore.statusGroups.incident.length,
  completed: taskStore.statusGroups.completed.length,
}));

const incidentFilter = ref<'unresolved' | 'resolved' | 'all'>('unresolved');

const filteredIncidents = computed(() => {
  if (incidentFilter.value === 'unresolved') return incidentStore.unresolved;
  if (incidentFilter.value === 'resolved') return incidentStore.incidents.filter(i => i.resolved);
  return incidentStore.incidents;
});

const resolvedCount = computed(() => incidentStore.incidents.filter(i => i.resolved).length);

function openFirstIncident(taskId: string) {
  const inc = incidentStore.forTask(taskId);
  if (inc.length > 0) drawer.openIncident(inc[0].id);
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-4 gap-4">
      <div class="surface p-5">
        <div class="text-xs text-ink-900/60">今日排班</div>
        <div class="mt-1 text-3xl font-semibold text-ink-950">{{ stats.today }}</div>
        <div class="text-[11px] text-ink-900/50 mt-1">含待确认任务</div>
      </div>
      <div class="surface p-5">
        <div class="text-xs text-ink-900/60">待派单</div>
        <div class="mt-1 text-3xl font-semibold text-ink-950">{{ stats.pending }}</div>
        <div class="text-[11px] text-ink-900/50 mt-1">等待调度员派单</div>
      </div>
      <div class="surface p-5">
        <div class="text-xs text-ink-900/60 flex items-center gap-1">
          <AlertTriangle :size="12" class="text-amber-450" />
          异常作业
        </div>
        <div class="mt-1 text-3xl font-semibold text-danger-500">{{ stats.incident }}</div>
        <div class="text-[11px] text-ink-900/50 mt-1">需要在抽屉内处理</div>
      </div>
      <div class="surface p-5">
        <div class="text-xs text-ink-900/60 flex items-center gap-1">
          <CheckCircle2 :size="12" class="text-success-500" />
          已完成
        </div>
        <div class="mt-1 text-3xl font-semibold text-ink-950">{{ stats.completed }}</div>
        <div class="text-[11px] text-ink-900/50 mt-1">近 30 天</div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2 surface p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold text-ink-950">今日任务时间轴</div>
            <div class="text-xs text-ink-900/50">按时段展示机手任务，红色段为异常/冲突</div>
          </div>
          <div class="text-xs text-ink-900/50">{{ new Date().toLocaleDateString('zh-CN') }}</div>
        </div>

        <div class="mt-4 divide-y divide-black/5">
          <div
            v-for="task in taskStore.todayTasks"
            :key="task.id"
            class="py-3 flex items-center gap-4"
          >
            <div class="w-20 shrink-0 text-sm text-ink-900/70">
              {{ formatTime(task.expectedAt) }}
              <div class="text-[11px] text-ink-900/40">{{ task.durationHours }}h</div>
            </div>
            <div
              class="flex-1 h-10 rounded-[10px] border flex items-center px-3 gap-3"
              :class="task.status === 'incident' ? 'border-danger-500/30 bg-danger-500/5' : 'border-ink-900/10 bg-ink-900/5'"
            >
              <div class="text-sm font-medium text-ink-950">
                {{ operatorStore.getPlot(task.plotId)?.name }}
                <span class="ml-2 text-xs text-ink-900/60">{{ task.crop }} · {{ task.area }}亩 · {{ taskStore.machineTypeLabel(task.machineType) }}</span>
              </div>
              <div class="ml-auto text-xs text-ink-900/60">
                {{ operatorStore.getOperator(task.operatorId)?.name ?? '未派单' }}
              </div>
              <button
                v-if="incidentStore.forTask(task.id).length"
                class="chip border-ink-900/10 bg-white/60 hover:bg-white"
                @click="openFirstIncident(task.id)"
              >
                <AlertCircle :size="12" class="text-danger-500" />
                查看异常
                <ChevronRight :size="12" />
              </button>
            </div>
          </div>
          <div v-if="!taskStore.todayTasks.length" class="py-10 text-center text-sm text-ink-900/40">
            今日暂无任务
          </div>
        </div>
      </div>

      <div class="surface p-5">
        <div class="text-sm font-semibold text-ink-950">待确认</div>
        <div class="text-xs text-ink-900/50 mt-1">待机手领取 / 调度确认</div>

        <div class="mt-4 space-y-3">
          <div
            v-for="t in taskStore.waitingForOperator"
            :key="t.id"
            class="rounded-[10px] border border-ink-900/10 bg-ink-900/5 p-3"
          >
            <div class="text-sm text-ink-950">
              {{ operatorStore.getPlot(t.plotId)?.name }}
            </div>
            <div class="text-[11px] text-ink-900/60 mt-1">
              {{ t.crop }} · {{ t.area }}亩 · {{ formatDateTime(t.expectedAt) }}
            </div>
            <div class="mt-2 flex items-center gap-2 text-[11px] text-ink-900/60">
              <Clock :size="12" />
              <span>机手：{{ operatorStore.getOperator(t.operatorId)?.name ?? '—' }}</span>
            </div>
          </div>
          <div v-if="!taskStore.waitingForOperator.length" class="text-[11px] text-ink-900/40">
            暂无待确认任务
          </div>
        </div>
      </div>
    </div>

    <div class="surface p-5">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold text-ink-950">异常处理清单</div>
          <div class="text-xs text-ink-900/50">未处理 / 已归档全部可查，点击进入抽屉查看详情</div>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 mr-2">
            <span class="chip border-danger-500/30 text-danger-500">高 {{ incidentStore.counts.high }}</span>
            <span class="chip border-amber-450/40 text-amber-450">中 {{ incidentStore.counts.medium }}</span>
            <span class="chip border-ink-900/20 text-ink-900/70">低 {{ incidentStore.counts.low }}</span>
          </div>
          <div class="flex items-center rounded-[10px] border border-black/10 bg-white/60 p-0.5 text-xs">
            <button
              class="px-2.5 py-1 rounded-[8px] transition-colors"
              :class="incidentFilter === 'unresolved' ? 'bg-ink-900 text-white' : 'text-ink-900/60 hover:text-ink-900'"
              @click="incidentFilter = 'unresolved'"
            >
              未处理 {{ incidentStore.counts.unresolved }}
            </button>
            <button
              class="px-2.5 py-1 rounded-[8px] transition-colors"
              :class="incidentFilter === 'resolved' ? 'bg-ink-900 text-white' : 'text-ink-900/60 hover:text-ink-900'"
              @click="incidentFilter = 'resolved'"
            >
              已归档 {{ resolvedCount }}
            </button>
            <button
              class="px-2.5 py-1 rounded-[8px] transition-colors"
              :class="incidentFilter === 'all' ? 'bg-ink-900 text-white' : 'text-ink-900/60 hover:text-ink-900'"
              @click="incidentFilter = 'all'"
            >
              全部 {{ incidentStore.counts.total }}
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 divide-y divide-black/5">
        <div
          v-for="inc in filteredIncidents"
          :key="inc.id"
          class="py-3 flex items-center gap-4"
        >
          <div
            class="w-1.5 h-8 rounded-full"
            :class="inc.severity === 'high' ? 'bg-danger-500' : inc.severity === 'medium' ? 'bg-amber-450' : 'bg-ink-900/30'"
          />
          <div class="flex-1">
            <div class="text-sm text-ink-950">
              {{ incidentStore.typeLabel(inc.type) }} · {{ inc.title }}
              <span
                v-if="inc.resolved"
                class="ml-2 chip border-success-500/20 text-success-500 !py-0"
              >
                {{ incidentStore.resolutionLabel(inc.resolution) }}
              </span>
            </div>
            <div class="text-[11px] text-ink-900/60 mt-0.5">{{ inc.description }}</div>
            <div class="text-[10px] text-ink-900/40 mt-1 flex items-center gap-3">
              <span>上报：{{ formatDateTime(inc.reportedAt) }}</span>
              <span v-if="inc.handlerId">处理人：{{ inc.handlerId }}</span>
              <span v-if="inc.resolved && inc.resolvedAt">归档：{{ formatDateTime(inc.resolvedAt) }}</span>
            </div>
          </div>
          <div class="text-xs text-ink-900/50">
            对应任务 {{ inc.taskId }}
          </div>
          <button
            class="btn-amber"
            @click="drawer.openIncident(inc.id)"
          >
            {{ inc.resolved ? '查看' : '处理' }}
            <ChevronRight :size="14" />
          </button>
        </div>
        <div v-if="!filteredIncidents.length" class="py-8 text-center text-sm text-ink-900/40">
          {{ incidentFilter === 'resolved' ? '暂无已归档的异常' : incidentFilter === 'all' ? '暂无异常记录' : '当前没有未处理的异常' }}
        </div>
      </div>
    </div>

    <div class="text-[11px] text-ink-900/40 text-center">
      当前角色：{{ auth.currentUser ? roleLabel[auth.currentUser.role] : '' }}（{{ auth.currentUser?.name }}）
    </div>
  </div>
</template>