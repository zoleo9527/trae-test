<script lang="ts">
  import { db } from '../lib/db'
  import { formatDateTime, getStatusLabel, getStatusBadgeClass, getIssueTypeLabel, formatOrderNo, generateId } from '../lib/utils'
  import type { Issue, Order } from '../lib/types'

  export let issue: Issue
  export let onClose: () => void
  export let onUpdated: () => void

  let orders: Order[] = []
  let resolution = issue.resolution || ''
  let compensation = issue.compensation || 0
  let status = issue.status
  let addEvidence = false
  let newEvidenceType = 'note'
  let newEvidenceContent = ''

  async function loadOrders() {
    orders = await db.orders.toArray()
  }

  loadOrders()

  function getOrder(): Order | undefined {
    return orders.find(o => o.id === issue.orderId)
  }

  async function saveResolution() {
    await db.issues.update(issue.id, {
      status: status,
      resolution: resolution || undefined,
      compensation: compensation > 0 ? compensation : undefined,
      resolvedAt: status === 'resolved' ? Date.now() : undefined
    })

    issue.status = status
    issue.resolution = resolution
    issue.compensation = compensation > 0 ? compensation : undefined

    await db.timelineEvents.add({
      id: generateId(),
      type: 'issue',
      referenceId: issue.id,
      action: '问题处理',
      description: `状态更新为：${getStatusLabel(status)}`,
      timestamp: Date.now()
    })

    onUpdated()
    onClose()
  }

  async function addEvidenceItem() {
    if (!newEvidenceContent) return

    const newEvidence = {
      type: newEvidenceType as 'photo' | 'note',
      content: newEvidenceContent,
      timestamp: Date.now(),
      author: '当前用户'
    }

    await db.issues.update(issue.id, {
      evidence: [...issue.evidence, newEvidence]
    })

    issue.evidence = [...issue.evidence, newEvidence]
    addEvidence = false
    newEvidenceContent = ''
  }
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal modal-large" on:click|stopPropagation>
    <div class="modal-header">
      <div>
        <h3 class="modal-title">问题处理</h3>
        <div class="issue-tags">
          <span class="badge badge-warning">{getIssueTypeLabel(issue.type)}</span>
          <span class="badge {getStatusBadgeClass(issue.status)}">{getStatusLabel(issue.status)}</span>
        </div>
      </div>
      <button class="close-btn" on:click={onClose}>✕</button>
    </div>

    <div class="issue-summary">
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">关联订单</span>
          <span class="summary-value font-mono">{formatOrderNo(getOrder()?.orderNo || '')}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">客户</span>
          <span class="summary-value">{getOrder()?.customerName || '-'}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">上报人</span>
          <span class="summary-value">{issue.reportedBy || '-'}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">上报时间</span>
          <span class="summary-value">{formatDateTime(issue.reportedAt)}</span>
        </div>
      </div>
      <div class="issue-title">{issue.title}</div>
      <div class="issue-desc">{issue.description}</div>
    </div>

    <div class="evidence-section">
      <div class="section-header">
        <h4>📋 证据记录</h4>
        <button class="btn-sm btn-secondary" on:click={() => addEvidence = true}>➕ 添加证据</button>
      </div>
      <div class="evidence-list">
        {#each issue.evidence as ev}
          <div class="evidence-card">
            <div class="evidence-header">
              <span class="badge {ev.type === 'photo' ? 'badge-primary' : 'badge-gray'}">
                {ev.type === 'photo' ? '📷 照片' : '📝 备注'}
              </span>
              <span class="evidence-time">{formatDateTime(ev.timestamp)}</span>
              {#if ev.author}
                <span class="evidence-author">— {ev.author}</span>
              {/if}
            </div>
            <div class="evidence-content">{ev.content}</div>
          </div>
        {/each}
      </div>
    </div>

    <div class="resolution-section">
      <h4>✅ 处理方案</h4>
      <div class="form-group">
        <label class="form-label">当前状态</label>
        <select bind:value={status}>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
          <option value="escalated">已升级</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">处理结果</label>
        <textarea bind:value={resolution} rows="3" placeholder="请输入处理结果和说明..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">赔付金额（元）</label>
        <input type="number" bind:value={compensation} min="0" placeholder="0" />
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" on:click={onClose}>取消</button>
      <button class="btn-primary" on:click={saveResolution}>保存处理结果</button>
    </div>
  </div>
</div>

{#if addEvidence}
  <div class="modal-overlay" on:click={() => addEvidence = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3 class="modal-title">添加证据</h3>
        <button class="close-btn" on:click={() => addEvidence = false}>✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">类型</label>
          <select bind:value={newEvidenceType}>
            <option value="note">文字备注</option>
            <option value="photo">照片编号</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">内容</label>
          <textarea 
            bind:value={newEvidenceContent} 
            rows="3" 
            placeholder={newEvidenceType === 'photo' ? '输入照片文件名或编号' : '输入备注内容'}
          ></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" on:click={() => addEvidence = false}>取消</button>
        <button class="btn-primary" on:click={addEvidenceItem} disabled={!newEvidenceContent}>添加</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-large {
    max-width: 700px;
  }

  .issue-tags {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .issue-summary {
    padding: 1rem 1.25rem;
    background: var(--gray-50);
    border-bottom: 1px solid var(--gray-100);
  }

  .summary-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .summary-label {
    display: block;
    font-size: 12px;
    color: var(--gray-500);
    margin-bottom: 0.25rem;
  }

  .summary-value {
    font-weight: 500;
    color: var(--gray-800);
  }

  .issue-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 0.5rem;
  }

  .issue-desc {
    color: var(--gray-600);
    line-height: 1.6;
  }

  .evidence-section {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--gray-100);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .section-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .evidence-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .evidence-card {
    background: var(--gray-50);
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
    border: 1px solid var(--gray-100);
  }

  .evidence-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .evidence-time {
    font-size: 12px;
    color: var(--gray-500);
  }

  .evidence-author {
    font-size: 12px;
    color: var(--gray-600);
  }

  .evidence-content {
    color: var(--gray-700);
  }

  .resolution-section {
    padding: 1rem 1.25rem;
  }

  .resolution-section h4 {
    margin: 0 0 1rem 0;
    font-size: 14px;
    font-weight: 600;
  }

  .font-mono {
    font-family: 'SF Mono', Monaco, monospace;
  }
</style>
