<script lang="ts">
  import { db } from '../lib/db'
  import { formatDateTime, formatOrderNo, generateId } from '../lib/utils'
  import type { Order, HandoverRecord, Store } from '../lib/types'

  export let orders: Order[]
  export let stores: Store[]
  export let onRefresh: () => void
  export let onSelectOrder: (order: Order) => void

  let handoverRecords: HandoverRecord[] = []
  let showCreateHandover = false
  let handoverType: 'in' | 'out' = 'out'
  let selectedStoreId = ''
  let selectedOrderIds: string[] = []
  let handoverNotes = ''

  async function loadHandoverRecords() {
    handoverRecords = await db.handoverRecords.orderBy('timestamp').reverse().toArray()
  }

  $: availableOrders = orders.filter(o => {
    if (handoverType === 'out') {
      return (o.status === 'completed' || o.status === 'qc') && 
             (!selectedStoreId || o.storeId === selectedStoreId)
    } else {
      return o.status === 'pending' && 
             (!selectedStoreId || o.storeId === selectedStoreId)
    }
  })

  $: selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id))
  $: totalItems = selectedOrders.reduce((sum, o) => sum + o.items.length, 0)

  function toggleOrderSelection(orderId: string) {
    if (selectedOrderIds.includes(orderId)) {
      selectedOrderIds = selectedOrderIds.filter(id => id !== orderId)
    } else {
      selectedOrderIds.push(orderId)
    }
  }

  function selectAllOrders() {
    if (selectedOrderIds.length === availableOrders.length) {
      selectedOrderIds = []
    } else {
      selectedOrderIds = availableOrders.map(o => o.id)
    }
  }

  async function createHandover() {
    if (selectedOrderIds.length === 0 || !selectedStoreId) return

    const handover: HandoverRecord = {
      id: generateId(),
      type: handoverType,
      orderIds: [...selectedOrderIds],
      storeId: selectedStoreId,
      timestamp: Date.now(),
      notes: handoverNotes || undefined
    }

    await db.handoverRecords.add(handover)

    for (const orderId of selectedOrderIds) {
      const newStatus = handoverType === 'out' ? 'delivered' : 'sorting'
      const newStage = handoverType === 'out' ? 8 : 1
      
      await db.orders.update(orderId, {
        status: newStatus as any,
        currentStage: newStage,
        deliveredAt: handoverType === 'out' ? Date.now() : undefined,
        updatedAt: Date.now()
      })

      await db.timelineEvents.add({
        id: generateId(),
        type: 'handover',
        referenceId: handover.id,
        action: handoverType === 'out' ? '门店交接出库' : '门店送厂入库',
        description: `${getStoreName(selectedStoreId)} - ${orders.find(o => o.id === orderId)?.customerName || ''}`,
        timestamp: Date.now(),
        metadata: { orderId }
      })
    }

    showCreateHandover = false
    selectedOrderIds = []
    handoverNotes = ''
    await loadHandoverRecords()
    onRefresh()
  }

  function getStoreName(storeId: string): string {
    return stores.find(s => s.id === storeId)?.name || '-'
  }

  function getHandoverTypeLabel(type: string): string {
    return type === 'out' ? '工厂送店' : '门店送厂'
  }

  function getRecordItemCount(record: HandoverRecord): number {
    return record.orderIds.reduce((sum, id) => {
      const order = orders.find(o => o.id === id)
      return sum + (order?.items.length || 0)
    }, 0)
  }

  function viewRecordDetail(record: HandoverRecord) {
    selectedOrderIds = record.orderIds
    handoverType = record.type
    selectedStoreId = record.storeId
    showCreateHandover = true
  }

  loadHandoverRecords()
</script>

