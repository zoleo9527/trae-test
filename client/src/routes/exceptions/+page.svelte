<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { listOrders, fmtTime } from '../../lib/api';
  import type { Order } from '../../lib/types';

  let orders: Order[] = [];
  let loading = true;
  let filter = 'all';

  onMount(async () => {
    try { orders = await listOrders(); } catch { /* ignore */ }
    loading = false;
  });

  $: all = orders.flatMap(o => o.exceptions.map(e => ({ o, e })));
  $: list = filter === 'all' ? all : all.filter(x => x.e.status === filter);
</script>

<div class="head">
  <div>
    <h1 class="serif">异常队列</h1>
    <p class="sub">按严重程度排序，点击进入订单追踪链</p>
  </div>
  <div class="filters">
    {#each ['all', '处理中', '待处理', '已关闭'] as f}
      <button class:active={filter === f} on:click={() => filter = f}>{f === 'all' ? '全部' : f}</button>
    {/each}
  </div>
</div>

{#if loading}
  <div class="state">加载中…</div>
{:else if list.length === 0}
  <div class="state">暂无异常</div>
{:else}
  <div class="grid">
    {#each list as item (item.e.id)}
      <div class="card sev-{item.e.severity}" on:click={() => goto(`/orders/${item.o.id}`)}>
        <div class="top">
          <span class="sev">{item.e.severity}</span>
          <span class="kind">{item.e.kind}</span>
          <span class="stat">{item.e.status}</span>
        </div>
        <div class="sum">{item.e.summary}</div>
        <div class="order">
          <div class="no">{item.o.no}</div>
          <div class="cust">{item.o.customerName}</div>
        </div>
        <div class="foot">
          <span>{fmtTime(item.e.createdAt)}</span>
          <span class="arrow">→</span>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 22px; gap: 20px; }
  h1 { margin: 0; font-size: 28px; letter-spacing: 3px; }
  .sub { margin: 6px 0 0; color: var(--ink-2); font-size: 13px; }
  .filters { display: flex; gap: 8px; }
  .filters button {
    padding: 7px 14px; border-radius: 999px;
    background: #fff; border: 1px solid var(--line);
    font-size: 13px; color: var(--ink-2);
  }
  .filters button.active { background: linear-gradient(135deg, #f6e1c2, #f0cf9d); color: #6a3d16; border-color: rgba(196, 154, 108, 0.4); }
  .state { padding: 80px 0; text-align: center; color: var(--ink-2); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
  .card {
    padding: 18px; border-radius: 14px; background: var(--soft);
    border: 1px solid var(--line); cursor: pointer;
  }
  .card.sev-高 { background: linear-gradient(180deg, #fff0ed, #fffaf5); border-color: #e5a7a3; }
  .card.sev-中 { background: linear-gradient(180deg, #fdf3e0, #fffaf5); border-color: #e5c38a; }
  .top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .sev { font-size: 12px; padding: 3px 10px; border-radius: 999px; font-weight: 700; color: #fff; background: #a9342f; }
  .sev-中 .sev { background: #c9882b; }
  .sev-低 .sev { background: var(--good); }
  .kind { font-weight: 600; font-size: 14px; }
  .stat { margin-left: auto; font-size: 12px; color: var(--ink-2); }
  .sum { font-size: 14px; min-height: 38px; }
  .order { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--line); }
  .no { font-size: 12px; color: var(--ink-2); }
  .cust { font-weight: 600; font-size: 15px; margin-top: 2px; }
  .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 12px; color: var(--ink-2); }
  .arrow { color: var(--accent); }
</style>
