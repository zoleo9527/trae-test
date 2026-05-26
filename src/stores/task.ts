import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Task, TaskStatus, MachineType } from '@/types';
import { tasks as initialTasks } from '@/mock/data';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>(JSON.parse(JSON.stringify(initialTasks)));

  const tasksSorted = computed(() =>
    [...tasks.value].sort((a, b) => a.expectedAt.localeCompare(b.expectedAt))
  );

  const statusGroups = computed(() => {
    const groups: Record<TaskStatus, Task[]> = {
      pending: [], assigned: [], confirmed: [],
      in_progress: [], completed: [], incident: [],
    };
    for (const t of tasks.value) groups[t.status].push(t);
    return groups;
  });

  const todayTasks = computed(() => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const end = day.getTime() + 24 * 3600 * 1000;
    return tasks.value.filter(t => {
      const at = new Date(t.expectedAt).getTime();
      return at >= day.getTime() && at < end;
    }).sort((a, b) => a.expectedAt.localeCompare(b.expectedAt));
  });

  const waitingForOperator = computed(() =>
    tasks.value.filter(t => t.status === 'assigned')
  );

  const hasConflict = (operatorId: string, expectedAt: string, hours: number, ignoreId?: string) => {
    const start = new Date(expectedAt).getTime();
    const end = start + hours * 3600 * 1000;
    return tasks.value.some(t => {
      if (t.id === ignoreId) return false;
      if (t.operatorId !== operatorId) return false;
      if (t.status === 'completed') return false;
      const s = new Date(t.expectedAt).getTime();
      const e = s + t.durationHours * 3600 * 1000;
      return start < e && s < end;
    });
  };

  function getTask(id: string) {
    return tasks.value.find(t => t.id === id);
  }

  function createTask(input: Omit<Task, 'id' | 'timeline' | 'status'>): Task {
    const t: Task = {
      ...input,
      id: 't_' + Math.floor(Math.random() * 100000),
      status: 'pending',
      timeline: [{ at: new Date().toISOString(), actor: '李调度', action: '创建作业预约' }],
    };
    tasks.value.push(t);
    return t;
  }

  function assignOperator(taskId: string, operatorId: string, actor: string) {
    const t = getTask(taskId);
    if (!t) return;
    if (hasConflict(operatorId, t.expectedAt, t.durationHours, t.id)) {
      throw new Error('该机手该时段已有任务，存在冲突');
    }
    t.operatorId = operatorId;
    t.status = 'assigned';
    t.timeline.push({
      at: new Date().toISOString(),
      actor,
      action: '派单给机手',
      note: operatorId,
    });
  }

  function confirmTask(taskId: string, actor: string) {
    const t = getTask(taskId);
    if (!t) return;
    t.status = 'confirmed';
    t.timeline.push({ at: new Date().toISOString(), actor, action: '机手确认接受任务' });
  }

  function startTask(taskId: string, actor: string) {
    const t = getTask(taskId);
    if (!t) return;
    t.status = 'in_progress';
    t.timeline.push({ at: new Date().toISOString(), actor, action: '开始作业' });
  }

  function completeTask(taskId: string, actor: string) {
    const t = getTask(taskId);
    if (!t) return;
    t.status = 'completed';
    t.timeline.push({ at: new Date().toISOString(), actor, action: '完成作业' });
  }

  function setIncident(taskId: string, actor: string) {
    const t = getTask(taskId);
    if (!t) return;
    t.status = 'incident';
    t.timeline.push({ at: new Date().toISOString(), actor, action: '标记为异常' });
  }

  function addTimeline(taskId: string, actor: string, action: string, note?: string) {
    const t = getTask(taskId);
    if (!t) return;
    t.timeline.push({ at: new Date().toISOString(), actor, action, note });
  }

  function machineTypeLabel(t: MachineType) {
    return { tractor: '旋耕机', combine: '联合收割机', sprayer: '植保机', transplanter: '插秧机' }[t];
  }

  return {
    tasks, tasksSorted, statusGroups, todayTasks, waitingForOperator,
    hasConflict, getTask, createTask, assignOperator, confirmTask,
    startTask, completeTask, setIncident, addTimeline, machineTypeLabel,
  };
});
