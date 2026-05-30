<script lang="ts">
  import { db } from '../lib/db'
  import { STAGES } from '../lib/sampleData'
  import { formatDateTime, formatDuration, getStatusLabel, getStatusBadgeClass, formatOrderNo, getPriorityLabel, getPriorityBadgeClass, generateId } from '../lib/utils'
  import type { Order, ProcessRecord, RewashRecord, Issue } from '../lib/types'

  export let order: Order
  export let onClose: () => void
  export let onUpdated: () => void

  let processRecords: ProcessRecord[] = []
  let rewashRecords: RewashRecord[] = []
  let issues: Issue[] = []
  let activeTab: 'timeline' | 'items' | 'issues' = 'timeline'
  let showAdvance = false
  let nextStageNotes = ''

  async function loadRelatedData() {
    processRecords = await db.processRecords.where('orderId').equals(order.id).sortBy('createdAt')
    rewashRecords = await db.rewashRecords.where('orderId').equals(order.id).sortBy('detectedAt')
    issues = await db.issues.where('orderId').equals(order.id).sortBy('reportedAt')
  }

  loadRelatedData()

  async function advanceStage() {
    if (order.currentStage >= 6) return

    const nextStage = order.currentStage + 1
    const nextStatus = STAGES[nextStage]?.key || 'completed'
    const nextStageName = STAGES[nextStage]?.name || '已完成'

    await db.processRecords.where('orderId').equals(order.id).and(r => r.stage === order.currentStage).modify({
      endTime: Date.now()
    })

    await db.processRecords.add({
      id: generateId(),
      orderId: order.id,
      stage: nextStage,
      stageName: nextStageName,
      startTime: Date.now(),
      notes: nextStageNotes || undefined,
      createdAt: Date.now()
    })

    await db.orders.update(order.id, {
      status: nextStatus as any,
      currentStage: nextStage,
      updatedAt: Date.now()
    })

    await db.timelineEvents.add({
      id: generateId(),
      type: 'order',
      referenceId: order.id,
      action: '工序推进',
      description: `从 ${STAGES[order.currentStage]?.name || ''} 进入 ${nextStageName}`,
      timestamp: Date.now(),
      metadata: { notes: nextStageNotes || undefined }
    })

    order.currentStage = nextStage
    order.status = nextStatus as any

    nextStageNotes = ''
    showAdvance = false
    await loadRelatedData()
    onUpdated()
  }

  $: currentProcess = processRecords.find(r => r.stage === order.currentStage)
  $: nextStageName = STAGES[order.currentStage + 1]?.name || '已完成'
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal modal-large" on:click|stopPropagation>
    <div class="modal-header">
      <div>
        <h3 class="modal-title">订单详情 - {formatOrderNo(order.orderNo)}</h3>
        <div class="order-meta">
          <span class="badge {getStatusBadgeClass(order.status)}">{getStatusLabel(order.status)}</span>
          <span class="badge {getPriorityBadgeClass(order.priority)}">{getPriorityLabel(order.priority)}</span>
          {#if order.totalRewashCount > 0}
            <span class="badge badge-danger">返洗 {order.totalRewashCount} 次</span>
          {/if}
        </div>
      </div>
      <button class="close-btn" on:click={onClose}>✕</button>
    </div>

    <div class="order-info">
      <div class="info-row">
        <div class="info-item">
          <span class="info-label">客户姓名</span>
          <span class="info-value">{order.customerName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">联系电话</span>
          <span class="info-value">{order.customerPhone || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">收衣时间</span>
          <span class="info-value">{formatDateTime(order.receivedAt)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">预计交付</span>
          <span class="info-value">{order.estimatedDelivery ? formatDateTime(order.estimatedDelivery) : '-'}</span>
        </div>
      </div>
    </div>

    <div class="tabs">
      <div class="tab {activeTab === 'timeline' ? 'active' : ''}" on:click={() => activeTab = 'timeline'}>
        📋 流程记录
      </div>
      <div class="tab {activeTab === 'items' ? 'active' : ''}" on:click={() => activeTab = 'items'}>
        👕 衣物明细
      </div>
      <div class="tab {activeTab === 'issues' ? 'active' : ''}" on:click={() => activeTab = 'issues'}>
        ⚠️ 问题记录 {issues.length > 0 && `<span class="badge badge-danger">${issues.length}</span>`}
      </div>
    </div>

    <div class="modal-body modal-body-scroll">
      {#if activeTab === 'timeline'}
        <div class="timeline">
          {#each processRecords as record}
            <div class="timeline-item">
              <div class="timeline-dot {record.endTime ? 'success' : 'active'}"></div>
              <div class="timeline-content">
                <div class="timeline-title">{record.stageName}</div>
                <div class="timeline-time">
                  开始：{formatDateTime(record.startTime)}
                  {#if record.endTime}
                    <br>完成：{formatDateTime(record.endTime)}
                    <br>耗时：{formatDuration(record.startTime, record.endTime)}
                  {/if}
                </div>
                {#if record.notes}
                  <div class="timeline-desc">备注：{record.notes}</div>
                {/if}
                {#if record.operator}
                  <div class="text-sm text-gray-500 mt-1">操作人：{record.operator}</div>
                {/if}
              </div>
            </div>
          {/each}

          {#each rewashRecords as rewash}
            <div class="timeline-item">
              <div class="timeline-dot danger"></div>
              <div class="timeline-content">
                <div class="timeline-title">🔄 返洗登记（第 {rewash.rewashCount} 次）</div>
                <div class="timeline-time">{formatDateTime(rewash.detectedAt)}</div>
                <div class="timeline-desc">
                  <strong>原因：</strong>{rewash.reason}
                  {#if rewash.notes}
                    <br><strong>备注：</strong>{rewash.notes}
                  {/if}
                </div>
                {#if rewash.resolved}
                  <div class="text-sm text-success mt-1">✓ 已处理</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else if activeTab === 'items'}
        <table>
          <thead>
            <tr>
              <th>条码</th>
              <th>类型</th>
              <th>颜色</th>
              <th>品牌</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {#each order.items as item}
              <tr>
                <td class="font-mono">{item.barcode}</td>
                <td>{item.type}</td>
                <td>{item.color}</td>
                <td>{item.brand || '-'}</td>
                <td>{item.notes || '-'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else if activeTab === 'issues'}
        {#if issues.length === 0}
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <div class="empty-title">暂无问题记录</div>
            <div class="empty-desc">该订单处理过程中未发现问题</div>
          </div>
        {:else}
          {#each issues as issue}
            <div class="issue-card card">
              <div class="issue-header">
                <div>
                  <span class="badge badge-warning">{issue.type}</span>
                  <strong>{issue.title}</strong>
                </div>
                <span class="badge {getStatusBadgeClass(issue.status)}">{getStatusLabel(issue.status)}</span>
              </div>
              <div class="issue-body">
                <p>{issue.description}</p>
                <div class="issue-meta">
                  <span>上报人：{issue.reportedBy || '-'}</span>
                  <span>上报时间：{formatDateTime(issue.reportedAt)}</span>
                </div>
                {#if issue.evidence.length > 0}
                  <div class="evidence-list">
                    <strong>证据：</strong>
                    {#each issue.evidence as ev}
                      <div class="evidence-item">
                        <span class="badge {ev.type === 'photo' ? 'badge-primary' : 'badge-gray'}">
                          {ev.type === 'photo' ? '📷 照片' : '📝 备注'}
                        </span>
                        <span>{ev.content}</span>
                        <span class="text-sm text-gray-500">{formatDateTime(ev.timestamp)}</span>
                      </div>
                    {/each}
                  </div>
                {/if}
                {#if issue.resolution}
                  <div class="resolution">
                    <strong>处理结果：</strong>{issue.resolution}
                    {#if issue.compensation}
                      <br><strong>赔付金额：</strong>¥{issue.compensation}
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      {/if}
    </div>

    <div class="modal-footer">
      {#if order.currentStage < 6 && order.status !== 'rewash'}
        <button class="btn-primary" on:click={() => showAdvance = true}>
          ➡️ 推进到「{nextStageName}」
        </button>
      {/if}
      <button class="btn-secondary" on:click={onClose}>关闭</button>
    </div>
  </div>
</div>

{#if showAdvance}
  <div class="modal-overlay" on:click={() => showAdvance = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3 class="modal-title">推进工序</h3>
        <button class="close-btn" on:click={() => showAdvance = false}>✕</button>
      </div>
      <div class="modal-body">
        <p>确定将订单推进到「{nextStageName}」吗？</p>
        <div class="form-group mt-4">
          <label class="form-label">备注（可选）</label>
          <textarea bind:value={nextStageNotes} rows="2" placeholder="输入备注信息..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" on:click={() => showAdvance = false}>取消</button>
        <button class="btn-primary" on:click={advanceStage}>确认推进</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-large {
    max-width: 800px;
  }

  .order-info {
    padding: 1rem 1.25rem;
    background: var(--gray-50);
    border-bottom: 1px solid var(--gray-100);
  }

  .order-meta {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .info-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
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

  .modal-body-scroll {
    max-height: 400px;
    overflow-y: auto;
  }

  .font-mono {
    font-family: 'SF Mono', Monaco, monospace;
  }

  .text-sm { font-size: 12px; }
  .text-gray-500 { color: var(--gray-500); }
  .text-success { color: var(--success); }
  .mt-1 { margin-top: 0.25rem; }
  .mt-4 { margin-top: 1rem; }

  .issue-card {
    margin-bottom: 1rem;
  }

  .issue-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--gray-100);
  }

  .issue-body {
    padding: 1rem;
  }

  .issue-meta {
    display: flex;
    gap: 1.5rem;
    font-size: 12px;
    color: var(--gray-500);
    margin-top: 0.5rem;
  }

  .evidence-list {
    margin-top: 1rem;
  }

  .evidence-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--gray-50);
    border-radius: var(--radius);
    margin-top: 0.5rem;
  }

  .resolution {
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(16, 185, 129, 0.1);
    border-radius: var(--radius);
    color: var(--success);
  }
</style>
