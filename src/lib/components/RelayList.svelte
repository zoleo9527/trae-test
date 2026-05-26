<script lang="ts">
  import RelayCard from './RelayCard.svelte';
  import { filteredRelays } from '$lib/stores/app';
  import { PLOTS, MACHINES, OPERATORS } from '$lib/data/seed';

  export let emptyHint: string = '试试调整筛选条件';

  function plotName(id) {
    return PLOTS.find((p) => p.id === id)?.name ?? id;
  }
  function machinePlate(id) {
    return MACHINES.find((m) => m.id === id)?.plate ?? id;
  }
  function operatorName(id) {
    return OPERATORS.find((o) => o.id === id)?.name ?? id;
  }
</script>

<div class="relay-list">
  {#if $filteredRelays.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📋</div>
      <div>没有符合条件的任务</div>
      <div class="empty-hint">{emptyHint}</div>
    </div>
  {:else}
    {#each $filteredRelays as relay (relay.id)}
      <RelayCard
        relay={relay}
        plotName={plotName(relay.plotId)}
        machinePlate={machinePlate(relay.machineId)}
        operatorName={operatorName(relay.operatorId)}
      />
    {/each}
  {/if}
</div>
