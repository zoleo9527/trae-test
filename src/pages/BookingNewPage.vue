<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Calendar, Sparkles } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/task';
import { useOperatorStore } from '@/stores/operator';
import { useAuthStore } from '@/stores/auth';
import type { MachineType, Task } from '@/types';

const router = useRouter();
const taskStore = useTaskStore();
const operatorStore = useOperatorStore();
const auth = useAuthStore();

const plotId = ref(operatorStore.plots[0]?.id ?? '');
const area = ref(100);
const crop = ref('小麦');
const machineType = ref<MachineType>('tractor');
const durationHours = ref(4);
const expectedAt = ref(new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16));
const notes = ref('');

const recommend = computed(() => plotId.value ? operatorStore.recommendFor(plotId.value) : []);
const chosenOperatorId = ref<string>('');
const conflictMsg = ref('');

function submit() {
  conflictMsg.value = '';
  const expectedAtIso = new Date(expectedAt.value).toISOString();
  const payload = {
    plotId: plotId.value,
    crop: crop.value,
    area: Number(area.value),
    machineType: machineType.value,
    durationHours: Number(durationHours.value),
    expectedAt: expectedAtIso,
    notes: notes.value,
  } as const;

  if (chosenOperatorId.value) {
    if (taskStore.hasConflict(chosenOperatorId.value, expectedAtIso, payload.durationHours)) {
      conflictMsg.value = '该机手该时段已有任务，存在冲突';
      return;
    }
  }

  const created = taskStore.createTask(payload);
  if (chosenOperatorId.value) {
    taskStore.assignOperator(created.id, chosenOperatorId.value, auth.currentUser!.name);
  }
  router.push('/bookings');
}
</script>

<template>
  <div class="space-y-5 max-w-4xl">
    <div class="flex items-center justify-between">
      <div>
        <button class="btn-ghost" @click="router.back()">
          <ArrowLeft :size="14" /> 返回
        </button>
        <h2 class="mt-3 text-2xl font-semibold text-ink-950">新建作业预约</h2>
        <div class="text-xs text-ink-900/60 mt-1">把客户电话里的作业细节录进来，顺手把机手一起排上</div>
      </div>
    </div>

    <form class="surface p-6 grid md:grid-cols-2 gap-5" @submit.prevent="submit">
      <div>
        <label class="field-label">地块</label>
        <select v-model="plotId" class="field-input">
          <option v-for="p in operatorStore.plots" :key="p.id" :value="p.id">
            {{ p.name }} · {{ p.crop }} · {{ p.area }}亩 · {{ p.location }}
          </option>
        </select>
      </div>
      <div>
        <label class="field-label">作物</label>
        <input v-model="crop" class="field-input" placeholder="如：小麦" />
      </div>
      <div>
        <label class="field-label">面积（亩）</label>
        <input v-model.number="area" type="number" min="1" class="field-input" />
      </div>
      <div>
        <label class="field-label">农机类型</label>
        <select v-model="machineType" class="field-input">
          <option value="tractor">旋耕机</option>
          <option value="combine">联合收割机</option>
          <option value="sprayer">植保机</option>
          <option value="transplanter">插秧机</option>
        </select>
      </div>
      <div>
        <label class="field-label">期望开始时间</label>
        <input v-model="expectedAt" type="datetime-local" class="field-input" />
      </div>
      <div>
        <label class="field-label">作业时长（小时）</label>
        <input v-model.number="durationHours" type="number" min="1" class="field-input" />
      </div>
      <div class="md:col-span-2">
        <label class="field-label">备注</label>
        <textarea v-model="notes" class="field-input min-h-[72px]" placeholder="地块特殊情况、客户要求等" />
      </div>

      <div class="md:col-span-2">
        <div class="flex items-center justify-between">
          <label class="field-label !mb-0">
            <Sparkles :size="12" class="inline mr-1 text-amber-450" />
            推荐机手（按农机类型 + 距离 + 空闲度排序）
          </label>
        </div>
        <div class="mt-3 grid md:grid-cols-3 gap-3">
          <button
            type="button"
            v-for="op in recommend"
            :key="op.id"
            class="rounded-[10px] border p-3 text-left transition-colors"
            :class="chosenOperatorId === op.id
              ? 'border-ink-900 bg-ink-900 text-white'
              : 'border-ink-900/10 bg-ink-900/5 hover:bg-ink-900/10 text-ink-950'"
            @click="chosenOperatorId = chosenOperatorId === op.id ? '' : op.id"
          >
            <div class="text-sm font-medium">{{ op.name }}</div>
            <div class="text-[11px] opacity-70 mt-1">
              {{ taskStore.machineTypeLabel(op.machineType) }} · {{ op.machineNo }}
            </div>
            <div class="text-[11px] opacity-70">当前：{{ op.status === 'idle' ? '空闲' : op.status === 'working' ? '作业中' : '维修中' }}</div>
          </button>
          <div v-if="!recommend.length" class="text-xs text-ink-900/40 col-span-3">
            暂无匹配机手，请先登记机手信息。
          </div>
        </div>
      </div>

      <div v-if="conflictMsg" class="md:col-span-2 text-xs text-danger-500">
        {{ conflictMsg }}
      </div>

      <div class="md:col-span-2 flex justify-end gap-2">
        <button type="button" class="btn-ghost" @click="router.back()">取消</button>
        <button class="btn-primary" type="submit">保存并返回</button>
      </div>
    </form>
  </div>
</template>
