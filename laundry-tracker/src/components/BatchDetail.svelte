<script lang="ts">
  import { formatDateTime, formatDuration, getStatusLabel, getStatusBadgeClass, formatOrderNo } from '../lib/utils'
  import type { Batch, Order } from '../lib/types'

  export let batch: Batch
  export let onClose: () => void
  export let onUpdated: () => void
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal" on:click|stopPropagation>
    <div class="modal-header">
      <div>
        <h3 class="modal-title">批次详情 - {batch.batchNo}</h3>
        <div class="batch-tags">
          <span class="badge {batch.type === 'rewash' ? 'badge-danger' : 'badge-primary'}">
            {batch.type === 'rewash' ? '返洗批次' : '正常批次'}
          </span>
          <span class="badge badge-gray">{batch.processType}</span>
          <span class="badge {getStatusBadgeClass(batch.status)}">{getStatusLabel(batch.status)}</span>
        </div>
      </div>
      <button class="close-btn" on:click={onClose}>✕</button>
    </div>

    <div class="modal-body">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">批次编号</span>
          <span class="info-value font-mono">{batch.batchNo}</span>
        </div>
        <div class="info-item">
          <span class="info-label">订单数量</span>
          <span class="info-value">{batch.orderIds.length} 件</span>
        </div>
        <div class="info-item">
          <span class="info-label">操作人</span>
          <span class="info-value">{batch.operator || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">创建时间</span>
          <span class="info-value">{formatDateTime(batch.createdAt)}</span>
        </div>
        {#if batch.startTime}
          <div class="info-item">
            <span class="info-label">开始时间</span>
            <span class="info-value">{formatDateTime(batch.startTime)}</span>
          </div>
        {/if}
        {#if batch.endTime}
          <div class="info-item">
            <span class="info-label">完成时间</span>
            <span class="info-value">{formatDateTime(batch.endTime)}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">总耗时</span>
            <span class="info-value">{formatDuration(batch.startTime, batch.endTime)}</span>
          </div>
        {/if}
      </div>

      <div class="orders-section">
        <h4>📦 包含订单</h4>
        <table class="orders-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
            </tr>
          </thead>
          <tbody>
            {#each batch.orderIds as orderId}
              <tr>
                <td class="font-mono">{formatOrderNo(orderId)}</td>
                <td>-</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if batch.notes}
        <div class="notes-section">
          <h4>📝 备注</h4>
          <p>{batch.notes}</p>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" on:click={onClose}>关闭</button>
    </div>
  </div>
</div>

<style>
  .batch-tags {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .info-item.full-width {
    grid-column: 1 / -1;
  }

  .info-label {
    display: block;
    font-size: 12px;
    color: var(--gray-500);
    margin-bottom: 0.25rem;
  }

  .info-value {
    font-weight: 500;
    color: var(--gray-800);
  }

  .orders-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 14px;
    font-weight: 600;
  }

  .orders-table {
    margin-bottom: 1rem;
  }

  .notes-section {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--gray-50);
    border-radius: var(--radius);
  }

  .notes-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 14px;
    font-weight: 600;
  }

  .notes-section p {
    margin: 0;
    color: var(--gray-700);
  }

  .font-mono {
    font-family: 'SF Mono', Monaco, monospace;
  }
</style>
