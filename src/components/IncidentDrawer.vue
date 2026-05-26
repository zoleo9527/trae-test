<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  X, AlertTriangle, FileText, Wrench, Clock,
  UserCheck, Send, Archive, Paperclip, MessageSquare,
  ChevronRight, AlertCircle, CheckCircle2,
  Layers, User, Copy, ExternalLink,
} from 'lucide-vue-next';
import { useDrawerStore } from '@/stores/drawer';
import { useIncidentStore } from '@/stores/incident';
import { useTaskStore } from '@/stores/task';
import { useOperatorStore } from '@/stores/operator';
import { useAuthStore } from '@/stores/auth';
import type { IncidentType } from '@/types';
import { formatDateTime } from '@/composables/useFormat';

const drawer = useDrawerStore();
const incidentStore = useIncidentStore();
const taskStore = useTaskStore();
const operatorStore = useOperatorStore();
const auth = useAuthStore();

const incident = computed(() =>
  drawer.selectedIncidentId
    ? incidentStore.getIncident(drawer.selectedIncidentId)
    : null
);

const task = computed(() =>
  incident.value ? taskStore.getTask(incident.value.taskId) : null
);

const plot = computed(() =>
  task.value ? operatorStore.getPlot(task.value.plotId) : null
);

const operator = computed(() =>
  task.value ? operatorStore.getOperator(task.value.operatorId) : null
);

const activeType = ref<IncidentType>('progress');

watch(
  () => incident.value?.type,
  (t) => { if (t) activeType.value = t; },
  { immediate: true },
);

const typeKeywords: Record<IncidentType, string[]> = {
  progress: ['进度', '报晚', '完成', '开始', '作业'],
  subsidy:  ['补贴', '材料', '审批', '申请', '盖章'],
  repair:   ['维修', '损坏', '配件', '更换', '保养'],
  followup: ['回访', '回复', '客户', '反馈', '接通'],
};

const filteredTimeline = computed(() => {
  if (!incident.value) return [];
  const kws = typeKeywords[activeType.value];
  return incident.value.timeline.filter(e =>
    kws.some(kw => e.action.includes(kw) || (e.note ?? '').includes(kw))
  );
});

const relatedIncidents = computed(() => {
  if (!task.value) return [];
  return incidentStore.forTask(task.value.id).filter(i => i.id !== incident.value?.id);
});

const typeSuggestions: Record<IncidentType, { label: string; action: string }[]> = {
  progress: [
    { label: '确认进度已追平', action: '确认进度追平' },
    { label: '申请延长作业时间', action: '申请延时' },
  ],
  subsidy: [
    { label: '通知村委会补充材料', action: '通知村委会补材料' },
    { label: '标记材料已齐备', action: '标记材料齐备' },
  ],
  repair: [
    { label: '确认配件已到位', action: '确认配件到位' },
    { label: '标记机具已修复', action: '标记修复完成' },
  ],
  followup: [
    { label: '再次尝试联系客户', action: '再次回访' },
    { label: '标记回访已完成', action: '标记回访完成' },
  ],
};

const types: { key: IncidentType; label: string; icon: any }[] = [
  { key: 'progress', label: '地块进度', icon: Clock },
  { key: 'subsidy',  label: '补贴材料', icon: FileText },
  { key: 'repair',   label: '维修',     icon: Wrench },
  { key: 'followup', label: '客户回访', icon: MessageSquare },
];

const note = ref('');

function handle(action: string) {
  if (!incident.value) return;
  const actor = auth.currentUser?.name ?? '系统';
  if (action === 'resolve') {
    incidentStore.resolve(incident.value.id, actor, note.value || undefined);
    task.value && taskStore.addTimeline(task.value.id, actor, '异常处理完成', note.value || undefined);
  } else {
    incidentStore.handle(incident.value.id, actor, action, note.value || undefined);
    task.value && taskStore.addTimeline(task.value.id, actor, action, note.value || undefined);
  }
  note.value = '';
}

function copyTimeline() {
  if (!incident.value) return;
  const text = incident.value.timeline
    .map(e => `[${formatDateTime(e.at)}] ${e.actor} — ${e.action}${e.note ? '（' + e.note + '）' : ''}`)
    .join('\n');
  navigator.clipboard?.writeText(text);
}
</script>