<div class="handover-manager">
  <div class="section-header">
    <h2>📦 门店交接管理</h2>
    <button class="btn-primary" on:click={() => showCreateHandover = true}>
      ➕ 新建交接单
    </button>
  </div>

  <div class="stats-row">
    <div class="stat-item">
      <div class="stat-number">{handoverRecords.filter(r => r.type === 'out').length}</div>
      <div class="stat-label">已出库交接</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">{handoverRecords.filter(r => r.type === 'in').length}</div>
      <div class="stat-label">已入库交接</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">{orders.filter(o => o.status === 'completed').length}</div>
      <div class="stat-label">待出库订单</div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <h3 class="card-title">交接记录</h3>
      <div class="filter-group">
        <select bind:value={selectedStoreId}>
          <option value="">全部门店</option>
          {#each stores as store}
            <option value={store.id}>{store.name}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="card-body p-0">
      <table>
        <thead>
          <tr>
            <th>交接类型</th>
            <th>门店</th>
            <th>订单数量</th>
            <th>衣物总数</th>
            <th>交接时间</th>
            <th>备注</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each handoverRecords.filter(r => !selectedStoreId || r.storeId === selectedStoreId) as record}
            <tr>
              <td>
                <span class="badge {record.type === 'out' ? 'badge-success' : 'badge-primary'}">
                  {getHandoverTypeLabel(record.type)}
                </span>
              </td>
              <td>{getStoreName(record.storeId)}</td>
              <td>{record.orderIds.length} 单</td>
              <td>{getRecordItemCount(record)} 件</td>
              <td class="text-sm text-gray-500">{formatDateTime(record.timestamp)}</td>
              <td>{record.notes || '-'}</td>
              <td>
                <button 
                  class="btn-sm btn-secondary" 
                  on:click={() => viewRecordDetail(record)}
                >
                  查看详情
                </button>
              </td>
            </tr>
          {/each}
          {#if handoverRecords.length === 0}
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <div class="empty-icon">📦</div>
                  <div class="empty-title">暂无交接记录</div>
                  <div class="empty-desc">点击右上角新建交接单</div>
                </div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>

{#if showCreateHandover}
  <div class="modal-overlay" on:click={() => showCreateHandover = false}>
    <div class="modal modal-large" on:click|stopPropagation>
      <div class="modal-header">
        <h3 class="modal-title">新建交接单</h3>
        <button class="close-btn" on:click={() => showCreateHandover = false}>✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">交接类型</label>
            <select bind:value={handoverType}>
              <option value="out">工厂送店</option>
              <option value="in">门店送厂</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">选择门店</label>
            <select bind:value={selectedStoreId}>
              <option value="">请选择门店</option>
              {#each stores as store}
                <option value={store.id}>{store.name}</option>
              {/each}
            </select>
          </div>
        </div>

        {#if selectedStoreId}
          <div class="order-selection">
            <div class="selection-header">
              <h4>选择订单</h4>
              <button class="btn-sm btn-secondary" on:click={selectAllOrders}>
                {selectedOrderIds.length === availableOrders.length ? '取消全选' : '全选'}
              </button>
              <span class="selection-count">已选 {selectedOrderIds.length} / {availableOrders.length}</span>
            </div>

            {#if availableOrders.length > 0}
              <div class="orders-grid">
                {#each availableOrders as order}
                  <div 
                    class="order-card {selectedOrderIds.includes(order.id) ? 'selected' : ''}"
                    on:click={() => toggleOrderSelection(order.id)}
                  >
                    <div class="order-card-header">
                      <span class="order-no">{formatOrderNo(order.orderNo)}</span>
                      <span class="badge {order.priority === 'normal' ? 'badge-gray' : 'badge-danger'}">
                        {order.priority === 'vip' ? 'VIP' : order.priority === 'urgent' ? '急' : '普'}
                      </span>
                    </div>
                    <div class="order-card-body">
                      <div class="customer-name">{order.customerName}</div>
                      <div class="item-count">{order.items.length} 件衣物</div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="empty-state small">
                <div class="empty-title">该门店暂无{handoverType === 'out' ? '待出库' : '待入库'}订单</div>
              </div>
            {/if}
          </div>
        {/if}

        <div class="form-group">
          <label class="form-label">备注（可选）</label>
          <textarea 
            bind:value={handoverNotes} 
            rows="2" 
            placeholder="交接备注..."
          ></textarea>
        </div>

        {#if selectedOrders.length > 0}
          <div class="summary-box">
            <div class="summary-title">交接汇总</div>
            <div class="summary-items">
              <span>订单数：{selectedOrders.length} 单</span>
              <span>衣物数：{totalItems} 件</span>
              <span>门店：{getStoreName(selectedStoreId)}</span>
            </div>
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" on:click={() => showCreateHandover = false}>取消</button>
        <button 
          class="btn-primary" 
          on:click={createHandover} 
          disabled={selectedOrderIds.length === 0 || !selectedStoreId}
        >
          确认交接
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .handover-manager {
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

  .filter-group {
    display: flex;
    gap: 0.5rem;
  }

  .p-0 { padding: 0 !important; }
  .text-sm { font-size: 12px; }
  .text-gray-500 { color: var(--gray-500); }

  .order-selection {
    margin: 1.5rem 0;
  }

  .selection-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .selection-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .selection-count {
    margin-left: auto;
    font-size: 13px;
    color: var(--gray-500);
  }

  .orders-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    max-height: 300px;
    overflow-y: auto;
    padding: 0.5rem;
    background: var(--gray-50);
    border-radius: var(--radius);
  }

  .order-card {
    padding: 0.75rem;
    background: white;
    border: 2px solid transparent;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s;
  }

  .order-card:hover {
    border-color: var(--gray-200);
  }

  .order-card.selected {
    border-color: var(--primary);
    background: rgba(59, 130, 246, 0.05);
  }

  .order-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .order-no {
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 12px;
    font-weight: 600;
  }

  .customer-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .item-count {
    font-size: 12px;
    color: var(--gray-500);
  }

  .summary-box {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--success-bg);
    border: 1px solid var(--success-border);
    border-radius: var(--radius);
  }

  .summary-title {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--success);
  }

  .summary-items {
    display: flex;
    gap: 1.5rem;
    font-size: 14px;
  }

  .modal-large {
    max-width: 800px;
  }

  .empty-state.small {
    padding: 2rem;
  }

  .empty-state.small .empty-title {
    font-size: 14px;
  }
</style>
