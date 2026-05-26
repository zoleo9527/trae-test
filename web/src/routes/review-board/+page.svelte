<script lang="ts">
  import { api, type ReviewBoardItem } from '$lib/api';
  import { onMount } from 'svelte';

  let items: ReviewBoardItem[] = [];
  let loading = true;
  let error: string | null = null;
  let selectedId: number | null = null;

  const statusLabels: Record<string, string> = {
    submitted: '已提交',
    scheduled: '已排期',
    in_progress: '进行中',
    completed: '已完成',
    rejected: '已驳回',
    archived: '已归档'
  };

  const statusColors: Record<string, string> = {
    submitted: '#f59e0b',
    scheduled: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#10b981',
    rejected: '#ef4444',
    archived: '#6b7280'
  };

  const flagTypeLabels: Record<string, string> = {
    late_progress: '进度延迟',
    missing_doc: '材料缺失',
    maintenance: '维修提醒',
    revisit: '需回访'
  };

  onMount(async () => {
    try {
      items = await api.getReviewBoard();
    } catch (e: any) {
      error = e.message;
    }
    loading = false;
  });

  async function refresh() {
    loading = true;
    error = null;
    try {
      items = await api.getReviewBoard();
    } catch (e: any) {
      error = e.message;
    }
    loading = false;
  }

  function toggleDetail(id: number) {
    selectedId = selectedId === id ? null : id;
  }
</script>

<div class="review-board">
  <div class="page-header">
    <div>
      <h2>连续回查面板</h2>
      <p class="subtitle">集中查看所有补贴申报的进度、材料和问题记录</p>
    </div>
    <button class="btn-refresh" on:click={refresh} disabled={loading}>
      {loading ? '刷新中...' : '🔄 刷新'}
    </button>
  </div>

  {#if loading}
    <div class="loading">加载中...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="board">
      {#each items as item}
        <div class="board-item" class:has-issues={item.flags.length > 0 || item.late_progress || item.missing_docs}>
          <div class="item-header" on:click={() => toggleDetail(item.id)}>
            <div class="item-left">
              <span class="code">{item.code}</span>
              <span class="farmer">{item.farmer_name}</span>
              <span class="field">{item.field_name}</span>
              <span class="area">{item.field_area}亩</span>
            </div>
            <div class="item-right">
              {#if item.flags.length > 0}
                <span class="badge flag">{item.flags.length} 待处理</span>
              {/if}
              {#if item.late_progress}
                <span class="badge late">进度延迟</span>
              {/if}
              {#if item.missing_docs}
                <span class="badge missing">材料不齐</span>
              {/if}
              <span class="status" style="background: {statusColors[item.status]}20; color: {statusColors[item.status]}">
                {statusLabels[item.status]}
              </span>
              <span class="expand">{selectedId === item.id ? '▲' : '▼'}</span>
            </div>
          </div>

          {#if selectedId === item.id}
            <div class="item-detail">
              <div class="detail-grid">
                <div class="detail-section">
                  <h4>📊 作业进度</h4>
                  {#if item.reports.length === 0}
                    <div class="empty-small">暂无进度报告</div>
                  {:else}
                    <div class="progress-list">
                      {#each item.reports as report}
                        <div class="progress-item">
                          <div class="progress-bar">
                            <div class="progress-fill" style="width: {report.progress_pct}%"></div>
                          </div>
                          <span class="progress-text">{report.progress_pct}% ({report.area_done}亩)</span>
                          <span class="progress-time">{report.reported_at.slice(0, 16)}</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>

                <div class="detail-section">
                  <h4>⛽ 油料记录</h4>
                  {#if item.fuels.length === 0}
                    <div class="empty-small">暂无油料记录</div>
                  {:else}
                    <div class="fuel-list">
                      {#each item.fuels as fuel}
                        <div class="fuel-item">
                          <span class="fuel-vehicle">{fuel.vehicle_no || '未知车辆'}</span>
                          <span class="fuel-liters">{fuel.liters}L</span>
                          <span class="fuel-cost">¥{fuel.cost}</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>

                <div class="detail-section">
                  <h4>📁 补贴材料</h4>
                  <div class="material-list">
                    {#each item.materials as mat}
                      <div class="material-item" class:collected={mat.collected}>
                        <span class="material-icon">{mat.collected ? '✅' : '⬜'}</span>
                        <span class="material-name">{mat.material_type}</span>
                        {#if mat.collected && mat.collected_at}
                          <span class="material-time">{mat.collected_at.slice(0, 10)}</span>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>

                <div class="detail-section">
                  <h4>🚩 回查标记</h4>
                  {#if item.flags.length === 0}
                    <div class="empty-small">暂无标记</div>
                  {:else}
                    <div class="flag-list">
                      {#each item.flags as flag}
                        <div class="flag-tag">
                          <span class="flag-type">{flagTypeLabels[flag.flag_type]}</span>
                          <span class="flag-note">{flag.note}</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>

              {#if item.operator_name}
                <div class="assign-info">
                  <span>👤 指派机手：{item.operator_name}</span>
                  {#if item.scheduled_for}
                    <span>📅 计划日期：{item.scheduled_for}</span>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .review-board {
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

  .board {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .board-item {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .board-item.has-issues {
    border-left: 4px solid #f59e0b;
  }

  .item-header {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: background 0.2s;
  }

  .item-header:hover {
    background: #f9fafb;
  }

  .item-left {
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
    font-size: 15px;
  }

  .field {
    color: #4b5563;
    font-size: 14px;
  }

  .area {
    color: #6b7280;
    font-size: 13px;
  }

  .item-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .badge {
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
  }

  .badge.flag {
    background: #fee2e2;
    color: #dc2626;
  }

  .badge.late {
    background: #fef3c7;
    color: #d97706;
  }

  .badge.missing {
    background: #fef3c7;
    color: #d97706;
  }

  .status {
    padding: 4px 12px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
  }

  .expand {
    color: #9ca3af;
    font-size: 12px;
    margin-left: 4px;
  }

  .item-detail {
    border-top: 1px solid #f3f4f6;
    padding: 20px;
    background: #fafafa;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .detail-section h4 {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
  }

  .empty-small {
    font-size: 13px;
    color: #9ca3af;
    padding: 8px 0;
  }

  .progress-list, .fuel-list, .material-list, .flag-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .progress-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 4px;
    transition: width 0.3s;
  }

  .progress-text {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    min-width: 80px;
  }

  .progress-time {
    font-size: 12px;
    color: #6b7280;
  }

  .fuel-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
  }

  .fuel-vehicle {
    color: #374151;
  }

  .fuel-liters {
    color: #1e40af;
    font-weight: 500;
  }

  .fuel-cost {
    color: #059669;
    font-weight: 500;
  }

  .material-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    padding: 4px 0;
  }

  .material-item.collected .material-name {
    color: #059669;
  }

  .material-name {
    color: #374151;
    flex: 1;
  }

  .material-time {
    font-size: 12px;
    color: #6b7280;
  }

  .flag-tag {
    background: #fef3c7;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
  }

  .flag-type {
    font-weight: 600;
    color: #92400e;
    margin-right: 8px;
  }

  .flag-note {
    color: #78350f;
  }

  .assign-info {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 24px;
    font-size: 14px;
    color: #4b5563;
  }
</style>
