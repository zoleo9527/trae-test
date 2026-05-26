<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Search, AlertCircle, ChevronRight, CheckCircle2, Clock } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/task';
import { useIncidentStore } from '@/stores/incident';
import { useOperatorStore } from '@/stores/operator';
import { useDrawerStore } from '@/stores/drawer';
import { useAuthStore } from '@/stores/auth';
import type { TaskStatus } from '@/types';
import { formatDateTime } from '@/composables/useFormat';

const router = useRouter();
const taskStore = useTaskStore();
const incidentStore = useIncidentStore();
const operatorStore = useOperatorStore();
const drawer = useDrawerStore();
const auth = useAuthStore();

const keyword = ref('');
const statusFilter = ref<TaskStatus | 'all'>('all');

const filtered = computed(() => {
  const list = taskStore.tasksSorted.filter(t => {
    if (statusFilter.value !== 'all' && t.status !== statusFilter.value) return false;
    if (keyword.value) {
      const kw = keyword.value.toLowerCase();
      const plot = operatorStore.getPlot(t.plotId);
      return (
        t.id.toLowerCase().includes(kw) ||
        (plot?.name.toLowerCase().includes(kw) ?? false) ||
        (t.crop.toLowerCase().includes(kw))
      );
    }
    return true;
  });
  return list;
});

const statusLabel: Record<TaskStatus, string> = {
  pending: '待派单',
  assigned: '已派单',
  confirmed: '已确认',
  in_progress: '作业中',
  completed: '已完成',
  incident: '异常',
};

const statusChipClass: Record<TaskStatus, string> = {
  pending: 'border-ink-900/20 text-ink-900/70',
  assigned: 'border-amber-450/50 text-amber-450',
  confirmed: 'border-ink-700/30 text-ink-700',
  in_progress: 'border-success-500/40 text-success-500',
  completed: 'border-ink-900/20 text-ink-900/70',
  incident: 'border-danger-500/40 text-danger-500',
};
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-2xl font-semibold text-ink-950">作业预约</div>
        <div class="text-xs text-ink-900/60 mt-1">登记客户电话里的地块作业、机手派单与留痕</div>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-900/40" />
          <input
            v-model="keyword"
            class="field-input pl-8 w-64"
            placeholder="搜索任务编号 / 地块 / 作物"
          />
        </div>
        <select v-model="statusFilter" class="field-input w-auto">
          <option value="all">全部状态</option>
          <option value="pending">待派单</option>
          <option value="assigned">已派单</option>
          <option value="confirmed">已确认</option>
          <option value="in_progress">作业中</option>
          <option value="completed">已完成</option>
          <option value="incident">异常</option>
        </select>
        <button
          class="btn-primary"
          @click="router.push('/bookings/new')"
          v-if="auth.role !== 'operator'"
        >
          <Plus :size="14" />
          新建预约
        </button>
      </div>
    </div>

    <div class="surface overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-black/[0.02] text-xs text-ink-900/60">
          <tr>
            <th class="text-left font-medium px-5 py-3">编号</th>
            <th class="text-left font-medium px-5 py-3">地块</th>
            <th class="text-left font-medium px-5 py-3">作物 / 面积</th>
            <th class="text-left font-medium px-5 py-3">机具</th>
            <th class="text-left font-medium px-5 py-3">机手</th>
            <th class="text-left font-medium px-5 py-3">期望时间</th>
            <th class="text-left font-medium px-5 py-3">状态</th>
            <th class="text-left font-medium px-5 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-black/5">
          <tr
            v-for="t in filtered"
            :key="t.id"
            class="hover:bg-black/[0.02]"
          >
            <td class="px-5 py-3 font-mono text-xs text-ink-900/60">{{ t.id }}</td>
            <td class="px-5 py-3 text-ink-950">{{ operatorStore.getPlot(t.plotId)?.name }}</td>
            <td class="px-5 py-3 text-ink-900/80">
              {{ t.crop }} · {{ t.area }}亩
            </td>
            <td class="px-5 py-3 text-ink-900/80">{{ taskStore.machineTypeLabel(t.machineType) }}</td>
            <td class="px-5 py-3 text-ink-900/80">
              {{ operatorStore.getOperator(t.operatorId)?.name ?? '—' }}
            </td>
            <td class="px-5 py-3 text-ink-900/80">{{ formatDateTime(t.expectedAt) }}</td>
            <td class="px-5 py-3">
              <span class="chip" :class="statusChipClass[t.status]">
                <CheckCircle2 :size="11" v-if="t.status === 'completed'" class="text-success-500" />
                <AlertCircle :size="11" v-else-if="t.status === 'incident'" class="text-danger-500" />
                <Clock :size="11" v-else class="text-ink-900/50" />
                {{ statusLabel[t.status] }}
              </span>
            </td>
            <td class="px-5 py-3">
              <div class="flex items-center gap-1">
                <button
                  v-if="incidentStore.forTask(t.id).length"
                  class="btn-ghost !px-2 !py-1 text-xs"
                  @click="drawer.openIncident(incidentStore.forTask(t.id)[0].id)"
                >
                  异常
                  <AlertCircle :size="12" class="text-danger-500" />
                </button>
                <button
                  v-if="t.status === 'assigned' && auth.role === 'operator' && t.operatorId === auth.currentUser?.id"
                  class="btn-ghost !px-2 !py-1 text-xs"
                  @click="taskStore.confirmTask(t.id, auth.currentUser!.name)"
                >
                  确认
                </button>
                <button
                  v-if="t.status === 'in_progress' && auth.role === 'operator' && t.operatorId === auth.currentUser?.id"
                  class="btn-ghost !px-2 !py-1 text-xs"
                  @click="taskStore.completeTask(t.id, auth.currentUser!.name)"
                >
                  完成
                </button>
                <button
                  class="btn-ghost !px-2 !py-1 text-xs"
                  @click="router.push(`/schedules?highlight=${t.id}`)"
                  v-if="auth.role !== 'operator'"
                >
                  改派
                  <ChevronRight :size="12" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="8" class="px-5 py-16 text-center text-sm text-ink-900/40">
              暂无符合条件的作业
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
