<script lang="ts">
  import { db } from '../lib/db'
  import { STAGES } from '../lib/sampleData'
  import { formatDateTime, getStatusLabel, getStatusBadgeClass, formatOrderNo, generateId } from '../lib/utils'
  import type { Order, Batch } from '../lib/types'

  export let orders: Order[]
  export let batches: Batch[]
  export let onRefresh: () => void
  export let onSelectOrder: (order: Order) => void

  let activeStage = 0
  let showCreateBatch = false
  let newBatchType = 'wash'
  let newBatchProcessType = '普洗'
  let selectedOrderIds: string[] = []

  const processTypes = ['普洗', '精洗', '干洗', '水洗']

  $: ordersByStage = STAGES.slice(0, 7).map(stage => ({
    ...stage,
    orders: orders.filter(o => o.status === stage.key)
  }))

  function toggleOrderSelection(orderId: string) {
    if (selectedOrderIds.includes(orderId)) {
      selectedOrderIds = selectedOrderIds.filter(id => id !== orderId)
    } else {
      selectedOrderIds.push(orderId)
    }
  }

  async function createBatch() {
    if (selectedOrderIds.length === 0) return

    const batch: Batch = {
      id: generateId(),
      batchNo: `BATCH${String(Date.now()).slice(-8)}`,
      type: newBatchType as 'wash' | 'rewash',
      orderIds: [...selectedOrderIds],
      status: 'pending',
      processType: newBatchProcessType,
      createdAt: Date.now()
    }

    await db.batches.add(batch)
    
    await db.timelineEvents.add({
      id: generateId(),
      type: 'batch',
      referenceId: batch.id,
      action: newBatchType === 'rewash' ? '返洗批次创建' : '批次创建',
      description: `${newBatchProcessType} - ${selectedOrderIds.length}件`,
      timestamp: Date.now()
    })

    selectedOrderIds = []
    showCreateBatch = false
    onRefresh()
  }

  async function startBatch(batch: Batch) {
    await db.batches.update(batch.id, {
      status: 'processing',
      startTime: Date.now()
    })

    for (const orderId of batch.orderIds) {
      await db.orders.update(orderId, {
        status: 'washing',
        currentStage: 2,
        updatedAt: Date.now()
      })

      await db.processRecords.add({
        id: generateId(),
        orderId,
        stage: 2,
        stageName: '洗涤中',
        startTime: Date.now(),
        createdAt: Date.now()
      })
    }

    onRefresh()
  }

  async function completeBatch(batch: Batch) {
    await db.batches.update(batch.id, {
      status: 'completed',
      endTime: Date.now()
    })

    for (const orderId of batch.orderIds) {
      const nextStage = batch.type === 'rewash' ? 5 : 3
      const nextStatus = batch.type === 'rewash' ? 'qc' : 'drying'
      
      await db.orders.update(orderId, {
        status: nextStatus as any,
        currentStage: nextStage,
        updatedAt: Date.now()
      })

      await db.processRecords.add({
        id: generateId(),
        orderId,
        stage: nextStage,
        stageName: STAGES[nextStage].name,
        startTime: Date.now(),
        createdAt: Date.now()
      })
    }

    onRefresh()
  }

  function getBatchOrders(batch: Batch): Order[] {
    return orders.filter(o => batch.orderIds.includes(o.id))
  }
</script>

