<script lang="ts">
  import { filters, focusMode, currentRole } from '$lib/stores/app';
  import { OPERATORS, MACHINES, STATUS_LABELS, EXCEPTION_LABELS } from '$lib/data/seed';

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))
  ];

  const exceptionOptions = [
    { value: 'all', label: '全部异常' },
    ...Object.entries(EXCEPTION_LABELS).map(([k, v]) => ({ value: k, label: v }))
  ];

  $: focusLabel = $currentRole === 'director'
    ? '理事查看全部任务'
    : $focusMode
      ? '聚焦待处理'
      : '查看全部';

  function reset() {
    filters.set({
      status: 'all',
      exceptionType: 'all',
      operatorId: 'all',
      machineId: 'all',
      keyword: '',
      dateFrom: '',
      dateTo: ''
    });
  }
</script>

<div class="filter-panel">
  <div class="filter-row">
    <div class="filter-item">
      <label>状态</label>
      <select bind:value={$filters.status}>
        {#each statusOptions as opt (opt.value)}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div class="filter-item">
      <label>异常类型</label>
      <select bind:value={$filters.exceptionType}>
        {#each exceptionOptions as opt (opt.value)}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div class="filter-item">
      <label>机手</label>
      <select bind:value={$filters.operatorId}>
        <option value="all">全部机手</option>
        {#each OPERATORS as op (op.id)}
          <option value={op.id}>{op.name}</option>
        {/each}
      </select>
    </div>
    <div class="filter-item">
      <label>农机</label>
      <select bind:value={$filters.machineId}>
        <option value="all">全部农机</option>
        {#each MACHINES as m (m.id)}
          <option value={m.id}>{m.plate} · {m.model}</option>
        {/each}
      </select>
    </div>
    <div class="filter-item keyword-item">
      <label>关键字</label>
      <input type="text" bind:value={$filters.keyword} placeholder="任务ID/任务类型/地块/机手" />
    </div>
    <div class="filter-item">
      <label>起始日期</label>
      <input type="date" bind:value={$filters.dateFrom} />
    </div>
    <div class="filter-item">
      <label>截止日期</label>
      <input type="date" bind:value={$filters.dateTo} />
    </div>
    <div class="filter-item reset-item">
      <button class="reset-btn" on:click={reset} type="button">重置</button>
    </div>
  </div>

  {#if $currentRole !== 'director'}
    <div class="focus-toggle-row">
      <label class="focus-switch">
        <input type="checkbox" bind:checked={$focusMode} />
        <span class="focus-slider"></span>
      </label>
      <span class="focus-label">
        {#if $focusMode}
          <b>聚焦待处理</b> · 只显示需要你操作的任务
        {:else}
          查看全部任务
        {/if}
      </span>
      {#if $focusMode}
        <button class="show-all-link" on:click={() => ($focusMode = false)} type="button">切换到全部 →</button>
      {:else}
        <button class="show-all-link" on:click={() => ($focusMode = true)} type="button">← 回到聚焦</button>
      {/if}
    </div>
  {/if}
</div>