<template>
  <transition name="fade">
    <div
      v-if="drawer.incidentOpen && incident"
      class="fixed inset-0 z-40 bg-ink-950/30"
      @click="drawer.closeIncident()"
    />
  </transition>

  <transition name="drawer">
    <aside
      v-if="drawer.incidentOpen && incident"
      class="fixed top-0 right-0 bottom-0 z-50 w-[540px] max-w-full bg-bone-50 border-l border-black/10 shadow-2xl flex flex-col"
    >
      <header class="h-14 px-5 border-b border-black/10 flex items-center justify-between bg-white">
        <div class="flex items-center gap-2">
          <AlertTriangle :size="16" class="text-amber-450" />
          <div class="text-sm font-semibold text-ink-950">异常处理</div>
          <span class="chip border-ink-900/10 bg-ink-900/5 text-ink-900/70">
            {{ incidentStore.typeLabel(incident.type) }}
          </span>
          <span
            class="chip"
            :class="incident.severity === 'high'
              ? 'border-danger-500/30 text-danger-500'
              : incident.severity === 'medium'
                ? 'border-amber-450/40 text-amber-450'
                : 'border-ink-900/20 text-ink-900/70'"
          >
            严重度：{{ incidentStore.severityLabel(incident.severity) }}
          </span>
          <span
            v-if="incident.resolved"
            class="chip border-success-500/30 text-success-500"
          >
            <CheckCircle2 :size="10" />
            已归档
          </span>
        </div>
        <div class="flex items-center gap-1">
          <button class="btn-ghost !px-2 !py-1" title="复制时间线" @click="copyTimeline">
            <Copy :size="12" />
          </button>
          <button class="btn-ghost" @click="drawer.closeIncident()">
            <X :size="14" /> 关闭
          </button>
        </div>
      </header>

      <div class="px-5 py-4 bg-white border-b border-black/10">
        <div class="text-base font-medium text-ink-950">{{ incident.title }}</div>
        <div class="text-xs text-ink-900/60 mt-1 leading-relaxed">{{ incident.description }}</div>

        <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div class="text-ink-900/50">关联任务</div>
            <div class="text-ink-950 font-mono mt-0.5">{{ task?.id }}</div>
          </div>
          <div>
            <div class="text-ink-900/50">地块</div>
            <div class="text-ink-950 mt-0.5">{{ plot?.name }}</div>
          </div>
          <div>
            <div class="text-ink-900/50">机手</div>
            <div class="text-ink-950 mt-0.5">{{ operator?.name ?? '未派单' }}</div>
          </div>
          <div>
            <div class="text-ink-900/50">上报时间</div>
            <div class="text-ink-950 mt-0.5">{{ formatDateTime(incident.reportedAt) }}</div>
          </div>
          <div v-if="incident.handlerId">
            <div class="text-ink-900/50">处理人</div>
            <div class="text-ink-950 mt-0.5 flex items-center gap-1">
              <User :size="11" />
              {{ incident.handlerId }}
            </div>
          </div>
          <div v-if="incident.resolvedAt">
            <div class="text-ink-900/50">归档时间</div>
            <div class="text-ink-950 mt-0.5">{{ formatDateTime(incident.resolvedAt) }}</div>
          </div>
        </div>

        <div v-if="incident.attachments?.length" class="mt-3">
          <div class="text-[11px] text-ink-900/50 mb-1">附件</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="a in incident.attachments"
              :key="a"
              class="chip border-ink-900/10 bg-white/80 text-ink-900/80"
            >
              <Paperclip :size="10" />
              {{ a }}
            </span>
          </div>
        </div>
      </div>

      <div class="px-5 py-3 bg-white border-b border-black/10 flex items-center gap-1">
        <button
          v-for="t in types"
          :key="t.key"
          class="btn-ghost !px-2.5 !py-1 text-xs"
          :class="[
            activeType === t.key ? '!bg-ink-900 !text-white' : '',
            incident.type === t.key && activeType !== t.key ? '!bg-amber-450/20 !text-amber-450' : '',
          ]"
          @click="activeType = t.key"
        >
          <component :is="t.icon" :size="12" />
          {{ t.label }}
        </button>
        <span class="ml-auto text-[11px] text-ink-900/40">
          点击不同类别可筛选时间线中相关记录
        </span>
      </div>

      <div v-if="activeType !== incident.type" class="px-5 py-2 bg-amber-450/10 border-b border-amber-450/20 text-[11px] text-amber-450 flex items-center gap-1">
        <AlertCircle :size="12" />
        当前查看类别与异常实际类型不符，时间线已按「{{ types.find(t => t.key === activeType)?.label }}」关键词过滤。
      </div>

      <div class="flex-1 overflow-auto px-5 py-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs text-ink-900/50">留痕时间线</div>
          <div class="text-[11px] text-ink-900/40">
            共 {{ incident.timeline.length }} 条，当前显示 {{ filteredTimeline.length }} 条
          </div>
        </div>
        <ol class="relative border-l border-black/10 pl-5 space-y-4">
          <li
            v-for="(e, idx) in (filteredTimeline.length ? filteredTimeline : incident.timeline)"
            :key="idx"
            class="relative"
          >
            <span
              class="absolute -left-[26px] top-1 w-3 h-3 rounded-full ring-4 ring-bone-50"
              :class="e.action.includes('完成') || e.action.includes('确认')
                ? 'bg-success-500'
                : e.action.includes('上报')
                  ? 'bg-amber-450'
                  : 'bg-ink-900'"
            />
            <div class="text-sm text-ink-950">
              {{ e.action }}
              <span class="text-ink-900/50"> — {{ e.actor }}</span>
            </div>
            <div class="text-[11px] text-ink-900/50">{{ formatDateTime(e.at) }}</div>
            <div v-if="e.note" class="text-xs text-ink-900/70 mt-1 leading-relaxed">{{ e.note }}</div>
          </li>
        </ol>

        <div v-if="relatedIncidents.length" class="mt-6">
          <div class="text-xs text-ink-900/50 mb-2 flex items-center gap-1">
            <Layers :size="12" />
            同任务其他异常（{{ relatedIncidents.length }}）
          </div>
          <div class="space-y-2">
            <button
              v-for="ri in relatedIncidents"
              :key="ri.id"
              class="w-full text-left rounded-[10px] border border-ink-900/10 bg-white/60 p-2.5 hover:bg-white transition-colors"
              @click="drawer.openIncident(ri.id)"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="ri.severity === 'high' ? 'bg-danger-500' : ri.severity === 'medium' ? 'bg-amber-450' : 'bg-ink-900/30'"
                />
                <span class="text-xs font-medium text-ink-950">
                  {{ incidentStore.typeLabel(ri.type) }} · {{ ri.title }}
                </span>
                <span
                  v-if="ri.resolved"
                  class="chip border-success-500/20 text-success-500 !py-0"
                >已归档</span>
                <ExternalLink :size="10" class="ml-auto text-ink-900/40" />
              </div>
              <div class="text-[11px] text-ink-900/50 mt-0.5">{{ ri.description }}</div>
            </button>
          </div>
        </div>

        <div class="mt-5">
          <div class="text-xs text-ink-900/50 mb-2">任务主时间线</div>
          <ol class="relative border-l border-black/10 pl-5 space-y-3">
            <li
              v-for="(e, idx) in (task?.timeline ?? []).slice(-6)"
              :key="idx"
              class="relative"
            >
              <span class="absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full bg-amber-450 ring-4 ring-bone-50" />
              <div class="text-xs text-ink-900/80">
                {{ e.action }}
                <span class="text-ink-900/40"> · {{ e.actor }}</span>
              </div>
              <div class="text-[10px] text-ink-900/40">{{ formatDateTime(e.at) }}</div>
            </li>
          </ol>
        </div>
      </div>

      <footer class="border-t border-black/10 bg-white px-5 py-3">
        <textarea
          v-model="note"
          class="field-input min-h-[56px] text-xs"
          placeholder="补充说明（改派原因、回访结果、材料要求等）"
        />

        <div v-if="!incident.resolved && typeSuggestions[activeType].length" class="mt-3">
          <div class="text-[11px] text-ink-900/50 mb-1.5">快捷动作 · {{ types.find(t => t.key === activeType)?.label }}</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="sug in typeSuggestions[activeType]"
              :key="sug.action"
              class="chip border-ink-900/10 bg-ink-900/5 hover:bg-ink-900/10 text-ink-900/80 cursor-pointer"
              @click="handle(sug.action)"
            >
              {{ sug.label }}
            </button>
          </div>
        </div>

        <div class="mt-3 flex items-center gap-2">
          <button class="btn-ghost" @click="handle('退回机手重报')">
            <AlertCircle :size="12" />
            退回
          </button>
          <button class="btn-ghost" @click="handle('改派其他机手')">
            <UserCheck :size="12" />
            改派
          </button>
          <button class="btn-ghost" @click="handle('通知理事跟进')">
            <Send :size="12" />
            通知理事
          </button>
          <button
            class="btn-primary ml-auto"
            :disabled="incident.resolved"
            @click="handle('resolve')"
          >
            <Archive :size="12" />
            {{ incident.resolved ? '已处理' : '处理完成并归档' }}
          </button>
        </div>

        <div class="mt-3 text-[10px] text-ink-900/40 flex items-center gap-1">
          <CheckCircle2 :size="10" />
          所有操作都会写入时间线，作为补贴与维修的留痕依据。
        </div>
      </footer>
    </aside>
  </transition>
</template>