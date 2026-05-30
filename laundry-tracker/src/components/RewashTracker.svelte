<script lang="ts">
  import { db } from '../lib/db'
  import { formatDateTime, formatOrderNo, getIssueTypeLabel, generateId } from '../lib/utils'
  import type { Order, RewashRecord } from '../lib/types'

  export let orders: Order[]
  export let onRefresh: () => void
  export let onSelectOrder: (order: Order) => void

  let rewashRecords: RewashRecord[] = []
  let showAddRewash = false
  let selectedOrderId = ''
  let newRewashReason = ''
  let newRewashIssueType = 'stain'
  let newRewashNotes = ''

  async function loadRewashRecords() {
    rewashRecords = await db.rewashRecords.orderBy('detectedAt').reverse().toArray()
  }

  async function addRewash() {
    if (!selectedOrderId || !newRewashReason) return

    const order = orders.find(o => o.id === selectedOrderId)
    if (!order) return

    const record: RewashRecord = {
      id: generateId(),
      orderId: selectedOrderId,
      reason: newRewashReason,
      issueType: newRewashIssueType as any,
      detectedAt: Date.now(),
      rewashCount: order.totalRewashCount + 1,
      resolved: false,
      notes: newRewashNotes || undefined
    }

    await db.rewashRecords.add(record)
    await db.orders.update(selectedOrderId, {
      status: 'rewash',
      currentStage: 7,
      totalRewashCount: order.totalRewashCount + 1,
      updatedAt: Date.now()
    })

    await db.timelineEvents.add({
      id: generateId(),
      type: 'rewash',
      referenceId: record.id,
      action: '返洗登记',
      description: `${getIssueTypeLabel(newRewashIssueType)}: ${newRewashReason}`,
      timestamp: Date.now()
    })

    showAddRewash = false
    selectedOrderId = ''
    newRewashReason = ''
    newRewashNotes = ''
    await loadRewashRecords()
    onRefresh()
  }

  async function markResolved(record: RewashRecord) {
    await db.rewashRecords.update(record.id, {
      resolved: true,
      resolvedAt: Date.now()
    })

    await db.orders.update(record.orderId, {
      status: 'qc',
      currentStage: 5,
      updatedAt: Date.now()
    })

    await loadRewashRecords()
    onRefresh()
  }

  function getOrder(orderId: string): Order | undefined {
    return orders.find(o => o.id === orderId)
  }

  loadRewashRecords()
</script>

<div class="rewash-tracker">
  <div class="section-header">
    <h2>🔄 返洗跟踪</h2>
    <button class="btn-primary" on:click={() => showAddRewash = true}>
      ➕ 登记返洗
    </button>
  </div>

  <div class="stats-row">
    <div class="stat-item">
      <div class="stat-number">{rewashRecords.filter(r => !r.resolved).length}</div>
      <div class="stat-label">待处理返洗</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">{rewashRecords.filter(r => r.resolved).length}</div>
      <div class="stat-label">已处理返洗</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">{orders.filter(o => o.totalRewashCount > 1).length}</div>
      <div class="stat-label">多次返洗订单</div>
    </div>
  </div>

  <div class="card">
    <div class="card-body p-0">
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>问题类型</th>
            <th>原因</th>
            <th>返洗次数</th>
            <th>检测时间</th>
            <th>状态</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each rewashRecords as record}
            {@const order = getOrder(record.orderId)}
            <tr class={record.resolved ? 'resolved-row' : ''}>
              <td>
                <a href="#" on:click|preventDefault={() => order && onSelectOrder(order)} class="order-link">
                  {formatOrderNo(order?.orderNo || '')}
                </a>
              </td>
              <td>{order?.customerName || '-'}</td>
              <td><span class="badge badge-warning">{getIssueTypeLabel(record.issueType)}</span></td>
              <td>{record.reason}</td>
              <td><span class="badge {record.rewashCount >= 2 ? 'badge-danger' : 'badge-warning'}">第 {record.rewashCount} 次</span></td>
              <td class="text-sm text-gray-500">{formatDateTime(record.detectedAt)}</td>
              <td>
                <span class="badge {record.resolved ? 'badge-success' : 'badge-warning'}">
                  {record.resolved ? '已处理' : '待处理'}
                </span>
              </td>
              <td>
                {#if !record.resolved}
                  <button class="btn-sm btn-success" on:click={() => markResolved(record)}>
                    标记完成
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
          {#if rewashRecords.length === 0}
            <tr>
              <td colspan="8">
                <div class="empty-state">
                  <div class="empty-icon">🔄</div>
                  <div class="empty-title">暂无返洗记录</div>
                  <div class="empty-desc">质量检测发现问题时，在此处登记返洗</div>
                </div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>

{#if showAddRewash}
  <div class="modal-overlay" on:click={() => showAddRewash = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3 class="modal-title">登记返洗</h3>
        <button class="close-btn" on:click={() => showAddRewash = false}>✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">选择订单</label>
          <select bind:value={selectedOrderId}>
            <option value="">请选择订单</option>
            {#each orders.filter(o => o.status !== 'delivered') as order}
              <option value={order.id}>{formatOrderNo(order.orderNo)} - {order.customerName}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">问题类型</label>
          <select bind:value={newRewashIssueType}>
            <option value="stain">污渍残留</option>
            <option value="damage">衣物损坏</option>
            <option value="color_fade">颜色褪色</option>
            <option value="other">其他问题</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">详细原因</label>
          <textarea 
            bind:value={newRewashReason} 
            rows="3" 
            placeholder="请详细描述返洗原因..."
          ></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">备注（可选）</label>
          <textarea 
            bind:value={newRewashNotes} 
            rows="2" 
            placeholder="处理建议或注意事项..."
          ></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" on:click={() => showAddRewash = false}>取消</button>
        <button class="btn-danger" on:click={addRewash} disabled={!selectedOrderId || !newRewashReason}>
          确认返洗
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .rewash-tracker {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .section-header h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .stat-item {
    background: white;
    padding: 1.25rem;
    border-radius: var(--radius-lg);
    text-align: center;
    box-shadow: var(--shadow);
  }

  .stat-number {
    font-size: 28px;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 13px;
    color: var(--gray-500);
  }

  .resolved-row {
    opacity: 0.6;
  }

  .order-link {
    color: var(--primary);
    text-decoration: none;
    font-family: 'SF Mono', Monaco, monospace;
  }

  .order-link:hover {
    text-decoration: underline;
  }

  .p-0 { padding: 0 !important; }
  .text-sm { font-size: 12px; }
  .text-gray-500 { color: var(--gray-500); }
</style>
