<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { currentRole, updateRelay, addTimelineEntry } from '$lib/stores/app';
  import type { RelayItem } from '$lib/types';

  export let relay: RelayItem;
  const dispatch = createEventDispatcher();

  const role = $currentRole;
  const isSubmitting = relay.status === 'in_operation' && role === 'operator';
  const isProcessing = relay.status === 'awaiting_repair' && role === 'dispatcher';

  let category = relay.repair?.category ?? '';
  let description = relay.repair?.description ?? '';
  let partsStr = relay.repair?.parts?.join(', ') ?? '';
  let cost = relay.repair?.cost ?? 0;
  let followUpNeeded = relay.repair?.followUpNeeded ?? false;

  function submit() {
    const now = new Date().toISOString();
    if (isSubmitting) {
      const rep = {
        id: 'REP' + Date.now(),
        relayId: relay.id,
        category: category || '未分类',
        description: description || '无描述',
        parts: partsStr.split(',').map((s) => s.trim()).filter(Boolean),
        cost,
        reportedBy: 'js001',
        reportedAt: now,
        followUpNeeded,
        status: 'pending'
      };
      updateRelay(relay.id, { status: 'awaiting_repair', repair: rep });
      addTimelineEntry(relay.id, { role: 'operator', action: '提交维修申请', note: `[${rep.category}] ${rep.description}` });
    } else if (isProcessing) {
      const rep = {
        ...relay.repair!,
        repairedBy: 'ddy001',
        repairedAt: now,
        status: followUpNeeded ? 'follow_up' : 'done'
      };
      updateRelay(relay.id, {
        status: followUpNeeded ? 'exception_disconnected' : 'repair_done',
        repair: rep,
        exceptionType: followUpNeeded ? 'disconnected' : 'none',
        exceptionDesc: followUpNeeded ? '维修完成需回访，作业与补贴链路待衔接' : undefined
      });
      addTimelineEntry(relay.id, { role: 'dispatcher', action: '维修处理完成', note: followUpNeeded ? '需回访衔接作业与补贴链路' : '无需回访' });
    }
    dispatch('close');
  }
</script>

<div class="drawer-backdrop" on:click={() => dispatch('close')}>
  <div class="drawer" on:click|stopPropagation>
    <div class="drawer-header">
      <div class="drawer-title">{isSubmitting ? '提交维修申请' : '处理维修登记'}</div>
      <button class="close-btn" on:click={() => dispatch('close')}>✕</button>
    </div>
    <div class="drawer-body">
      <div class="form-row">
        <label>故障类别</label>
        <input type="text" bind:value={category} placeholder="如：播种机·离合器 / 液压系统" disabled={!isSubmitting} />
      </div>
      <div class="form-row">
        <label>故障描述</label>
        <textarea bind:value={description} rows={3} placeholder="描述故障现象和发生条件" disabled={!isSubmitting}></textarea>
      </div>
      <div class="form-row">
        <label>更换零件（逗号分隔）</label>
        <input type="text" bind:value={partsStr} placeholder="如：离合器压板, 弹簧套件" disabled={!isSubmitting} />
      </div>
      <div class="form-row">
        <label>费用（元）</label>
        <input type="number" bind:value={cost} min={0} step={10} disabled={!isProcessing} />
      </div>
      {#if isProcessing}
        <div class="form-row checkbox-row">
          <label><input type="checkbox" bind:checked={followUpNeeded} /> 需要回访衔接（维修→作业→补贴链路）</label>
        </div>
      {/if}
    </div>
    <div class="drawer-footer">
      <button class="cancel-btn" on:click={() => dispatch('close')}>取消</button>
      <button class="confirm-btn" on:click={submit}>{isSubmitting ? '提交申请' : '处理完成'}</button>
    </div>
  </div>
</div>
