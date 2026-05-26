<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { listOrders, fmtTime } from '../../lib/api';
  import { currentUser } from '../../lib/user';
  import type { Order, User } from '../../lib/types';

  let orders: Order[] = [];
  let allOrders: Order[] = [];
  let loading = true;
  let user: User | null = null;

  currentUser.subscribe(u => { user = u; });

  onMount(async () => {
    try { allOrders = await listOrders(); } catch { /* ignore */ }
    loading = false;
  });

  $: if (user) {
    if (user.role === 'manager') {
      orders = allOrders;
    } else if (user.role === 'editor') {
      orders = allOrders.filter(o => o.editorId === user.id);
    } else {
      orders = allOrders.filter(o => o.serviceId === user.id);
    }
  }

  $: items = orders.flatMap(o => o.selections.filter(s => !s.confirmed).map(s => ({ o, s })));
</script>

<div class="head">
  <div>
    <h1 class="serif">待确认版本</h1>
    <p class="sub">所有未确认的选片版本，避免"修片版本混乱"</p>
  </div>
</div>

{#if loading}
  <div class="state">加载中…</div>
{:else if items.length === 0}
  <div class="state">全部已确认 🎉</div>
{:else}
  <div class="list">
    {#each items as item (item.s.id)}
      <div class="row" on:click={() => goto(`/orders/${item.o.id}`)}>
        <div class="ver serif">v{item.s.version}</div>
        <div class="main">
          <div class="no">{item.o.no} · {item.o.customerName}</div>
          <div class="note">{item.s.note || '—'}</div>
          <div class="photos">
            {#each item.s.photos.slice(0, 10) as p}
              <span class="chip">{p}</span>
            {/each}
            {#if item.s.photos.length > 10}<span class="chip more">+{item.s.photos.length - 10}</span>{/if}
          </div>
        </div>
        <div class="right">
          <div class="editor">{item.s.editorName}</div>
          <div class="time">{fmtTime(item.s.createdAt)}</div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .head { margin-bottom: 22px; }
  h1 { margin: 0; font-size: 28px; letter-spacing: 3px; }
  .sub { margin: 6px 0 0; color: var(--ink-2); font-size: 13px; }
  .state { padding: 80px 0; text-align: center; color: var(--ink-2); }
  .list { display: flex; flex-direction: column; gap: 12px; }
  .row {
    display: grid; grid-template-columns: 72px 1fr auto;
    gap: 18px; padding: 16px 20px;
    background: var(--soft); border: 1px solid var(--line); border-radius: 14px;
    align-items: center; cursor: pointer;
  }
  .row:hover { border-color: var(--accent-2); }
  .ver { font-size: 22px; font-weight: 900; color: var(--accent); text-align: center; }
  .no { font-size: 13px; color: var(--ink-2); }
  .note { font-size: 14px; margin-top: 2px; }
  .photos { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 5px; }
  .chip { font-size: 11px; padding: 3px 8px; background: var(--bg-2); border-radius: 999px; }
  .chip.more { background: var(--accent); color: #fff; }
  .right { text-align: right; font-size: 12px; color: var(--ink-2); }
  .editor { font-weight: 600; color: var(--ink); }
  .time { margin-top: 4px; font-variant-numeric: tabular-nums; }
</style>
