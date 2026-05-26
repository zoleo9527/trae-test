import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Incident, IncidentType, IncidentSeverity, IncidentResolution, TimelineEntry } from '@/types';
import { incidents as initialIncidents } from '@/mock/data';

export const useIncidentStore = defineStore('incident', () => {
  const incidents = ref<Incident[]>(JSON.parse(JSON.stringify(initialIncidents)));

  const unresolved = computed(() => incidents.value.filter(i => !i.resolved));
  const byType = computed(() => {
    const map: Record<IncidentType, Incident[]> = {
      progress: [], subsidy: [], repair: [], followup: [],
    };
    for (const i of incidents.value) map[i.type].push(i);
    return map;
  });

  const counts = computed(() => ({
    total: incidents.value.length,
    unresolved: unresolved.value.length,
    high: incidents.value.filter(i => !i.resolved && i.severity === 'high').length,
    medium: incidents.value.filter(i => !i.resolved && i.severity === 'medium').length,
    low: incidents.value.filter(i => !i.resolved && i.severity === 'low').length,
  }));

  function getIncident(id: string) {
    return incidents.value.find(i => i.id === id);
  }

  function forTask(taskId: string) {
    return incidents.value.filter(i => i.taskId === taskId);
  }

  function create(input: Omit<Incident, 'id' | 'timeline' | 'resolved' | 'reportedAt'>): Incident {
    const inc: Incident = {
      ...input,
      id: 'i_' + Math.floor(Math.random() * 100000),
      reportedAt: new Date().toISOString(),
      resolved: false,
      timeline: [{ at: new Date().toISOString(), actor: input.reporterId, action: '上报异常', note: input.title }],
    };
    incidents.value.push(inc);
    return inc;
  }

  function appendTimeline(id: string, entry: TimelineEntry) {
    const i = getIncident(id);
    if (!i) return;
    i.timeline.push(entry);
  }

  function handle(id: string, actor: string, action: string, note?: string) {
    const i = getIncident(id);
    if (!i) return;
    i.handlerId = i.handlerId || actor;
    i.timeline.push({ at: new Date().toISOString(), actor, action, note });
  }

  function resolve(id: string, actor: string, resolution: IncidentResolution, note?: string) {
    const i = getIncident(id);
    if (!i) return;
    i.resolved = true;
    i.resolvedAt = new Date().toISOString();
    i.resolution = resolution;
    i.handlerId = i.handlerId || actor;
    i.timeline.push({
      at: i.resolvedAt,
      actor,
      action: resolution === 'restored' ? '处理完成，恢复任务' : '处理完成，任务完结',
      note,
    });
  }

  function resolutionLabel(r?: IncidentResolution) {
    if (!r) return '未归档';
    return { restored: '恢复原状态', completed: '任务完结' }[r];
  }

  function typeLabel(t: IncidentType) {
    return { progress: '地块进度', subsidy: '补贴材料', repair: '维修', followup: '客户回访' }[t];
  }

  function severityLabel(s: IncidentSeverity) {
    return { low: '低', medium: '中', high: '高' }[s];
  }

  return {
    incidents, unresolved, byType, counts,
    getIncident, forTask, create, appendTimeline, handle, resolve,
    typeLabel, severityLabel, resolutionLabel,
  };
});
