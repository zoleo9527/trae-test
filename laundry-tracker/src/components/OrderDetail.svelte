<script lang="ts">
  import { db } from '../lib/db'
  import { STAGES, sampleStores } from '../lib/sampleData'
  import { formatDateTime, formatDuration, getStatusLabel, getStatusBadgeClass, formatOrderNo, getPriorityLabel, getPriorityBadgeClass, generateId, getIssueTypeLabel } from '../lib/utils'
  import type { Order, ProcessRecord, RewashRecord, Issue, HandoverRecord, TimelineEvent } from '../lib/types'

  interface TimelineItem {
    id: string
    timestamp: number
    type: 'process-start' | 'process-end' | 'rewash' | 'rewash-complete' | 'issue' | 'handover' | 'order'
    icon: string
    dotClass: string
    title: string
    description?: string
    duration?: string
    operator?: string
  }

  export let order: Order
  export let onClose: () => void
  export let onUpdated: () => void

  let processRecords: ProcessRecord[] = []
  let rewashRecords: RewashRecord[] = []
  let issues: Issue[] = []
  let handoverRecords: HandoverRecord[] = []
  let timelineItems: TimelineItem[] = []
  let activeTab: 'timeline' | 'items' | 'issues' = 'timeline'
  let showAdvance = false
  let nextStageNotes = ''

  async function loadRelatedData() {
    processRecords = await db.processRecords.where('orderId').equals(order.id).sortBy('createdAt')
    rewashRecords = await db.rewashRecords.where('orderId').equals(order.id).sortBy('detectedAt')
    issues = await db.issues.where('orderId').equals(order.id).sortBy('reportedAt')
    
    const allHandover = await db.handoverRecords.orderBy('timestamp').reverse().toArray()
    handoverRecords = allHandover.filter(h => h.orderIds.includes(order.id))
    
    buildTimeline()
  }

  function buildTimeline() {
    const items: TimelineItem[] = []

    items.push({
      id: `order-create-${order.id}`,
      timestamp: order.receivedAt,
      type: 'order',
      icon: '📥',
      dotClass: 'success',
      title: '订单创建',
      description: `来自${getStoreName(order.storeId)}`
    })

    processRecords.forEach(record => {
      items.push({
        id: `process-start-${record.id}`,
        timestamp: record.startTime,
        type: 'process-start',
        icon: '⏳',
        dotClass: record.endTime ? 'success' : 'active',
        title: `${record.stageName} - 开始`,
        description: record.notes
      })

      if (record.endTime) {
        items.push({
          id: `process-end-${record.id}`,
          timestamp: record.endTime,
          type: 'process-end',
          icon: '✅',
          dotClass: 'success',
          title: `${record.stageName} - 完成`,
          duration: formatDuration(record.startTime, record.endTime),
          operator: record.operator
        })
      }
    })

    rewashRecords.forEach(record => {
      items.push({
        id: `rewash-${record.id}`,
        timestamp: record.detectedAt,
        type: 'rewash',
        icon: '🔄',
        dotClass: 'warning',
        title: `返洗登记（第 ${record.rewashCount} 次）`,
        description: `类型：${getIssueTypeLabel(record.issueType)}<br>原因：${record.reason}${record.notes ? `<br>备注：${record.notes}` : ''}`
      })

      if (record.resolved && record.resolvedAt) {
        items.push({
          id: `rewash-complete-${record.id}`,
          timestamp: record.resolvedAt,
          type: 'rewash-complete',
          icon: '✅',
          dotClass: 'success',
          title: `返洗完成（第 ${record.rewashCount} 次）`,
          description: '返洗处理完成，进入复检阶段',
          operator: record.operator
        })
      }
    })

    issues.forEach(issue => {
      items.push({
        id: `issue-${issue.id}`,
        timestamp: issue.reportedAt,
        type: 'issue',
        icon: '⚠️',
        dotClass: 'danger',
        title: `问题上报：${issue.title}`,
        description: issue.description,
        operator: issue.reportedBy
      })

      if (issue.status === 'resolved' && issue.resolvedAt) {
        items.push({
          id: `issue-resolved-${issue.id}`,
          timestamp: issue.resolvedAt,
          type: 'issue',
          icon: '✅',
          dotClass: 'success',
          title: `问题解决：${issue.title}`,
          description: issue.resolution,
          operator: issue.resolvedBy
        })
      }
    })

    handoverRecords.forEach(record => {
      items.push({
        id: `handover-${record.id}`,
        timestamp: record.timestamp,
        type: 'handover',
        icon: record.type === 'out' ? '📤' : '�',
        dotClass: 'primary',
        title: record.type === 'out' ? '交接出库' : '门店送厂',
        description: `门店：${getStoreName(record.storeId)}${record.notes ? `<br>备注：${record.notes}` : ''}`
      })
    })

    timelineItems = items.sort((a, b) => b.timestamp - a.timestamp)
  }

  loadRelatedData()

  function getStoreName(storeId: string): string {
    return sampleStores.find(s => s.id === storeId)?.name || '-'
  }

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
          {#each timelineItems as item}
            <div class="timeline-item">
              <div class="timeline-dot {item.dotClass}"></div>
              <div class="timeline-content">
                <div class="timeline-title">{item.icon} {item.title}</div>
                <div class="timeline-time">{formatDateTime(item.timestamp)}</div>
                {#if item.description}
                  <div class="timeline-desc">{@html item.description}</div>
                {/if}
                {#if item.duration}
                  <div class="timeline-duration">
                    ⏱️ 耗时：{item.duration}
                  </div>
                {/if}
                {#if item.operator}
                  <div class="text-sm text-gray-500 mt-1">操作人：{item.operator}</div>
                {/if}
              </div>
            </div>
          {/each}

          {#if timelineItems.length === 0}
            <div class="empty-state small">
              <div class="empty-title">暂无流程记录</div>
            </div>
          {/if}
        </div>

        {#if handoverRecords.length > 0 || rewashRecords.length > 0}
          <div class="mt-4">
            <h4 class="section-title">📋 详细记录</h4>
            
            {#if handoverRecords.length > 0}
              <div class="record-section">
                <h5 class="record-subtitle">交接记录 ({handoverRecords.length})</h5>
                <div class="record-list">
                  {#each handoverRecords as record}
                    <div class="record-item">
                      <div class="record-header">
                        <span class="badge {record.type === 'out' ? 'badge-success' : 'badge-primary'}">
                          {record.type === 'out' ? '工厂送店' : '门店送厂'}
                        </span>
                        <span class="record-time">{formatDateTime(record.timestamp)}</span>
                      </div>
                      <div class="record-body">
                        <span>门店：{getStoreName(record.storeId)}</span>
                        {#if record.notes}
                          <span class="record-notes">备注：{record.notes}</span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if rewashRecords.length > 0}
              <div class="record-section">
                <h5 class="record-subtitle">返洗记录 ({rewashRecords.length})</h5>
                <div class="record-list">
                  {#each rewashRecords as rewash}
                    <div class="record-item">
                      <div class="record-header">
                        <span class="badge badge-warning">
                          第 {rewash.rewashCount} 次返洗
                        </span>
                        <span class="record-time">{formatDateTime(rewash.detectedAt)}</span>
                        {#if rewash.resolved}
                          <span class="badge badge-success">已处理</span>
                        {/if}
                      </div>
                      <div class="record-body">
                        <span>类型：{getIssueTypeLabel(rewash.issueType)}</span>
                        <span>原因：{rewash.reason}</span>
                        {#if rewash.notes}
                          <span class="record-notes">备注：{rewash.notes}</span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
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

  .timeline-duration {
    margin-top: 0.5rem;
    font-size: 12px;
    color: var(--primary);
    font-weight: 500;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--gray-200);
  }

  .record-section {
    margin-bottom: 1.5rem;
  }

  .record-subtitle {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
    color: var(--gray-600);
  }

  .record-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .record-item {
    padding: 0.75rem 1rem;
    background: var(--gray-50);
    border-radius: var(--radius);
    border: 1px solid var(--gray-100);
  }

  .record-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .record-time {
    font-size: 12px;
    color: var(--gray-500);
    margin-left: auto;
  }

  .record-body {
    font-size: 13px;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    color: var(--gray-700);
  }

  .record-notes {
    color: var(--gray-500);
  }

  .empty-state.small {
    padding: 2rem;
  }

  .empty-state.small .empty-title {
    font-size: 14px;
  }
</style>
