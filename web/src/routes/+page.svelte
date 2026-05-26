<script lang="ts">
  import { api, type DashboardData } from '$lib/api';
  import { onMount } from 'svelte';

  let data: DashboardData | null = null;
  let loading = true;
  let error: string | null = null;

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

  const flagTypeLabels: Record<string, string> = {
    late_progress: '进度延迟',
    missing_doc: '材料缺失',
    maintenance: '维修提醒',
    revisit: '需回访'
  };

  const severityColors: Record<string, string> = {
    high: '#fee2e2',
    normal: '#fef3c7',
    low: '#dbeafe'
  };

  onMount(async () => {
    try {
      data = await api.getDashboard();
    } catch (e: any) {
      error = e.message;
    }
    loading = false;
  });

  async function refresh() {
    loading = true;
    error = null;
    try {
      data = await api.getDashboard();
    } catch (e: any) {
      error = e.message;
    }
    loading = false;
  }
</script>

<div class="dashboard">
  <div class="page-header">
    <div>
      <h2>首页仪表盘</h2>
      <p class="subtitle">实时查看待处理、已驳回和需回查的补贴申报数据</p>
    </div>
    <button class="btn-refresh" on:click={refresh} disabled={loading}>
      {loading ? '刷新中...' : '🔄 刷新数据'}
    </button>
  </div>

  {#if loading}
    <div class="loading">加载中...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if data}
    <div class="stats-row">
      <div class="stat-card pending">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-value">{data.counts.pending}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      <div class="stat-card in-progress">
        <div class="stat-icon">🚜</div>
        <div class="stat-content">
          <div class="stat-value">{data.counts.inProgress}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
      <div class="stat-card rejected">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-value">{data.counts.rejected}</div>
          <div class="stat-label">已驳回</div>
        </div>
      </div>
      <div class="stat-card review">
        <div class="stat-icon">🔍</div>
        <div class="stat-content">
          <div class="stat-value">{data.counts.reviewFlags}</div>
          <div class="stat-label">需回查</div>
        </div>
      </div>
      <div class="stat-card completed">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{data.counts.completed}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3>📋 待处理申报</h3>
          <span class="badge">{data.pendingList.length}</span>
        </div>
        <div class="card-body">
          {#if data.pendingList.length === 0}
            <div class="empty">暂无待处理数据</div>
          {:else}
            <div class="list">
              {#each data.pendingList as item}
                <a href="/subsidies/{item.id}" class="list-item">
                  <div class="item-main">
                    <span class="code">{item.code}</span>
                    <span class="farmer">{item.farmer_name}</span>
                    <span class="field">{item.field_name}</span>
                  </div>
                  <div class="item-meta">
                    <span class="crop">{item.crop_type} - {item.operation_type}</span>
                    <span class="status" style="color: {statusColors[item.status]}">
                      {statusLabels[item.status]}
                    </span>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>❌ 已驳回</h3>
          <span class="badge rejected-badge">{data.rejectedList.length}</span>
        </div>
        <div class="card-body">
          {#if data.rejectedList.length === 0}
            <div class="empty">暂无已驳回数据</div>
          {:else}
            <div class="list">
              {#each data.rejectedList as item}
                <a href="/subsidies/{item.id}" class="list-item rejected-item">
                  <div class="item-main">
                    <span class="code">{item.code}</span>
                    <span class="farmer">{item.farmer_name}</span>
                    <span class="field">{item.field_name}</span>
                  </div>
                  {#if item.note}
                    <div class="reject-note">{item.note}</div>
                  {/if}
                </a>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>🔍 需回查事项</h3>
        <span class="badge review-badge">{data.flags.length}</span>
        <a href="/review-board" class="view-all">查看全部 →</a>
      </div>
      <div class="card-body">
        {#if data.flags.length === 0}
          <div class="empty">暂无需回查事项</div>
        {:else}
          <div class="flag-list">
            {#each data.flags as flag}
              <a href="/subsidies/{flag.application_id}" class="flag-item" style="background: {severityColors[flag.severity]}">
                <div class="flag-header">
                  <span class="flag-type">{flagTypeLabels[flag.flag_type] || flag.flag_type}</span>
                  <span class="flag-app">{flag.app_code} · {flag.farmer_name} · {flag.field_name}</span>
                </div>
                {#if flag.note}
                  <div class="flag-note">{flag.note}</div>
                {/if}
                {#if flag.created_by_name}
                  <div class="flag-footer">创建人：{flag.created_by_name}</div>
                {/if}
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 24px;
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

  .btn-refresh {
    padding: 10px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }

  .btn-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

  .stats-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border-left: 4px solid;
  }

  .stat-card.pending { border-left-color: #f59e0b; }
  .stat-card.in-progress { border-left-color: #8b5cf6; }
  .stat-card.rejected { border-left-color: #ef4444; }
  .stat-card.review { border-left-color: #0ea5e9; }
  .stat-card.completed { border-left-color: #10b981; }

  .stat-icon {
    font-size: 32px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
  }

  .stat-label {
    font-size: 13px;
    color: #6b7280;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .card-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .badge {
    background: #dbeafe;
    color: #1d4ed8;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
  }

  .rejected-badge {
    background: #fee2e2;
    color: #dc2626;
  }

  .review-badge {
    background: #cffafe;
    color: #0891b2;
  }

  .view-all {
    margin-left: auto;
    color: #3b82f6;
    text-decoration: none;
    font-size: 13px;
  }

  .card-body {
    padding: 12px;
    max-height: 400px;
    overflow-y: auto;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .list-item {
    padding: 14px 16px;
    border-radius: 8px;
    background: #f9fafb;
    cursor: pointer;
    transition: background 0.2s;
  }

  .list-item:hover {
    background: #f1f5f9;
  }

  .rejected-item {
    background: #fef2f2;
  }

  .item-main {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  .code {
    font-family: monospace;
    font-size: 12px;
    background: #e5e7eb;
    padding: 2px 8px;
    border-radius: 4px;
    color: #374151;
  }

  .farmer {
    font-weight: 500;
    color: #111827;
  }

  .field {
    color: #6b7280;
    font-size: 13px;
  }

  .item-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 4px;
  }

  .crop {
    font-size: 13px;
    color: #6b7280;
  }

  .status {
    font-size: 12px;
    font-weight: 500;
  }

  .reject-note {
    font-size: 12px;
    color: #dc2626;
    padding: 6px 0 0 4px;
  }

  .flag-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .flag-item {
    padding: 14px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .flag-item:hover {
    transform: translateX(4px);
  }

  .flag-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  .flag-type {
    font-weight: 600;
    color: #111827;
    font-size: 14px;
  }

  .flag-app {
    font-size: 13px;
    color: #4b5563;
  }

  .flag-note {
    font-size: 13px;
    color: #374151;
    margin-bottom: 4px;
  }

  .flag-footer {
    font-size: 12px;
    color: #6b7280;
  }
</style>
