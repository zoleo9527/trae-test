<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { listOrders } from '../lib/api';
  import { fmtTime } from '../lib/api';
  import type { Order } from '../lib/types';

  let orders: Order[] = [];
  let loading = true;
  let keyword = '';

  $: filtered = orders.filter(o => !keyword || o.no.includes(keyword) || o.customerName.includes(keyword));

  onMount(async () => {
    try { orders = await listOrders(); } catch { /* ignore */ }
    loading = false;
  });

  function open(id: string) { goto(`/orders/${id}`); }

  function severityBadge(s: string) {
    return s === '高' ? 'bad' : s === '中' ? 'warn' : 'good';
  }
</script>

<div class="head">
  <div>
    <h1 class="serif">订单列表</h1>
    <p class="sub">点击任一订单进入追踪链；异常单子在左侧会被标红，点击标签也可直接打开异常抽屉。</p>
  </div>
  <input class="search" bind:value={keyword} placeholder="按单号 / 客户名搜索…" />
</div>

{#if loading}
  <div class="state">加载中…</div>
{:else if filtered.length === 0}
  <div class="state">没有符合条件的订单</div>
{:else}
  <div class="grid">
    {#each filtered as o}
      <div class="card" class:has-exc={o.exceptions.some(e => e.status !== '已关闭')} on:click={() => open(o.id)}>
        <div class="row1">
          <span class="no">{o.no}</span>
          <span class="status">{o.status}</span>
        </div>
        <div class="cust serif">{o.customerName}</div>
        <div class="pkg">{o.package}</div>

        <div class="slots">
          <div class="label">拍摄档期</div>
          {#if o.slots.length === 0}
            <div class="empty">尚未排期</div>
          {:else}
            {#each o.slots.slice(0, 2) as s}
              <div class="slot">
                <span class="dot" />
                <span>{fmtTime(s.at)}</span>
                <span class="muted">· {s.place}</span>
              </div>
            {/each}
          {/if}
        </div>

        <div class="line" />

        <div class="pay">
          {#each o.payments as p}
            <div class="pay-item" class:paid={p.paid}>
              <span>{p.stage}</span>
              <span class="amt">¥{p.amount}</span>
              <span class="state-badge">{p.paid ? '已付' : '待付'}</span>
            </div>
          {/each}
        </div>

        {#if o.exceptions.length > 0}
          <div class="exc">
            <div class="label">异常</div>
            {#each o.exceptions as e}
              {#if e.status !== '已关闭'}
                <div class="exc-item badge {severityBadge(e.severity)}">
                  <span class="sev">{e.severity}</span>
                  <span>{e.kind}</span>
                </div>
              {/if}
            {/each}
          </div>
        {/if}

        <div class="foot">
          <div class="staff">店 {o.managerName} · 片 {o.editorName} · 服 {o.serviceName}</div>
          <button class="ghost" on:click|stopPropagation={() => open(o.id)}>进入追踪链 →</button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 22px; gap: 20px; }
  h1 { margin: 0; font-size: 28px; letter-spacing: 3px; }
  .sub { margin: 6px 0 0; color: var(--ink-2); font-size: 13px; }
  .search { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--line); background: #fff; font-size: 14px; width: 280px; }
  .state { padding: 80px 0; text-align: center; color: var(--ink-2); }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 18px; }
  .card {
    background: var(--soft);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 18px;
    cursor: pointer;
    transition: transform 0.12s, box-shadow 0.12s;
  }
  .card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
  .card.has-exc { border-color: #e5a7a3; background: linear-gradient(180deg, #fff5f2, #fffaf5); }

  .row1 { display: flex; justify-content: space-between; align-items: center; }
  .no { font-size: 13px; color: var(--ink-2); letter-spacing: 0.5px; }
  .status {
    padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
    background: #ece2c8; color: #6a4b18;
  }
  .cust { font-size: 20px; margin: 6px 0 2px; letter-spacing: 1px; }
  .pkg { color: var(--ink-2); font-size: 13px; }

  .slots { margin-top: 14px; }
  .label { font-size: 11px; color: var(--ink-2); letter-spacing: 1.5px; margin-bottom: 6px; }
  .slot { display: flex; gap: 8px; align-items: center; font-size: 13px; margin: 3px 0; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-2); }
  .muted { color: var(--ink-2); }
  .empty { color: #b58860; font-style: italic; font-size: 13px; }

  .line { height: 1px; background: var(--line); margin: 14px 0; }

  .pay { display: flex; flex-direction: column; gap: 6px; }
  .pay-item { display: flex; gap: 8px; align-items: center; font-size: 13px; }
  .pay-item.paid { color: var(--good); }
  .amt { font-variant-numeric: tabular-nums; margin-left: auto; margin-right: 8px; font-weight: 600; }
  .state-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--bg-2); color: var(--ink-2); }
  .pay-item.paid .state-badge { background: #d8ecde; color: var(--good); }

  .exc { margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap; }
  .exc-item.badge { padding: 3px 10px; border-radius: 999px; font-size: 12px; display: flex; gap: 6px; align-items: center; }
  .badge.bad { background: #f5cfcb; color: #8a2620; }
  .badge.warn { background: #f3e2b7; color: #8a5f0b; }
  .badge.good { background: #d8ecde; color: var(--good); }
  .sev { font-weight: 700; }

  .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
  .staff { font-size: 12px; color: var(--ink-2); }
  .ghost { background: transparent; border: 1px solid var(--line); color: var(--accent); padding: 6px 12px; border-radius: 8px; font-size: 13px; }
  .ghost:hover { background: #fff1e2; }
</style>
