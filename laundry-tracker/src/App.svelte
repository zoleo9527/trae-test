<script lang="ts">
  import { onMount } from 'svelte'
  import { db, exportData, importData } from './lib/db'
  import { loadSampleData, STAGES } from './lib/sampleData'
  import { formatDateTime, getStatusLabel, getStatusBadgeClass, formatOrderNo } from './lib/utils'
  import type { Order, Batch, Issue, TimelineEvent } from './lib/types'
  import OrderDetail from './components/OrderDetail.svelte'
  import BatchDetail from './components/BatchDetail.svelte'
  import IssueDetail from './components/IssueDetail.svelte'
  import Scanner from './components/Scanner.svelte'
  import ImportExport from './components/ImportExport.svelte'
  import ProductionLine from './components/ProductionLine.svelte'
  import RewashTracker from './components/RewashTracker.svelte'

  let activeTab: 'dashboard' | 'production' | 'rewash' | 'issues' | 'handover' = 'dashboard'
  let orders: Order[] = []
  let batches: Batch[] = []
  let issues: Issue[] = []
  let timelineEvents: TimelineEvent[] = []
  let selectedOrder: Order | null = null
  let selectedBatch: Batch | null = null
  let selectedIssue: Issue | null = null
  let showScanner = false
  let showImportExport = false
  let searchQuery = ''
  let filterStatus = 'all'
  let filterStore = 'all'
  let stores: { id: string; name: string }[] = []

  onMount(async () => {
    await loadSampleData()
    await refreshData()
  })

  async function refreshData() {
    orders = await db.orders.orderBy('receivedAt').reverse().toArray()
    batches = await db.batches.orderBy('createdAt').reverse().toArray()
    issues = await db.issues.orderBy('reportedAt').reverse().toArray()
    timelineEvents = await db.timelineEvents.orderBy('timestamp').reverse().limit(20).toArray()
    stores = await db.stores.toArray()
  }

  $: filteredOrders = orders.filter(o => {
    const matchSearch = searchQuery === '' || 
      o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.includes(searchQuery)
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    const matchStore = filterStore === 'all' || o.storeId === filterStore
    return matchSearch && matchStatus && matchStore
  })

  $: stats = {
    total: orders.length,
    processing: orders.filter(o => ['sorting', 'washing', 'drying', 'ironing'].includes(o.status)).length,
    qc: orders.filter(o => o.status === 'qc').length,
    rewash: orders.filter(o => o.status === 'rewash').length,
    completed: orders.filter(o => ['completed', 'delivered'].includes(o.status)).length,
    issues: issues.filter(i => i.status !== 'resolved').length
  }

  async function handleExport() {
    const data = await exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laundry-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(file: File) {
    const text = await file.text()
    await importData(text)
    await refreshData()
  }

  function getStoreName(storeId: string): string {
    return stores.find(s => s.id === storeId)?.name || storeId
  }
</script>

<header class="app-header">
  <div class="header-left">
    <h1>🧺 洗涤工厂管理系统</h1>
    <span class="subtitle">产线排程与返洗跟踪</span>
  </div>
  <div class="header-right">
    <button class="btn-secondary" on:click={() => showScanner = true}>
      📱 扫码录入
    </button>
    <button class="btn-secondary" on:click={() => showImportExport = true}>
      💾 导入/导出
    </button>
  </div>
</header>

<nav class="app-nav">
  <div class="tabs">
    <div 
      class="tab {activeTab === 'dashboard' ? 'active' : ''}"
      on:click={() => activeTab = 'dashboard'}
    >
      📊 总览
    </div>
    <div 
      class="tab {activeTab === 'production' ? 'active' : ''}"
      on:click={() => activeTab = 'production'}
    >
      🏭 产线排程
    </div>
    <div 
      class="tab {activeTab === 'rewash' ? 'active' : ''}"
      on:click={() => activeTab = 'rewash'}
    >
      🔄 返洗跟踪
    </div>
    <div 
      class="tab {activeTab === 'issues' ? 'active' : ''}"
      on:click={() => activeTab = 'issues'}
    >
      ⚠️ 问题处理 {stats.issues > 0 && `<span class="badge badge-danger">${stats.issues}</span>`}
    </div>
    <div 
      class="tab {activeTab === 'handover' ? 'active' : ''}"
      on:click={() => activeTab = 'handover'}
    >
      📦 交接管理
    </div>
  </div>
</nav>

<main class="app-main">
  {#if activeTab === 'dashboard'}
    <div class="dashboard">
      <div class="stats-grid">
        <div class="card stat-card">
          <div class="stat-value">{stats.total}</div>
          <div class="stat-label">总订单数</div>
        </div>
        <div class="card stat-card processing">
          <div class="stat-value">{stats.processing}</div>
          <div class="stat-label">处理中</div>
        </div>
        <div class="card stat-card qc">
          <div class="stat-value">{stats.qc}</div>
          <div class="stat-label">质检中</div>
        </div>
        <div class="card stat-card rewash">
          <div class="stat-value">{stats.rewash}</div>
          <div class="stat-label">返洗中</div>
        </div>
        <div class="card stat-card success">
          <div class="stat-value">{stats.completed}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="card stat-card warning">
          <div class="stat-value">{stats.issues}</div>
          <div class="stat-label">待处理问题</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">最新订单</h3>
            <button class="btn-sm btn-primary" on:click={() => activeTab = 'production'}>查看全部</button>
          </div>
          <div class="card-body p-0">
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>客户</th>
                  <th>门店</th>
                  <th>状态</th>
                  <th>时间</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {#each filteredOrders.slice(0, 8) as order}
                  <tr>
                    <td class="font-mono">{formatOrderNo(order.orderNo)}</td>
                    <td>{order.customerName}</td>
                    <td>{getStoreName(order.storeId)}</td>
                    <td><span class="badge {getStatusBadgeClass(order.status)}">{getStatusLabel(order.status)}</span></td>
                    <td class="text-sm text-gray-500">{formatDateTime(order.receivedAt)}</td>
                    <td>
                      <button class="btn-sm btn-secondary" on:click={() => selectedOrder = order}>详情</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">最近动态</h3>
          </div>
          <div class="card-body">
            <div class="timeline">
              {#each timelineEvents as event}
                <div class="timeline-item">
                  <div class="timeline-dot {event.type === 'issue' ? 'danger' : event.type === 'batch' ? 'warning' : 'success'}"></div>
                  <div class="timeline-content">
                    <div class="timeline-title">{event.action}</div>
                    <div class="timeline-time">{formatDateTime(event.timestamp)}</div>
                    {#if event.description}
                      <div class="timeline-desc">{event.description}</div>
                    {/if}
                    {#if event.operator}
                      <div class="text-sm text-gray-500 mt-1">操作人：{event.operator}</div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else if activeTab === 'production'}
    <ProductionLine {orders} {batches} onRefresh={refreshData} onSelectOrder={(o) => selectedOrder = o} />
  {:else if activeTab === 'rewash'}
    <RewashTracker {orders} onRefresh={refreshData} onSelectOrder={(o) => selectedOrder = o} />
  {:else if activeTab === 'issues'}
    <div class="page-content">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">问题处理中心</h3>
        </div>
        <div class="card-body p-0">
          <table>
            <thead>
              <tr>
                <th>问题类型</th>
                <th>标题</th>
                <th>订单号</th>
                <th>状态</th>
                <th>上报人</th>
                <th>上报时间</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each issues as issue}
                <tr>
                  <td><span class="badge badge-warning">{issue.type}</span></td>
                  <td>{issue.title}</td>
                  <td class="font-mono">{formatOrderNo(orders.find(o => o.id === issue.orderId)?.orderNo || '')}</td>
                  <td><span class="badge {getStatusBadgeClass(issue.status)}">{getStatusLabel(issue.status)}</span></td>
                  <td>{issue.reportedBy || '-'}</td>
                  <td class="text-sm text-gray-500">{formatDateTime(issue.reportedAt)}</td>
                  <td>
                    <button class="btn-sm btn-primary" on:click={() => selectedIssue = issue}>处理</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {:else if activeTab === 'handover'}
    <div class="page-content">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">门店交接</h3>
          <button class="btn-primary">新建交接单</button>
        </div>
        <div class="card-body">
          <div class="form-row mb-4">
            <div class="form-group">
              <label class="form-label">交接类型</label>
              <select>
                <option value="in">门店送厂</option>
                <option value="out">工厂送店</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">门店</label>
              <select bind:value={filterStore}>
                <option value="all">全部门店</option>
                {#each stores as store}
                  <option value={store.id}>{store.name}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <div class="empty-title">暂无交接记录</div>
            <div class="empty-desc">扫码录入订单后，可在此处批量交接</div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</main>

{#if selectedOrder}
  <OrderDetail order={selectedOrder} onClose={() => selectedOrder = null} onUpdated={refreshData} />
{/if}

{#if selectedBatch}
  <BatchDetail batch={selectedBatch} onClose={() => selectedBatch = null} onUpdated={refreshData} />
{/if}

{#if selectedIssue}
  <IssueDetail issue={selectedIssue} onClose={() => selectedIssue = null} onUpdated={refreshData} />
{/if}

{#if showScanner}
  <Scanner onClose={() => showScanner = false} onScanned={refreshData} />
{/if}

{#if showImportExport}
  <ImportExport 
    onClose={() => showImportExport = false} 
    onExport={handleExport}
    onImport={handleImport}
  />
{/if}

<style>
  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: white;
    border-bottom: 1px solid var(--gray-200);
  }

  .header-left {
    display: flex;
    align-items: baseline;
    gap: 1rem;
  }

  .header-left h1 {
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-800);
    margin: 0;
  }

  .subtitle {
    color: var(--gray-500);
    font-size: 14px;
  }

  .header-right {
    display: flex;
    gap: 0.75rem;
  }

  .app-nav {
    background: white;
    border-bottom: 1px solid var(--gray-200);
    padding: 0 1.5rem;
  }

  .app-main {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
  }

  .stat-card {
    text-align: center;
    padding: 1.25rem;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--gray-800);
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    font-size: 13px;
    color: var(--gray-500);
  }

  .stat-card.processing .stat-value { color: var(--primary); }
  .stat-card.qc .stat-value { color: var(--warning); }
  .stat-card.rewash .stat-value { color: var(--danger); }
  .stat-card.success .stat-value { color: var(--success); }
  .stat-card.warning .stat-value { color: var(--warning); }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
  }

  .page-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .font-mono {
    font-family: 'SF Mono', Monaco, monospace;
  }

  .text-sm { font-size: 12px; }
  .text-gray-500 { color: var(--gray-500); }
  .p-0 { padding: 0 !important; }
  .mb-4 { margin-bottom: 1.5rem !important; }
  .mt-1 { margin-top: 0.25rem; }
</style>
