<script lang="ts">
  import { api } from '$lib/api';
  import { onMount } from 'svelte';

  let subsidies: any[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateForm = false;

  const statusLabels: Record<string, string> = {
    submitted: '已提交',
    scheduled: '已排期',
    in_progress: '进行中',
    completed: '已完成',
    rejected: '已驳回'
  };

  const statusColors: Record<string, string> = {
    submitted: '#f59e0b',
    scheduled: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#10b981',
    rejected: '#ef4444'
  };

  let newSubsidy = {
    farmer_name: '',
    field_name: '',
    field_area: '',
    crop_type: '',
    operation_type: ''
  };

  onMount(async () => {
    try {
      subsidies = await api.getSubsidies();
    } catch (e: any) {
      error = e.message;
    }
    loading = false;
  });

  async function refresh() {
    loading = true;
    subsidies = await api.getSubsidies();
    loading = false;
  }

  async function createSubsidy() {
    try {
      await api.createSubsidy({
        ...newSubsidy,
        field_area: parseFloat(newSubsidy.field_area)
      });
      newSubsidy = { farmer_name: '', field_name: '', field_area: '', crop_type: '', operation_type: '' };
      showCreateForm = false;
      refresh();
    } catch (e: any) {
      alert(e.message);
    }
  }
</script>

<div class="subsidies-page">
  <div class="page-header">
    <div>
      <h2>补贴申报</h2>
      <p class="subtitle">管理所有农机作业补贴申报记录</p>
    </div>
    <button class="btn-primary" on:click={() => showCreateForm = !showCreateForm}>
      {showCreateForm ? '取消' : '➕ 新建申报'}
    </button>
  </div>

  {#if showCreateForm}
    <div class="form-card">
      <h3>新建补贴申报</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>农户姓名</label>
          <input type="text" bind:value={newSubsidy.farmer_name} placeholder="请输入" />
        </div>
        <div class="form-group">
          <label>地块名称</label>
          <input type="text" bind:value={newSubsidy.field_name} placeholder="请输入" />
        </div>
        <div class="form-group">
          <label>面积（亩）</label>
          <input type="number" bind:value={newSubsidy.field_area} placeholder="请输入" />
        </div>
        <div class="form-group">
          <label>作物类型</label>
          <input type="text" bind:value={newSubsidy.crop_type} placeholder="如：水稻、小麦" />
        </div>
        <div class="form-group">
          <label>作业类型</label>
          <input type="text" bind:value={newSubsidy.operation_type} placeholder="如：机耕、播种" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-secondary" on:click={() => showCreateForm = false}>取消</button>
        <button class="btn-primary" on:click={createSubsidy}>提交申报</button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="loading">加载中...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="list">
      {#each subsidies as s}
        <a href="/subsidies/{s.id}" class="subsidy-card">
          <div class="card-main">
            <div class="card-left">
              <span class="code">{s.code}</span>
              <span class="farmer">{s.farmer_name}</span>
              <span class="field">{s.field_name} · {s.field_area}亩</span>
            </div>
            <div class="card-right">
              <span class="type">{s.crop_type} / {s.operation_type}</span>
              <span class="status" style="background: {statusColors[s.status]}20; color: {statusColors[s.status]}">
                {statusLabels[s.status]}
              </span>
            </div>
          </div>
          {#if s.operator_name}
            <div class="card-meta">
              <span>机手：{s.operator_name}</span>
              {#if s.scheduled_for}
                <span>计划：{s.scheduled_for}</span>
              {/if}
            </div>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .subsidies-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .page-header h2 {
    font-size: 24px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }

  .subtitle {
    color: #6b7280;
    font-size: 14px;
  }

  .btn-primary {
    padding: 10px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }

  .btn-secondary {
    padding: 10px 20px;
    background: #f3f4f6;
    color: #374151;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }

  .loading, .error {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }

  .error {
    color: #ef4444;
    background: #fee2e2;
    border-radius: 8px;
  }

  .form-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .form-card h3 {
    margin-bottom: 20px;
    font-size: 18px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  .form-group input {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
  }

  .form-actions {
    margin-top: 20px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .subsidy-card {
    background: white;
    border-radius: 12px;
    padding: 18px 22px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s;
  }

  .subsidy-card:hover {
    transform: translateX(4px);
  }

  .card-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-left, .card-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .code {
    font-family: monospace;
    font-size: 12px;
    background: #e5e7eb;
    padding: 4px 10px;
    border-radius: 4px;
    color: #374151;
  }

  .farmer {
    font-weight: 600;
    color: #111827;
  }

  .field {
    color: #6b7280;
    font-size: 14px;
  }

  .type {
    color: #4b5563;
    font-size: 14px;
  }

  .status {
    padding: 4px 12px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
  }

  .card-meta {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #f3f4f6;
    display: flex;
    gap: 24px;
    font-size: 13px;
    color: #6b7280;
  }
</style>
