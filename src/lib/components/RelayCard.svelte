<script lang="ts">
  import FuelDrawer from './FuelDrawer.svelte';
  import RepairDrawer from './RepairDrawer.svelte';
  import { STATUS_LABELS, EXCEPTION_LABELS, FUEL_TYPE_LABELS } from '$lib/data/seed';
  import { currentRole, updateRelay, addTimelineEntry } from '$lib/stores/app';
  import { formatDateTime } from '$lib/utils/relay';
  import type { RelayItem, Role } from '$lib/types';

  export let relay: RelayItem;
  export let plotName: string;
  export let machinePlate: string;
  export let operatorName: string;

  let showFuel = false;
  let showRepair = false;
  let expanded = false;

  $: hasException = relay.exceptionType !== 'none';

  function actionLabel(status) {
    const role = $currentRole;
    switch (status) {
      case 'pending_dispatch':
        return role === 'dispatcher' ? '审批油料' : null;
      case 'fuel_approved':
        return role === 'operator' ? '领取油料' : null;
      case 'fuel_issued':
        return role === 'operator' ? '开始作业' : null;
      case 'in_operation':
        if (role === 'operator') return '报工/报晚';
        return null;
      case 'awaiting_repair':
        return role === 'dispatcher' ? '处理维修' : null;
      case 'repair_done':
        return role === 'dispatcher' ? '回访并续作业' : null;
      case 'subsidy_pending':
        return role === 'dispatcher' ? '收齐补贴材料' : null;
      case 'exception_late':
        return role === 'dispatcher' ? '安排续作业' : null;
      case 'exception_incomplete':
        return role === 'dispatcher' ? '补齐补贴' : null;
      case 'exception_disconnected':
        return role === 'dispatcher' ? '回访衔接' : null;
      default:
        return null;
    }
  }

  function handleAction() {
    const role = $currentRole;
    if (relay.status === 'pending_dispatch' && role === 'dispatcher') {
      showFuel = true;
    } else if (relay.status === 'fuel_approved' && role === 'operator') {
      showFuel = true;
    } else if (relay.status === 'fuel_issued' && role === 'operator') {
      updateRelay(relay.id, { status: 'in_operation' });
      addTimelineEntry(relay.id, { role: 'operator', action: '开始作业', note: `${plotName} · ${relay.taskType}` });
    } else if (relay.status === 'in_operation' && role === 'operator') {
      const late = confirm('是否进度报晚？\n[确定]=报晚异常，[取消]=作业完成');
      if (late) {
        updateRelay(relay.id, { status: 'exception_late', exceptionType: 'late_report', exceptionDesc: '机手进度报晚，需调度员安排续作业' });
        addTimelineEntry(relay.id, { role: 'operator', action: '进度报晚', note: '作业未按时完成' });
      } else {
        updateRelay(relay.id, { status: 'subsidy_pending' });
        addTimelineEntry(relay.id, { role: 'operator', action: '作业完成', note: '待调度员收齐补贴材料' });
      }
    } else if (relay.status === 'awaiting_repair' && role === 'dispatcher') {
      showRepair = true;
    } else if (relay.status === 'repair_done' && role === 'dispatcher') {
      updateRelay(relay.id, { status: 'in_operation', exceptionType: 'none', exceptionDesc: undefined });
      addTimelineEntry(relay.id, { role: 'dispatcher', action: '回访确认·恢复作业' });
    } else if (relay.status === 'subsidy_pending' && role === 'dispatcher') {
      updateRelay(relay.id, { status: 'completed', exceptionType: 'none', exceptionDesc: undefined });
      addTimelineEntry(relay.id, { role: 'dispatcher', action: '补贴材料收齐·归档完成' });
    } else if (relay.status === 'exception_late' && role === 'dispatcher') {
      updateRelay(relay.id, { status: 'in_operation', exceptionType: 'none', exceptionDesc: undefined });
      addTimelineEntry(relay.id, { role: 'dispatcher', action: '续作业已安排' });
    } else if (relay.status === 'exception_incomplete' && role === 'dispatcher') {
      updateRelay(relay.id, { status: 'subsidy_pending', exceptionType: 'none', exceptionDesc: undefined });
      addTimelineEntry(relay.id, { role: 'dispatcher', action: '补贴材料已补齐' });
    } else if (relay.status === 'exception_disconnected' && role === 'dispatcher') {
      updateRelay(relay.id, { status: 'in_operation', exceptionType: 'none', exceptionDesc: undefined });
      addTimelineEntry(relay.id, { role: 'dispatcher', action: '回访衔接完成·恢复作业' });
    }
  }

  function closeFuel() {
    showFuel = false;
  }
  function closeRepair() {
    showRepair = false;
  }
