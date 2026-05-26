<script lang="ts">
  import { api } from '$lib/api';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let subsidy: any = null;
  let loading = true;
  let error: string | null = null;
  let showReportForm = false;
  let showFlagForm = false;

  const statusLabels: Record<string, string> = {
    submitted: '已提交',
    scheduled: '已排期',
    in_progress: '进行中',
    completed: '已完成',
    rejected: '已驳回'
  };

  const flagTypeLabels: Record<string, string> = {
    late_progress: '进度延迟',
    missing_doc: '材料缺失',
    maintenance: '维修提醒',
    revisit: '需回访'
  };

  let newReport = {
    progress_pct: '',
    area_done: '',
    issue_type: '',
    issue_note: ''
  };

  let newFlag = {
    flag_type: 'missing_doc',
    severity: 'normal',
    note: ''
  };

  onMount(async () => {
    const id = parseInt($page.params.id);
    try {
      subsidy = await api.getSubsidy(id);
    } catch (e: any) {
      error = e.message;
    }
    loading = false;
  });

  async function refresh() {
    const id = parseInt($page.params.id);
    subsidy = await api.getSubsidy(id);
  }

  async function submitReport() {
    await api.reportProgress(subsidy.id, {
      progress_pct: parseInt(newReport.progress_pct),
      area_done: parseFloat(newReport.area_done),
      issue_type: newReport.issue_type || null,
      issue_note: newReport.issue_note || null
    });
    newReport = { progress_pct: '', area_done: '', issue_type: '', issue_note: '' };
    showReportForm = false;
    refresh();
  }

  async function collectMaterial(matId: number) {
    await api.collectMaterial(matId);
    refresh();
  }

  async function submitFlag() {
    await api.createFlag({
      application_id: subsidy.id,
      ...newFlag
    });
    newFlag = { flag_type: 'missing_doc', severity: 'normal', note: '' };
    showFlagForm = false;
    refresh();
  }

  async function resolveFlag(flagId: number) {
    await api.resolveFlag(flagId);
    refresh();
  }

  async function resubmit() {
    await api.resubmitSubsidy(subsidy.id);
    refresh();
  }
</script>

