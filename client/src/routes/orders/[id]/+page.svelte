<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getOrder, fmtTime } from '../../lib/api';
  import ExceptionDrawer from '../../components/ExceptionDrawer.svelte';
  import type { Order } from '../../lib/types';

  let order: Order | null = null;
  let loading = true;
  let drawerOpen = false;
  let drawerMode: 'new' | 'view' = 'new';
  let activeExceptionId: string | null = null;

  $: orderId = $page.params.id;

  onMount(async () => {
    try { order = await getOrder(orderId); } catch (e: any) { alert(e.message || '加载失败'); }
    loading = false;
  });

  async function refresh() {
    order = await getOrder(orderId);
  }

  function openNewExc() { drawerMode = 'new'; activeExceptionId = null; drawerOpen = true; }
  function viewExc(id: string) { drawerMode = 'view'; activeExceptionId = id; drawerOpen = true; }

  function closeDrawer() { drawerOpen = false; }
</script>

{#if loading}
  <div class="state">加载中…</div>
{:else if !order}
  <div class="state">订单不存在</div>
{:else}
  <div class="crumb">
    <button class="link" on:click={() => goto('/orders')}>订单列表</button>
    <span class="sep">/</span>
    <span>{order.no}</span>
  </div>

  <div class="hero">
    <div class="hero-left">
      <div class="tag">订单号</div>
      <h1 class="serif">{order.no}</h1>
      <div class="cust">{order.customerName} · {order.customerPhone}</div>
      <div class="pkg">{order.package}</div>
      <div class="roles">
        <span>店长 <b>{order.managerName}</b></span>
        <span>选片师 <b>{order.editorName}</b></span>
        <span>客服 <b>{order.serviceName}</b></span>
      </div>
    </div>
    <div class="hero-right">
      <div class="status">{order.status}</div>
      <button class="primary" on:click={openNewExc}>+ 发起异常</button>
    </div>
  </div>

  <div class="sections">
    <section class="card">
      <header><h2 class="serif">档期</h2><span class="muted">{order.slots.length} 段</span></header>
      {#if order.slots.length === 0}
        <p class="empty">尚未排期</p>
      {:else}
        <ul class="slots">
          {#each order.slots as s}
            <li>
              <div class="dot" />
              <div class="slot-main">
                <div class="time">{fmtTime(s.at)}</div>
                <div class="meta">{s.place} · 摄影 {s.photographer}</div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="card">
      <header><h2 class="serif">选片版本</h2><span class="muted">{order.selections.length} 个版本</span></header>
      {#if order.selections.length === 0}
        <p class="empty">还未上传选片</p>
      {:else}
        <div class="versions">
          {#each order.selections as sel}
            <div class="version" class:confirmed={sel.confirmed}>
              <div class="v-top">
                <span class="v-tag serif">v{sel.version}</span>
                <span class="v-time">{fmtTime(sel.createdAt)}</span>
                <span class="v-badge" class:on={sel.confirmed}>{sel.confirmed ? '客户已确认' : '待确认'}</span>
              </div>
              <div class="v-by">选片师：{sel.editorName}</div>
              <div class="v-note">{sel.note || '—'}</div>
              <div class="v-photos">
                {#each sel.photos.slice(0, 8) as p}
                  <span class="chip">{p}</span>
                {/each}
                {#if sel.photos.length > 8}
                  <span class="chip more">+{sel.photos.length - 8}</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <section class="card">
      <header><h2 class="serif">尾款催收</h2><span class="muted">{order.payments.length} 笔</span></header>
      <ul class="pays">
        {#each order.payments as p}
          <li class:paid={p.paid}>
            <div class="stage">{p.stage}</div>
            <div class="amt">¥{p.amount}</div>
            <div class="meta">到期 {fmtTime(p.dueAt)}</div>
            <div class="badge" class:paid={p.paid}>{p.paid ? '已付' : '待催收'}</div>
          </li>
        {/each}
      </ul>
    </section>

    <section class="card">
      <header>
        <h2 class="serif">异常</h2>
        <span class="muted">{order.exceptions.filter(e => e.status !== '已关闭').length} 个进行中 / {order.exceptions.length} 总计</span>
      </header>
      {#if order.exceptions.length === 0}
        <p class="empty">暂无异常</p>
      {:else}
        <ul class="excs">
          {#each order.exceptions as e}
            <li class:open={e.status !== '已关闭'} on:click={() => viewExc(e.id)}>
              <div class="sev sev-{e.severity}">{e.severity}</div>
              <div class="exc-main">
                <div class="kind">{e.kind} <span class="stat">· {e.status}</span></div>
                <div class="sum">{e.summary}</div>
                <div class="muted">{fmtTime(e.createdAt)} {#if e.handledBy}· 处理人 {e.handledBy}{/if}</div>
              </div>
              <span class="arrow">→</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="card full">
      <header><h2 class="serif">追踪链 · 时间线</h2><span class="muted">每一次动作都有记录</span></header>
      <ol class="timeline">
        {#each order.timeline as t}
          <li class="stage-{t.stage === '异常' ? 'exc' : t.stage === '尾款' ? 'pay' : t.stage === '选片' ? 'sel' : 'slot'}">
            <div class="tl-dot" />
            <div class="tl-main">
              <div class="tl-top">
                <span class="tl-stage stage-badge">{t.stage}</span>
                <span class="tl-time">{fmtTime(t.at)}</span>
                <span class="tl-actor">{t.actor}</span>
              </div>
              <div class="tl-action">{t.action}</div>
              {#if t.detail}<div class="tl-detail">{t.detail}</div>{/if}
            </div>
          </li>
        {/each}
      </ol>
    </section>
  </div>

  <ExceptionDrawer
    bind:open={drawerOpen}
    {order}
    mode={drawerMode}
    exceptionId={activeExceptionId}
    on:refresh={refresh}
    on:close={closeDrawer} />
{/if}

<style>
  .state { padding: 60px 0; text-align: center; color: var(--ink-2); }
  .crumb { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; color: var(--ink-2); font-size: 13px; }
  .link { background: transparent; border: 0; color: var(--accent); font-size: 13px; padding: 0; }
  .sep { color: var(--line); }

  .hero {
    display: flex; justify-content: space-between; align-items: flex-start;
    background: linear-gradient(135deg, #fff7ea, #ffe8d2);
    border: 1px solid #e4c9a0;
    border-radius: 18px;
    padding: 26px 30px;
    margin-bottom: 24px;
    box-shadow: 0 8px 30px rgba(196, 154, 108, 0.12);
  }
  .tag { font-size: 11px; letter-spacing: 2px; color: var(--accent); }
  h1 { margin: 4px 0 8px; font-size: 28px; letter-spacing: 3px; }
  .cust { font-size: 18px; font-weight: 600; }
  .pkg { color: var(--ink-2); margin-top: 4px; font-size: 13px; }
  .roles { margin-top: 14px; display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; color: var(--ink-2); }
  .roles b { color: var(--ink); font-weight: 600; }
  .hero-right { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
  .status { padding: 6px 14px; border-radius: 999px; background: #fff; border: 1px solid #e4c9a0; font-size: 13px; font-weight: 600; }
  .primary {
    padding: 10px 18px; border-radius: 10px; border: 0;
    background: linear-gradient(135deg, var(--accent), #6a2929); color: #fff;
    font-weight: 600;
  }

  .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .card {
    background: var(--soft); border: 1px solid var(--line); border-radius: 14px; padding: 20px;
  }
  .card.full { grid-column: 1 / -1; }
  header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
  header h2 { margin: 0; font-size: 17px; letter-spacing: 2px; }
  .muted { color: var(--ink-2); font-size: 12px; }
  .empty { color: #b58860; font-style: italic; font-size: 13px; margin: 10px 0 0; }

  .slots, .excs, .pays { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .slots li { display: flex; gap: 12px; align-items: flex-start; padding: 10px 12px; border-radius: 10px; background: #fff7eb; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent-2); margin-top: 6px; flex-shrink: 0; }
  .slot-main .time { font-variant-numeric: tabular-nums; font-weight: 600; font-size: 14px; }
  .slot-main .meta { color: var(--ink-2); font-size: 12px; margin-top: 2px; }

  .versions { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .version {
    padding: 14px; border-radius: 12px; background: #fff; border: 1px solid var(--line);
    border-left: 4px solid var(--accent-2);
  }
  .version.confirmed { border-left-color: var(--good); background: #f3faef; }
  .v-top { display: flex; align-items: center; gap: 12px; }
  .v-tag { font-size: 18px; font-weight: 900; color: var(--accent); }
  .v-time { color: var(--ink-2); font-size: 12px; margin-left: auto; }
  .v-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #f3e2b7; color: #8a5f0b; }
  .v-badge.on { background: #d8ecde; color: var(--good); }
  .v-by { font-size: 12px; color: var(--ink-2); margin-top: 6px; }
  .v-note { font-size: 13px; margin: 6px 0; }
  .v-photos { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { font-size: 11px; padding: 3px 8px; background: var(--bg-2); border-radius: 999px; color: var(--ink); }
  .chip.more { background: var(--accent); color: #fff; }

  .pays li {
    display: grid; grid-template-columns: 1fr auto auto auto; gap: 14px;
    align-items: center; padding: 12px 14px; border-radius: 10px;
    background: #fff; border: 1px solid var(--line);
  }
  .pays li.paid { background: #f3faef; border-color: #c6e1ce; }
  .stage { font-weight: 600; }
  .amt { font-variant-numeric: tabular-nums; color: var(--accent); font-weight: 700; }
  .pays .meta { color: var(--ink-2); font-size: 12px; }
  .badge { font-size: 11px; padding: 3px 10px; border-radius: 999px; background: #f3e2b7; color: #8a5f0b; }
  .badge.paid { background: #d8ecde; color: var(--good); }

  .excs li {
    display: flex; gap: 12px; align-items: center; padding: 12px 14px;
    border-radius: 12px; background: #fff; border: 1px solid var(--line);
    cursor: pointer;
  }
  .excs li.open { background: #fff3ef; border-color: #e5a7a3; }
  .sev { font-size: 11px; padding: 3px 10px; border-radius: 999px; font-weight: 700; color: #fff; flex-shrink: 0; }
  .sev-高 { background: #a9342f; }
  .sev-中 { background: #c9882b; }
  .sev-低 { background: var(--good); }
  .exc-main { flex: 1; min-width: 0; }
  .kind { font-weight: 600; font-size: 14px; }
  .stat { color: var(--ink-2); font-weight: 400; font-size: 12px; }
  .sum { font-size: 13px; color: var(--ink); margin-top: 2px; }
  .arrow { color: var(--accent); }

  .timeline { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; position: relative; }
  .timeline::before {
    content: ''; position: absolute; left: 7px; top: 6px; bottom: 6px;
    width: 2px; background: linear-gradient(180deg, var(--accent-2), transparent);
  }
  .timeline li { display: flex; gap: 16px; position: relative; }
  .tl-dot {
    width: 16px; height: 16px; border-radius: 50%;
    background: var(--soft); border: 3px solid var(--accent-2);
    flex-shrink: 0; margin-top: 2px; z-index: 1;
  }
  .timeline .stage-exc .tl-dot { border-color: var(--bad); }
  .timeline .stage-pay .tl-dot { border-color: var(--good); }
  .timeline .stage-sel .tl-dot { border-color: #2b6fa0; }
  .tl-main { flex: 1; }
  .tl-top { display: flex; gap: 10px; align-items: center; font-size: 12px; }
  .stage-badge {
    font-size: 11px; padding: 2px 8px; border-radius: 999px;
    background: #f3e2b7; color: #8a5f0b; font-weight: 600; letter-spacing: 1px;
  }
  .timeline .stage-exc .stage-badge { background: #f5cfcb; color: #8a2620; }
  .timeline .stage-pay .stage-badge { background: #d8ecde; color: var(--good); }
  .timeline .stage-sel .stage-badge { background: #d2e3ef; color: #2b6fa0; }
  .tl-time { color: var(--ink-2); font-variant-numeric: tabular-nums; }
  .tl-actor { color: var(--ink-2); margin-left: auto; }
  .tl-action { font-size: 14px; font-weight: 600; margin-top: 4px; }
  .tl-detail { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
</style>