<div class="production-line">
  <div class="section-header">
    <h2>产线看板</h2>
    <div class="header-actions">
      <button class="btn-primary" on:click={() => showCreateBatch = true}>
        ➕ 创建批次
      </button>
    </div>
  </div>

  <div class="kanban-board">
    {#each ordersByStage as stage}
      <div class="kanban-column">
        <div class="kanban-header">
          <span class="kanban-title">{stage.name}</span>
          <span class="kanban-count">{stage.orders.length}</span>
        </div>
        <div class="kanban-cards">
          {#each stage.orders as order}
            <div 
              class="kanban-card {selectedOrderIds.includes(order.id) ? 'selected' : ''}"
              on:click={() => toggleOrderSelection(order.id)}
              on:dblclick={() => onSelectOrder(order)}
            >
              <div class="kanban-card-header">
                <span class="order-no">{formatOrderNo(order.orderNo)}</span>
                {#if order.priority !== 'normal'}
                  <span class="badge badge-danger">{order.priority === 'vip' ? 'VIP' : '急'}</span>
                {/if}
              </div>
              <div class="kanban-card-body">
                <div class="customer-name">{order.customerName}</div>
                <div class="item-count">{order.items.length} 件衣物</div>
                <div class="time-info">{formatDateTime(order.receivedAt)}</div>
              </div>
              {#if order.totalRewashCount > 0}
                <div class="rewash-badge">
                  🔄 返洗 {order.totalRewashCount} 次
                </div>
              {/if}
            </div>
          {/each}
          {#if stage.orders.length === 0}
            <div class="empty-column">暂无订单</div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div class="batches-section">
    <h3>📦 当前批次</h3>
    <div class="batches-grid">
      {#each batches.filter(b => b.status !== 'completed') as batch}
        <div class="card batch-card">
          <div class="batch-header">
            <div>
              <span class="batch-no">{batch.batchNo}</span>
              <span class="badge {batch.type === 'rewash' ? 'badge-danger' : 'badge-primary'}">
                {batch.type === 'rewash' ? '返洗' : '正常'}
              </span>
              <span class="badge badge-gray">{batch.processType}</span>
            </div>
            <span class="badge {batch.status === 'processing' ? 'badge-primary' : 'badge-gray'}">
              {getStatusLabel(batch.status)}
            </span>
          </div>
          <div class="batch-body">
            <div class="batch-orders">
              <strong>包含订单：</strong>
              <ul>
                {#each getBatchOrders(batch) as order}
                  <li>{formatOrderNo(order.orderNo)} - {order.customerName}</li>
                {/each}
              </ul>
            </div>
            {#if batch.startTime}
              <div class="batch-time">
                开始时间：{formatDateTime(batch.startTime)}
              </div>
            {/if}
          </div>
          <div class="batch-actions">
            {#if batch.status === 'pending'}
              <button class="btn-primary btn-sm" on:click={() => startBatch(batch)}>
                ▶️ 开始洗涤
              </button>
            {/if}
            {#if batch.status === 'processing'}
              <button class="btn-success btn-sm" on:click={() => completeBatch(batch)}>
                ✅ 完成批次
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

{#if showCreateBatch}
  <div class="modal-overlay" on:click={() => showCreateBatch = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3 class="modal-title">创建洗涤批次</h3>
        <button class="close-btn" on:click={() => showCreateBatch = false}>✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">批次类型</label>
            <select bind:value={newBatchType}>
              <option value="wash">正常洗涤</option>
              <option value="rewash">返洗</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">洗涤方式</label>
            <select bind:value={newBatchProcessType}>
              {#each processTypes as type}
                <option value={type}>{type}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">已选订单 ({selectedOrderIds.length})</label>
          {#if selectedOrderIds.length === 0}
            <div class="text-sm text-gray-500">请在看板中点击选择订单</div>
          {:else}
            <div class="selected-orders">
              {#each selectedOrderIds as id}
                {@const order = orders.find(o => o.id === id)}
                {#if order}
                  <span class="badge badge-primary">
                    {formatOrderNo(order.orderNo)}
                    <button class="remove-order" on:click={() => toggleOrderSelection(id)}>✕</button>
                  </span>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" on:click={() => showCreateBatch = false}>取消</button>
        <button class="btn-primary" on:click={createBatch} disabled={selectedOrderIds.length === 0}>
          创建批次
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .production-line {
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

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .kanban-board {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 1rem;
  }

  .kanban-column {
    min-width: 180px;
    background: var(--gray-100);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    max-height: 500px;
  }

  .kanban-header {
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: var(--gray-700);
    border-bottom: 2px solid var(--gray-200);
  }

  .kanban-title {
    font-size: 13px;
  }

  .kanban-count {
    background: white;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
  }

  .kanban-cards {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .kanban-card {
    background: white;
    border-radius: var(--radius);
    padding: 0.75rem;
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.15s ease;
  }

  .kanban-card:hover {
    box-shadow: var(--shadow);
  }

  .kanban-card.selected {
    border-color: var(--primary);
    background: rgba(37, 99, 235, 0.05);
  }

  .kanban-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .order-no {
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 11px;
    color: var(--gray-600);
  }

  .customer-name {
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 0.25rem;
  }

  .item-count {
    font-size: 12px;
    color: var(--gray-500);
  }

  .time-info {
    font-size: 11px;
    color: var(--gray-400);
    margin-top: 0.5rem;
  }

  .rewash-badge {
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 500;
  }

  .empty-column {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--gray-400);
    font-size: 12px;
  }

  .batches-section h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .batches-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .batch-card {
    display: flex;
    flex-direction: column;
  }

  .batch-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--gray-100);
  }

  .batch-no {
    font-family: 'SF Mono', Monaco, monospace;
    font-weight: 600;
    margin-right: 0.5rem;
  }

  .batch-body {
    padding: 1rem;
    flex: 1;
  }

  .batch-orders ul {
    list-style: none;
    margin: 0.5rem 0 0 0;
    padding: 0;
  }

  .batch-orders li {
    padding: 0.25rem 0;
    font-size: 13px;
    color: var(--gray-600);
  }

  .batch-time {
    margin-top: 0.75rem;
    font-size: 12px;
    color: var(--gray-500);
  }

  .batch-actions {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--gray-100);
    display: flex;
    justify-content: flex-end;
  }

  .selected-orders {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .selected-orders .badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .remove-order {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 10px;
    color: inherit;
    padding: 0;
    opacity: 0.7;
  }

  .remove-order:hover {
    opacity: 1;
  }

  .text-sm { font-size: 12px; }
  .text-gray-500 { color: var(--gray-500); }
</style>
