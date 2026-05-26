import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Operator, Plot } from '@/types';
import { operators as initialOperators, plots as initialPlots } from '@/mock/data';

export const useOperatorStore = defineStore('operator', () => {
  const operators = ref<Operator[]>(JSON.parse(JSON.stringify(initialOperators)));
  const plots = ref<Plot[]>(JSON.parse(JSON.stringify(initialPlots)));

  const idleOperators = computed(() => operators.value.filter(o => o.status === 'idle'));

  function getOperator(id?: string) {
    return id ? operators.value.find(o => o.id === id) : undefined;
  }

  function getPlot(id?: string) {
    return id ? plots.value.find(p => p.id === id) : undefined;
  }

  function recommendFor(plotId: string) {
    const plot = plots.value.find(p => p.id === plotId);
    if (!plot) return [];
    return [...operators.value]
      .filter(o => o.machineType === resolveMachineType(plot.crop))
      .sort((a, b) => score(a, plot) - score(b, plot));
  }

  function resolveMachineType(crop: string): Operator['machineType'] {
    if (crop === '水稻' || crop === '小麦' || crop === '油菜') return 'combine';
    if (crop === '玉米') return 'sprayer';
    if (crop === '秧苗') return 'transplanter';
    return 'tractor';
  }

  function score(o: Operator, plot: Plot) {
    const base = o.status === 'idle' ? 0 : o.status === 'working' ? 100 : 500;
    return base + (plot.distance ?? 0) * 2;
  }

  return { operators, plots, idleOperators, getOperator, getPlot, recommendFor };
});