</script>

<article class={`relay-card ${hasException ? 'has-exception' : ''} ${relay.status === 'completed' ? 'is-completed' : ''}`}>
  <div class="card-header" on:click={() => (expanded = !expanded)}>
    <div class="card-left">
      <span class="relay-id">#{relay.id}</span>
      <span class="task-type">{relay.taskType}</span>
      <span class="plot-name">📍 {plotName}</span>
    </div>
    <div class="card-right">
      {#if hasException}
        <span class={`exception-tag exc-${relay.exceptionType}`}>⚠ {EXCEPTION_LABELS[relay.exceptionType]}</span>
      {/if}
      <span class={`status-tag st-${relay.status}`}>{STATUS_LABELS[relay.status]}</span>
    </div>
  </div>

  <div class="card-body">
    <div class="info-grid">
      <div class="info-item"><span class="info-label">机手</span><span>{operatorName}</span></div>
      <div class="info-item"><span class="info-label">农机</span><span>{machinePlate}</span></div>
      <div class="info-item"><span class="info-label">创建</span><span>{formatDateTime(relay.createdAt)}</span></div>
      <div class="info-item"><span class="info-label">更新</span><span>{formatDateTime(relay.updatedAt)}</span></div>
    </div>

    {#if relay.fuelApproved}
      <div class="detail-row">
        <span class="detail-label">油料审批</span>
        <span>{FUEL_TYPE_LABELS[relay.fuelApproved.type]} {relay.fuelApproved.amountLiters}升</span>
      </div>
    {/if}
    {#if relay.fuelIssued}
      <div class="detail-row">
        <span class="detail-label">油料领取</span>
        <span>{formatDateTime(relay.fuelIssued.issuedAt)} · {relay.fuelIssued.odometerHours}h</span>
      </div>
    {/if}
    {#if relay.repair}
      <div class="detail-row repair-row">
        <span class="detail-label">维修</span>
        <span>[{relay.repair.category}] {relay.repair.description}</span>
      </div>
    {/if}
    {#if hasException}
      <div class="exception-desc">
        <span class="detail-label">异常说明</span>
        <p>{relay.exceptionDesc}</p>
      </div>
    {/if}
  </div>

  {#if expanded}
    <div class="timeline">
      <div class="timeline-title">操作时间线</div>
      {#each relay.timeline as tl (tl.at + tl.action)}
        <div class="timeline-entry">
          <span class="tl-time">{formatDateTime(tl.at)}</span>
          <span class="tl-role role-${tl.role}">
            {#if tl.role === 'director'}理事{:else if tl.role === 'dispatcher'}调度{:else}机手{/if}
          </span>
          <span class="tl-action">{tl.action}</span>
          {#if tl.note}<span class="tl-note">{tl.note}</span>{/if}
        </div>
      {/each}
    </div>
  {/if}

  <div class="card-actions">
    {#if actionLabel(relay.status)}
      <button class="action-btn" on:click={handleAction}>{actionLabel(relay.status)}</button>
    {/if}
    {#if relay.status === 'in_operation' && $currentRole === 'operator'}
      <button class="action-btn repair-btn" on:click={() => (showRepair = true)}>提交维修申请</button>
    {/if}
    <button class="expand-btn" on:click={() => (expanded = !expanded)}>
      {expanded ? '收起 ▲' : '展开时间线 ▼'}
    </button>
  </div>

  {#if showFuel}
    <FuelDrawer {relay} on:close={closeFuel} />
  {/if}
  {#if showRepair}
    <RepairDrawer {relay} on:close={closeRepair} />
  {/if}
</article>