<div class="detail-page">
  <div class="page-header">
    <a href="/subsidies" class="back-link">← 返回列表</a>
    <h2>补贴申报详情</h2>
  </div>

  {#if loading}
    <div class="loading">加载中...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if subsidy}
    <div class="card info-card">
      <div class="card-header">
        <span class="code">{subsidy.code}</span>
        <span class="status">{statusLabels[subsidy.status]}</span>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <label>农户</label><span>{subsidy.farmer_name}</span>
        </div>
        <div class="info-item">
          <label>地块</label><span>{subsidy.field_name}</span>
        </div>
        <div class="info-item">
          <label>面积</label><span>{subsidy.field_area} 亩</span>
        </div>
        <div class="info-item">
          <label>作物</label><span>{subsidy.crop_type}</span>
        </div>
        <div class="info-item">
          <label>作业类型</label><span>{subsidy.operation_type}</span>
        </div>
        <div class="info-item">
          <label>提交人</label><span>{subsidy.submitter_name}</span>
        </div>
        {#if subsidy.operator_name}
          <div class="info-item">
            <label>机手</label><span>{subsidy.operator_name}</span>
          </div>
        {/if}
        {#if subsidy.scheduled_for}
          <div class="info-item">
            <label>计划日期</label><span>{subsidy.scheduled_for}</span>
          </div>
        {/if}
      </div>
      {#if subsidy.note}
        <div class="note">备注：{subsidy.note}</div>
      {/if}

      {#if subsidy.status === 'rejected'}
        <div class="action-bar">
          <button class="btn-primary" on:click={resubmit}>重新提交</button>
        </div>
      {/if}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header-inline">
          <h3>📊 进度报告</h3>
          <button class="btn-small" on:click={() => showReportForm = !showReportForm}>
            {showReportForm ? '取消' : '＋ 新增'}
          </button>
        </div>
        {#if showReportForm}
          <div class="inline-form">
            <input type="number" placeholder="进度 %" bind:value={newReport.progress_pct} />
            <input type="number" placeholder="完成亩数" bind:value={newReport.area_done} />
            <input type="text" placeholder="问题说明（可选）" bind:value={newReport.issue_note} />
            <button class="btn-primary" on:click={submitReport}>提交</button>
          </div>
        {/if}
        <div class="simple-list">
          {#each subsidy.reports as report}
            <div class="simple-item">
              <span class="progress">{report.progress_pct}%</span>
              <span>{report.area_done}亩</span>
              <span class="name">{report.operator_name}</span>
              <span class="time">{report.reported_at?.slice(0, 16)}</span>
            </div>
          {:else}
            <div class="empty">暂无报告</div>
          {/each}
        </div>
      </div>

      <div class="card">
        <div class="card-header-inline">
          <h3>⛽ 油料记录</h3>
        </div>
        <div class="simple-list">
          {#each subsidy.fuels as fuel}
            <div class="simple-item">
              <span class="vehicle">{fuel.vehicle_no}</span>
              <span>{fuel.liters}L</span>
              <span>¥{fuel.cost}</span>
              <span class="time">{fuel.recorded_at?.slice(0, 16)}</span>
            </div>
          {:else}
            <div class="empty">暂无记录</div>
          {/each}
        </div>
      </div>

      <div class="card">
        <div class="card-header-inline">
          <h3>📁 补贴材料</h3>
        </div>
        <div class="material-list">
          {#each subsidy.materials as mat}
            <div class="material-item" class:collected={mat.collected}>
              <span class="icon">{mat.collected ? '✅' : '⬜'}</span>
              <span class="name">{mat.material_type}</span>
              {#if mat.collected}
                <span class="time">{mat.collected_at?.slice(0, 10)}</span>
              {:else}
                <button class="btn-tiny" on:click={() => collectMaterial(mat.id)}>标记已收</button>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="card">
        <div class="card-header-inline">
          <h3>🚩 回查标记</h3>
          <button class="btn-small" on:click={() => showFlagForm = !showFlagForm}>
            {showFlagForm ? '取消' : '＋ 新增'}
          </button>
        </div>
        {#if showFlagForm}
          <div class="inline-form">
            <select bind:value={newFlag.flag_type}>
              <option value="missing_doc">材料缺失</option>
              <option value="late_progress">进度延迟</option>
              <option value="maintenance">维修提醒</option>
              <option value="revisit">需回访</option>
            </select>
            <select bind:value={newFlag.severity}>
              <option value="low">低</option>
              <option value="normal">普通</option>
              <option value="high">高</option>
            </select>
            <input type="text" placeholder="说明" bind:value={newFlag.note} />
            <button class="btn-primary" on:click={submitFlag}>提交</button>
          </div>
        {/if}
        <div class="flag-list">
          {#each subsidy.flags as flag}
            <div class="flag-item" class:resolved={flag.status === 'resolved'}>
              <div>
                <span class="type">{flagTypeLabels[flag.flag_type]}</span>
                <span class="severity">{flag.severity}</span>
                {#if flag.note}<span class="note">{flag.note}</span>{/if}
              </div>
              {#if flag.status !== 'resolved'}
                <button class="btn-tiny" on:click={() => resolveFlag(flag.id)}>解决</button>
              {/if}
            </div>
          {:else}
            <div class="empty">暂无标记</div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .detail-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-link {
    color: #3b82f6;
    text-decoration: none;
    font-size: 14px;
  }

  .page-header h2 {
    font-size: 24px;
    font-weight: 600;
    color: #111827;
  }

  .loading, .error, .empty {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }

  .error {
    color: #ef4444;
    background: #fee2e2;
    border-radius: 8px;
  }

  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .info-card .card-header {
    padding: 16px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .code {
    font-family: monospace;
    font-weight: 600;
    color: #374151;
  }

  .status {
    background: #dbeafe;
    color: #1d4ed8;
    padding: 4px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
  }

  .info-grid {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-item label {
    font-size: 12px;
    color: #6b7280;
  }

  .info-item span {
    font-size: 15px;
    font-weight: 500;
    color: #111827;
  }

  .note {
    padding: 12px 20px;
    background: #fef3c7;
    font-size: 13px;
    color: #92400e;
  }

  .action-bar {
    padding: 16px 20px;
    border-top: 1px solid #f3f4f6;
    display: flex;
    justify-content: flex-end;
  }

  .btn-primary {
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-small {
    padding: 6px 12px;
    background: #f1f5f9;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }

  .btn-tiny {
    padding: 4px 8px;
    background: #e0f2fe;
    color: #0369a1;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .card-header-inline {
    padding: 14px 16px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-header-inline h3 {
    font-size: 15px;
    font-weight: 600;
  }

  .inline-form {
    padding: 12px 16px;
    background: #f8fafc;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .inline-form input, .inline-form select {
    padding: 6px 10px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 13px;
  }

  .simple-list {
    padding: 8px;
  }

  .simple-item {
    padding: 10px 12px;
    display: flex;
    gap: 12px;
    align-items: center;
    border-radius: 6px;
  }

  .simple-item:hover {
    background: #f9fafb;
  }

  .progress {
    font-weight: 600;
    color: #1d4ed8;
  }

  .name {
    color: #4b5563;
    font-size: 13px;
  }

  .time {
    margin-left: auto;
    font-size: 12px;
    color: #9ca3af;
    font-family: monospace;
  }

  .vehicle {
    font-family: monospace;
    color: #374151;
  }

  .material-list {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .material-item {
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 6px;
  }

  .material-item.collected {
    background: #f0fdf4;
  }

  .material-item .name {
    flex: 1;
    font-size: 14px;
  }

  .flag-list {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .flag-item {
    padding: 10px 12px;
    background: #fef3c7;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .flag-item.resolved {
    background: #f3f4f6;
    opacity: 0.6;
  }

  .flag-item .type {
    font-weight: 600;
    font-size: 13px;
    margin-right: 8px;
  }

  .flag-item .severity {
    font-size: 11px;
    padding: 2px 6px;
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
    margin-right: 8px;
  }

  .flag-item .note {
    font-size: 12px;
    color: #78350f;
  }
</style>
