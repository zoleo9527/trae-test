<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { currentRole, updateRelay, addTimelineEntry } from '$lib/stores/app';
  import { FUEL_TYPE_LABELS } from '$lib/data/seed';
  import type { RelayItem } from '$lib/types';

  export let relay: RelayItem;
  const dispatch = createEventDispatcher();

  const role = $currentRole;
  const isApproval = relay.status === 'pending_dispatch' && role === 'dispatcher';
  const isClaim = relay.status === 'fuel_approved' && role === 'operator';

  let liters = relay.fuelApproved?.amountLiters ?? 60;
  let odometerHours = relay.fuelApproved?.odometerHours ?? 1000;
  let note = '';
  let fuelType = relay.fuelApproved?.type ?? 'diesel';

  function confirm() {
    const now = new Date().toISOString();
    if (isApproval) {
      const fuelRec = {
        id: 'F' + Date.now(),
        relayId: relay.id,
        type: fuelType,
        amountLiters: liters,
        odometerHours,
        issuedBy: 'ddy001',
        issuedAt: now,
        note: note || undefined
      };
      updateRelay(relay.id, { status: 'fuel_approved', fuelApproved: fuelRec });
      addTimelineEntry(relay.id, { role: 'dispatcher', action: '油料审批通过', note: `${FUEL_TYPE_LABELS[fuelType]} ${liters}升` });
    } else if (isClaim) {
      const fuelRec = {
        id: 'F' + Date.now(),
        relayId: relay.id,
        type: fuelType,
        amountLiters: liters,
        odometerHours,
        issuedBy: 'js001',
        issuedAt: now,
        note: note || undefined
      };
      updateRelay(relay.id, { status: 'fuel_issued', fuelIssued: fuelRec });
      addTimelineEntry(relay.id, { role: 'operator', action: '机手领取油料', note: `${liters}升 · 里程${odometerHours}h` });
    }
    dispatch('close');
  }
</script>

<div class="drawer-backdrop" on:click={() => dispatch('close')}>
  <div class="drawer" on:click|stopPropagation>
    <div class="drawer-header">
      <div class="drawer-title">{isApproval ? '油料审批' : '油料领取'}</div>
      <button class="close-btn" on:click={() => dispatch('close')}>✕</button>
    </div>
    <div class="drawer-body">
      <div class="form-row">
        <label>油料类型</label>
        <select bind:value={fuelType} disabled={!isApproval}>
          {#each Object.entries(FUEL_TYPE_LABELS) as [k, v] (k)}
            <option value={k}>{v}</option>
          {/each}
        </select>
      </div>
      <div class="form-row">
        <label>数量（升）</label>
        <input type="number" bind:value={liters} min={1} step={1} disabled={!isApproval} />
      </div>
      <div class="form-row">
        <label>农机工作小时（h）</label>
        <input type="number" bind:value={odometerHours} min={0} step={0.1} />
      </div>
      <div class="form-row">
        <label>备注</label>
        <textarea bind:value={note} rows={3} placeholder={isApproval ? '如：每百亩62升核定' : '如：油箱确认、出库签字'}></textarea>
      </div>
    </div>
    <div class="drawer-footer">
      <button class="cancel-btn" on:click={() => dispatch('close')}>取消</button>
      <button class="confirm-btn" on:click={confirm}>确认{isApproval ? '审批' : '领取'}</button>
    </div>
  </div>
</div>
