<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { listOrders, fmtTime, payPayment } from '../../lib/api';
  import { currentUser } from '../../lib/user';
  import type { Order, User } from '../../lib/types';

  let orders: Order[] = [];
  let loading = true;
  let user: User | null = null;
  let busy = false;

  currentUser.subscribe(u => { user = u; });

  $: myOrders = orders.filter(o => o.serviceId === user?.id);
  $: unpaid = myOrders.flatMap(o => o.payments.filter(p => !p.paid).map(p => ({ order: o, payment: p })));
  $: total = unpaid.reduce((s, x) => s + x.payment.amount, 0);
  $: overdue = unpaid.filter(x => new Date(x.payment.dueAt) < new Date());

  async function pay(pid: string, oid: string) {
    busy = true;
    try {
      await payPayment(oid, pid, '催收台登记到账');
      orders = await listOrders();
    } catch (e: any) { alert(e.message || '操作失败'); }
    finally { busy = false; }
  }

  function openOrder(id: string) { goto(`/orders/${id}`); }

  onMount(async () => {
    try { orders = await listOrders(); } catch { /* ignore */ }
    loading = false;
  });
</script>

<div class="head">
  <div>
    <h1 class="serif">尾款催收</h1>
    <p class="sub">仅展示您负责客服的订单中尚未支付的款项</p>
  </div>
  <div class="summary">
    <div class="sum-item">
      <div class="sum-lbl">待收笔数</div>
      <div class="sum-val">{unpaid.length}</div>
    </div>
    <div class="sum-item bad">
      <div class="sum-lbl">已逾期</div>
      <div class="sum-val">{overdue.length}</div>
    </div>
    <div class="sum-item accent">
      <div class="sum-lbl">待收总额</div>
      <div class="sum-val">¥{total.toLocaleString()}</div>
    </div>
  </div>
</div>

{#if loading}
  <div class="state">加载中…</div>
{:else if unpaid.length === 0}
  <div class="state">🎉 所有款项已收齐</div>
{:else}
  <div class="list">
    {#each unpaid as item (item.payment.id)}
      <div class="row" class:overdue={new Date(item.payment.dueAt) < new Date()}>
        <div class="left" on:click={() => openOrder(item.order.id)}>
          <div class="no">{item.order.no}</div>
          <div class="cust">{item.order.customerName}</div>
          <div class="pkg">{item.order.package}</div>
        </div>
        <div class="mid">
          <div class="stage">{item.payment.stage}</div>
          <div class="amt">¥{item.payment.amount.toLocaleString()}</div>
          <div class="due">
            到期 {fmtTime(item.payment.dueAt)}
            {#if new Date(item.payment.dueAt) < new Date()}
              <span class="overdue-tag">已逾期</span>
            {/if}
          </div>
          {#if item.payment.note}
            <div class="note">备注：{item.payment.note}</div>
          {/if}
        </div>
        <div class="right">
          <button class="primary sm" on:click={() => pay(item.payment.id, item.order.id)} disabled={busy}>
            登记到账
          </button>
          <button class="ghost sm" on:click={() => openOrder(item.order.id)}>
            查看订单
          </button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .head { margin-bottom: 22px; }
  h1 { margin: 0; font-size: 28px; letter-spacing: 3px; }
  .sub { margin: 6px 0 0; color: var(--ink-2); font-size: 13px; }
  .summary { display: flex; gap: 14px; margin-top: 16px; }
  .sum-item {
    padding: 14px 20px; border-radius: 12px;
    background: var(--soft); border: 1px solid var(--line);
    min-width: 120px;
  }
  .sum-item.bad { background: #fff3ef; border-color: #e5a7a3; }
  .sum-item.accent { background: linear-gradient(135deg, #fff7ea, #ffe8d2); border-color: #e4c9a0; }
  .sum-lbl { font-size: 11px; color: var(--ink-2); letter-spacing: 1.5px; }
  .sum-val { font-size: 24px; font-weight: 900; color: var(--ink); margin-top: 4px; }
  .sum-item.bad .sum-val { color: var(--bad); }
  .sum-item.accent .sum-val { color: var(--accent); }

  .state { padding: 80px 0; text-align: center; color: var(--ink-2); }

  .list { display: flex; flex-direction: column; gap: 12px; }
  .row {
    display: grid; grid-template-columns: 1fr auto auto;
    gap: 20px; align-items: center;
    padding: 18px 22px; border-radius: 14px;
    background: var(--soft); border: 1px solid var(--line);
  }
  .row.overdue { background: #fff3ef; border-color: #e5a7a3; }
  .left { cursor: pointer; }
  .no { font-size: 12px; color: var(--ink-2); }
  .cust { font-size: 17px; font-weight: 600; margin-top: 2px; }
  .pkg { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
  .mid { text-align: right; }
  .stage { font-size: 13px; color: var(--ink-2); }
  .amt { font-size: 24px; font-weight: 900; color: var(--accent); font-variant-numeric: tabular-nums; }
  .due { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
  .overdue-tag {
    display: inline-block; margin-left: 6px;
    padding: 1px 8px; border-radius: 999px;
    background: var(--bad); color: #fff; font-size: 11px; font-weight: 600;
  }
  .note { font-size: 12px; color: var(--ink-2); margin-top: 4px; font-style: italic; }
  .right { display: flex; flex-direction: column; gap: 8px; }
  .primary {
    padding: 8px 16px; border-radius: 10px; border: 0;
    background: linear-gradient(135deg, var(--accent), #6a2929); color: #fff; font-weight: 600;
  }
  .primary:disabled { opacity: 0.6; }
  .primary.sm, .ghost.sm { padding: 6px 14px; font-size: 12px; }
  .ghost {
    background: transparent; border: 1px solid var(--line); color: var(--ink-2);
    padding: 8px 16px; border-radius: 10px; font-size: 13px;
  }
  .ghost:hover { background: var(--soft); color: var(--ink); }
</style>
