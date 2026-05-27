<script lang="ts">
  import { onMount } from 'svelte';
  import { listOrders, fmtTime } from '$lib/api';
  import type { Order } from '$lib/types';

  let orders: Order[] = [];
  let loading = true;

  onMount(async () => {
    try { orders = await listOrders(); } catch { /* ignore */ }
    loading = false;
  });

  $: stats = {
    total: orders.length,
    inProgress: orders.filter(o => ['拍摄中', '选片中'].includes(o.status)).length,
    withExc: orders.filter(o => o.exceptions.some(e => e.status !== '已关闭')).length,
    unpaid: orders.reduce((n, o) => n + o.payments.filter(p => !p.paid).length, 0),
    overdueExc: orders.reduce((n, o) => n + o.exceptions.filter(e => e.status !== '已关闭').length, 0)
  };
</script>

<div class="head">
  <h1 class="serif">团队看板</h1>
  <p class="sub">门店全貌 · 一眼可见</p>
</div>

<div class="cards">
  <div class="kpi">
    <div class="lbl">在途订单</div>
    <div class="val">{stats.inProgress} <span class="tot">/ {stats.total}</span></div>
  </div>
  <div class="kpi">
    <div class="lbl">进行中异常</div>
    <div class="val bad">{stats.overdueExc}</div>
    <div class="tip">含高严重度 {orders.reduce((n, o) => n + o.exceptions.filter(e => e.status !== '已关闭' && e.severity === '高').length, 0)} 项</div>
  </div>
  <div class="kpi">
    <div class="lbl">待收款项</div>
    <div class="val">{stats.unpaid}</div>
  </div>
  <div class="kpi">
    <div class="lbl">异常订单数</div>
    <div class="val">{stats.withExc}</div>
  </div>
</div>

<div class="card list">
  <h2 class="serif">异常订单一览</h2>
  {#if loading}
    <div class="state">加载中…</div>
  {:else}
    {#each orders.filter(o => o.exceptions.some(e => e.status !== '已关闭')) as o}
      <div class="row">
        <div>
          <div class="no">{o.no}</div>
          <div class="cust">{o.customerName}</div>
        </div>
        <div class="excs">
          {#each o.exceptions.filter(e => e.status !== '已关闭') as e}
            <span class="sev sev-{e.severity}">{e.severity}</span>
            <span class="k">{e.kind}</span>
          {/each}
        </div>
        <div class="stamp">{fmtTime(o.exceptions.find(e => e.status !== '已关闭')!.createdAt)}</div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .head { margin-bottom: 22px; }
  h1 { margin: 0; font-size: 28px; letter-spacing: 3px; }
  .sub { margin: 6px 0 0; color: var(--ink-2); font-size: 13px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-bottom: 22px; }
  .kpi {
    padding: 18px; border-radius: 14px; background: var(--soft);
    border: 1px solid var(--line);
  }
  .lbl { font-size: 12px; color: var(--ink-2); letter-spacing: 1.5px; }
  .val { font-size: 32px; font-weight: 900; color: var(--accent); margin-top: 6px; }
  .val.bad { color: #a9342f; }
  .tot { font-size: 14px; color: var(--ink-2); font-weight: 400; }
  .tip { font-size: 12px; color: var(--ink-2); margin-top: 6px; }
  .card { padding: 20px; border-radius: 14px; background: var(--soft); border: 1px solid var(--line); }
  .card h2 { margin: 0 0 12px; font-size: 17px; letter-spacing: 2px; }
  .state { padding: 20px 0; text-align: center; color: var(--ink-2); }
  .row {
    display: grid; grid-template-columns: 1fr 1fr auto;
    gap: 16px; padding: 12px 0; border-bottom: 1px dashed var(--line); align-items: center;
  }
  .row:last-child { border-bottom: 0; }
  .no { font-size: 12px; color: var(--ink-2); }
  .cust { font-size: 15px; font-weight: 600; }
  .excs { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .sev { font-size: 11px; padding: 2px 8px; border-radius: 999px; font-weight: 700; color: #fff; }
  .sev-高 { background: #a9342f; }
  .sev-中 { background: #c9882b; }
  .k { font-size: 12px; color: var(--ink); }
  .stamp { font-size: 12px; color: var(--ink-2); font-variant-numeric: tabular-nums; }
</style>
