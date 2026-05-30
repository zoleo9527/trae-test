<script lang="ts">
  import { db } from '../lib/db'
  import { sampleStores, CLOTHING_TYPES, STAGES } from '../lib/sampleData'
  import { generateId, formatOrderNo, getStatusLabel, getStatusBadgeClass } from '../lib/utils'
  import type { Order, ClothingItem } from '../lib/types'

  export let onClose: () => void
  export let onScanned: () => void
  export let onSelectOrder: (order: Order) => void = () => {}
  export let onHandoverOrder: (order: Order) => void = () => {}

  let scanMode: 'order' | 'query' = 'order'
  let manualInput = ''
  let foundOrder: Order | null = null
  let searchError = ''
  let newOrder = {
    orderNo: '',
    storeId: sampleStores[0].id,
    customerName: '',
    customerPhone: '',
    priority: 'normal' as 'normal' | 'urgent' | 'vip'
  }
  let newItem = {
    type: CLOTHING_TYPES[0],
    color: '白色',
    brand: '',
    notes: ''
  }
  let items: ClothingItem[] = []
  let showSuccess = false
  let errorMsg = ''

  function addItem() {
    if (!newItem.type) return
    
    const item: ClothingItem = {
      id: generateId(),
      orderId: '',
      barcode: `BC${Date.now()}${String(items.length + 1).padStart(4, '0')}`,
      type: newItem.type,
      color: newItem.color,
      brand: newItem.brand || undefined,
      notes: newItem.notes || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    items = [...items, item]
    newItem.type = CLOTHING_TYPES[0]
    newItem.color = '白色'
    newItem.brand = ''
    newItem.notes = ''
  }

  function removeItem(index: number) {
    items = items.filter((_, i) => i !== index)
  }

  async function submitOrder() {
    if (!newOrder.customerName || items.length === 0) {
      errorMsg = '请填写客户姓名并添加衣物'
      return
    }

    const orderId = generateId()
    const orderNo = newOrder.orderNo || `ORD${String(Date.now()).slice(-10)}`
    
    const orderItems = items.map(item => ({
      ...item,
      orderId
    }))

    const order: Order = {
      id: orderId,
      orderNo,
      storeId: newOrder.storeId,
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone || undefined,
      items: orderItems,
      status: 'pending',
      priority: newOrder.priority,
      receivedAt: Date.now(),
      currentStage: 0,
      totalRewashCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await db.orders.add(order)
    
    await db.timelineEvents.add({
      id: generateId(),
      type: 'order',
      referenceId: orderId,
      action: '订单创建',
      description: `来自${sampleStores.find(s => s.id === newOrder.storeId)?.name || '门店'} - ${items.length}件衣物`,
      timestamp: Date.now()
    })

    showSuccess = true
    
    setTimeout(() => {
      onScanned()
      onClose()
    }, 1500)
  }

  async function searchOrder() {
    if (!manualInput.trim()) return
    
    searchError = ''
    foundOrder = null
    
    const query = manualInput.trim().toLowerCase()
    
    const allOrders = await db.orders.toArray()
    
    let order = allOrders.find(o => o.orderNo.toLowerCase() === query)
    
    if (!order) {
      order = allOrders.find(o => 
        o.items.some(item => item.barcode.toLowerCase() === query)
      )
    }
    
    if (!order && query.length >= 3) {
      order = allOrders.find(o => 
        o.orderNo.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query)
      )
    }
    
    if (order) {
      foundOrder = order
      searchError = ''
    } else {
      searchError = `未找到订单或条码：${manualInput}`
    }
  }

  function handleManualScan() {
    if (manualInput) {
      searchOrder()
    }
  }

  function handleViewOrder() {
    if (foundOrder && onSelectOrder) {
      onSelectOrder(foundOrder)
      onClose()
    }
  }

  function handleQuickHandover() {
    if (foundOrder && onHandoverOrder) {
      onHandoverOrder(foundOrder)
      onClose()
    }
  }

  function resetSearch() {
    manualInput = ''
    foundOrder = null
    searchError = ''
  }

  function getStoreName(storeId: string): string {
    return sampleStores.find(s => s.id === storeId)?.name || '-'
  }

  $: canHandover = foundOrder && (foundOrder.status === 'completed' || foundOrder.status === 'qc')

  const colors = ['白色', '黑色', '蓝色', '灰色', '红色', '蓝色', '粉色', '绿色', '黄色']
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal modal-large" on:click|stopPropagation>
    <div class="modal-header">
      <div>
        <h3 class="modal-title">📱 扫码录入</h3>
      </div>
      <button class="close-btn" on:click={onClose}>✕</button>
    </div>

    {#if showSuccess}
      <div class="success-state">
        <div class="success-icon">✅</div>
        <div class="success-text">订单创建成功！</div>
      </div>
    {:else}
      <div class="modal-body">
      <div class="scan-tabs">
        <div class="scan-tab {scanMode === 'order' ? 'active' : ''}" on:click={() => scanMode = 'order'}>
          📋 新建订单
        </div>
        <div class="scan-tab {scanMode === 'query' ? 'active' : ''}" on:click={() => { scanMode = 'query'; resetSearch(); }}>
          🔍 扫码查询
        </div>
      </div>

      {#if scanMode === 'order'}
        <div class="form-section">
          <h4>订单信息</h4>
          <div class="form-row">
            <div class="form-group">
            <label class="form-label">订单号（可选）</label>
            <input bind:value={newOrder.orderNo} placeholder="自动生成" />
          </div>
            <div class="form-group">
            <label class="form-label">门店</label>
            <select bind:value={newOrder.storeId}>
              {#each sampleStores as store}
                <option value={store.id}>{store.name}</option>
              {/each}
            </select>
          </div>
          </div>
          <div class="form-row">
            <div class="form-group">
            <label class="form-label">客户姓名 *</label>
            <input bind:value={newOrder.customerName} placeholder="请输入客户姓名" />
          </div>
            <div class="form-group">
            <label class="form-label">联系电话</label>
            <input bind:value={newOrder.customerPhone} placeholder="请输入联系电话" />
          </div>
          <div class="form-group">
            <label class="form-label">优先级</label>
            <select bind:value={newOrder.priority}>
              <option value="normal">普通</option>
              <option value="urgent">加急</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          </div>
        </div>

        <div class="form-section">
          <h4>衣物列表 ({items.length} 件</h4>
          
          {#if items.length > 0}
            <div class="items-list">
              {#each items as item, index}
                <div class="item-card">
                  <span>{item.type} - {item.color}
                  {#if item.brand}（{item.brand}）{/if}</span>
                  <button class="btn-sm btn-danger" on:click={() => removeItem(index)}>删除</button>
                </div>
              {/each}
            </div>
          {/if}

          <div class="add-item-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">衣物类型</label>
                <select bind:value={newItem.type}>
                  {#each CLOTHING_TYPES as type}
                    <option value={type}>{type}</option>
                  {/each}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">颜色</label>
                <select bind:value={newItem.color}>
                  {#each colors as color}
                    <option value={color}>{color}</option>
                  {/each}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">品牌（可选）</label>
                <input bind:value={newItem.brand} placeholder="品牌" />
              </div>
              <div class="form-group">
                <label class="form-label">备注（可选）</label>
                <input bind:value={newItem.notes} placeholder="备注" />
              </div>
            </div>
            <button class="btn-secondary" on:click={addItem}>➕ 添加衣物</button>
          </div>
        </div>

        {#if errorMsg}
          <div class="error-msg">{errorMsg}</div>
        {/if}
      {:else}
        <div class="scan-section">
          <div class="manual-scan">
            <input 
              bind:value={manualInput}
              placeholder="输入订单号或衣物条码，按回车查询"
              on:keydown={(e) => e.key === 'Enter' && handleManualScan()}
              autofocus
            />
            <button class="btn-primary" on:click={handleManualScan}>查询</button>
          </div>
          
          {#if searchError}
            <div class="error-msg">{searchError}</div>
          {/if}

          {#if foundOrder}
            <div class="order-result">
              <div class="order-result-header">
                <div>
                  <span class="order-no">{formatOrderNo(foundOrder.orderNo)}</span>
                  <span class="badge {getStatusBadgeClass(foundOrder.status)}">{getStatusLabel(foundOrder.status)}</span>
                </div>
                {#if foundOrder.priority !== 'normal'}
                  <span class="badge badge-danger">{foundOrder.priority === 'vip' ? 'VIP' : '加急'}</span>
                {/if}
              </div>
              
              <div class="order-result-body">
                <div class="info-row">
                  <span class="info-label">客户：</span>
                  <span class="info-value">{foundOrder.customerName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">门店：</span>
                  <span class="info-value">{getStoreName(foundOrder.storeId)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">衣物：</span>
                  <span class="info-value">{foundOrder.items.length} 件</span>
                </div>
                <div class="info-row">
                  <span class="info-label">当前工序：</span>
                  <span class="info-value">{STAGES[foundOrder.currentStage]?.name || '-'}</span>
                </div>
                {#if foundOrder.totalRewashCount > 0}
                  <div class="info-row">
                    <span class="info-label">返洗次数：</span>
                    <span class="info-value text-danger">{foundOrder.totalRewashCount} 次</span>
                  </div>
                {/if}
              </div>

              <div class="items-preview">
                <h5>衣物明细</h5>
                <div class="items-list">
                  {#each foundOrder.items as item}
                    <div class="item-tag">
                      <span class="item-barcode">{item.barcode}</span>
                      <span class="item-name">{item.type} - {item.color}</span>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="order-result-actions">
                <button class="btn-secondary" on:click={handleViewOrder}>
                  📋 查看详情
                </button>
                {#if canHandover}
                  <button class="btn-success" on:click={handleQuickHandover}>
                    📦 交接出库
                  </button>
                {/if}
                <button class="btn-secondary" on:click={resetSearch}>
                  继续查询
                </button>
              </div>
            </div>
          {/if}

          {#if !foundOrder && !searchError}
            <div class="camera-hint">
              <div class="hint-text">
                💡 提示：连接扫码枪扫描条码后会自动查询，按回车确认
              </div>
              <div class="hint-text small">
                支持查询：订单号、衣物条码、客户姓名（模糊匹配）
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" on:click={onClose}>取消</button>
      {#if scanMode === 'order'}
        <button class="btn-primary" on:click={submitOrder} disabled={items.length === 0 || !newOrder.customerName}>
          创建订单
        </button>
      {/if}
    </div>
    {/if}
  </div>
</div>

<style>
  .modal-large {
    max-width: 700px;
  }

  .success-state {
    padding: 3rem;
    text-align: center;
  }

  .success-icon {
    font-size: 64px;
    margin-bottom: 1rem;
  }

  .success-text {
    font-size: 24px;
    font-weight: 600;
    color: var(--success);
  }

  .scan-tabs {
    display: flex;
    border-bottom: 2px solid var(--gray-200);
    margin-bottom: 1.5rem;
  }

  .scan-tab {
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    color: var(--gray-500);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
  }

  .scan-tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }

  .form-section h4 {
    margin: 0 0 1rem 0;
    font-size: 14px;
    font-weight: 600;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .item-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--gray-50);
    border-radius: var(--radius);
    border: 1px solid var(--gray-100);
  }

  .add-item-form {
    padding: 1rem;
    background: var(--gray-50);
    border-radius: var(--radius);
    border: 1px solid var(--gray-100);
  }

  .manual-scan {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .manual-scan input {
    flex: 1;
  }

  .scanned-list h4 {
    margin: 0 0 0.75rem 0;
    font-size: 14px;
    font-weight: 600;
  }

  .barcode-items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .barcode-items .badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .barcode-items button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
  }

  .camera-hint {
    margin-top: 2rem;
    padding: 1rem;
    background: var(--gray-50);
    border-radius: var(--radius);
    text-align: center;
    color: var(--gray-600);
  }

  .error-msg {
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
    border-radius: var(--radius);
    margin-top: 1rem;
  }

  .order-result {
    margin-top: 1.5rem;
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .order-result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: var(--gray-50);
    border-bottom: 1px solid var(--gray-200);
  }

  .order-result-header .order-no {
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 16px;
    font-weight: 600;
    margin-right: 0.75rem;
  }

  .order-result-body {
    padding: 1rem 1.25rem;
  }

  .info-row {
    display: flex;
    margin-bottom: 0.5rem;
  }

  .info-row:last-child {
    margin-bottom: 0;
  }

  .info-label {
    width: 80px;
    color: var(--gray-500);
    flex-shrink: 0;
  }

  .info-value {
    color: var(--gray-800);
    font-weight: 500;
  }

  .info-value.text-danger {
    color: var(--danger);
  }

  .items-preview {
    padding: 1rem 1.25rem;
    background: var(--gray-50);
    border-top: 1px solid var(--gray-200);
  }

  .items-preview h5 {
    margin: 0 0 0.75rem 0;
    font-size: 13px;
    font-weight: 600;
  }

  .items-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .item-tag {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: white;
    border: 1px solid var(--gray-200);
    border-radius: var(--radius);
    font-size: 12px;
  }

  .item-barcode {
    font-family: 'SF Mono', Monaco, monospace;
    color: var(--gray-500);
  }

  .item-name {
    color: var(--gray-700);
  }

  .order-result-actions {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--gray-200);
  }

  .order-result-actions .btn-success {
    background: var(--success);
    color: white;
  }

  .order-result-actions .btn-success:hover {
    background: #059669;
  }

  .hint-text.small {
    font-size: 12px;
    margin-top: 0.5rem;
    opacity: 0.8;
  }
</style>
