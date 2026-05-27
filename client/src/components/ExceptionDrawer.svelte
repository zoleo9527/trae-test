<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    createException, closeException,
    addSlot,
    addSelection, confirmSelection,
    payPayment, fmtTime
  } from '$lib/api';
  import type { ExceptionItem, Order } from '$lib/types';

  export let open: boolean;
  export let order: Order;
  export let mode: 'new' | 'view';
  export let exceptionId: string | null;
  export let canManageSlot: boolean = true;
  export let canManageSelection: boolean = true;
  export let canManagePayment: boolean = true;
  export let canManageException: boolean = true;

  const dispatch = createEventDispatcher();

  let active: ExceptionItem | null = null;

  $: if (mode === 'view' && exceptionId) {
    active = order.exceptions.find(e => e.id === exceptionId) || null;
  } else {
    active = null;
  }

  let kind = '改期漏改';
  let severity = '高';
  let summary = '';
  let detail = '';
  let note = '';
  let err = '';
  let busy = false;

  let showSlotForm = false;
  let slotForm = { at: '', place: '', photographer: '' };
  let showSelForm = false;
  let selForm = { photos: '', note: '' };

  async function submit() {
    busy = true; err = '';
    try {
      await createException(order.id, { kind, severity, summary, detail });
      dispatch('refresh');
      dispatch('close');
    } catch (e: any) { err = e.message || '提交失败'; }
    finally { busy = false; }
  }

  async function closeExc() {
    if (!active) return;
    busy = true; err = '';
    try {
      await closeException(order.id, active.id, note || '处理完毕');
      dispatch('refresh');
      dispatch('close');
    } catch (e: any) { err = e.message || '关闭失败'; }
    finally { busy = false; }
  }

  async function submitSlot() {
    if (!slotForm.at || !slotForm.place) return;
    busy = true; err = '';
    try {
      await addSlot(order.id, slotForm);
      showSlotForm = false;
      slotForm = { at: '', place: '', photographer: '' };
      dispatch('refresh');
    } catch (e: any) { err = e.message || '提交失败'; }
    finally { busy = false; }
  }

  async function submitSel() {
    const photos = selForm.photos.split(/[,，\s]+/).filter(Boolean);
    if (photos.length === 0) { err = '至少填写 1 张照片编号'; return; }
    busy = true; err = '';
    try {
      await addSelection(order.id, { photos, note: selForm.note });
      showSelForm = false;
      selForm = { photos: '', note: '' };
      dispatch('refresh');
    } catch (e: any) { err = e.message || '提交失败'; }
    finally { busy = false; }
  }

  async function confirmSel(id: string, version: number, cur: boolean) {
    await confirmSelection(order.id, id, !cur, version);
    dispatch('refresh');
  }

  async function pay(pid: string) {
    await payPayment(order.id, pid, '抽屉内登记');
    dispatch('refresh');
  }
</script>

{#if open}
  <div class="backdrop" on:click={() => dispatch('close')} />
  <aside class="drawer" on:click|stopPropagation>
    <header>
      <h3 class="serif">
        {#if mode === 'view'}异常详情{:else}发起异常 / 常用动作{/if}
      </h3>
      <button class="x" on:click={() => dispatch('close')}>×</button>
    </header>

    {#if mode === 'view' && active}
      <div class="view">
        <div class="tag-sev sev-{active.severity}">{active.severity} · {active.kind}</div>
        <div class="title">{active.summary}</div>
        <div class="meta">
          状态：<b>{active.status}</b> · 发起：{fmtTime(active.createdAt)}
          {#if active.handledBy} · 处理人：{active.handledBy}{/if}
        </div>
        <div class="block">
          <div class="bl">详细描述</div>
          <div class="bd">{active.detail || '—'}</div>
        </div>

        {#if canManageException && active.status !== '已关闭'}
          <div class="block">
            <div class="bl">关闭备注</div>
            <textarea bind:value={note} rows="3" placeholder="关闭异常的处理说明" />
          </div>
          {#if err}<div class="error">{err}</div>{/if}
          <button class="primary full" on:click={closeExc} disabled={busy}>关闭并留痕</button>
        {/if}
      </div>
    {:else}
      <div class="quick">
        {#if canManageSlot || canManageSelection}
          <div class="q-title">一线常用动作 · 一键提交</div>
          <div class="q-grid">
            {#if canManageSlot}
              <button class="q-btn" on:click={() => showSlotForm = !showSlotForm}>
                <div class="q-icon">📅</div><div class="q-label">新增档期</div>
              </button>
            {/if}
            {#if canManageSelection}
              <button class="q-btn" on:click={() => showSelForm = !showSelForm}>
                <div class="q-icon">🖼️</div><div class="q-label">上传选片版本</div>
              </button>
            {/if}
          </div>

          {#if canManageSlot && showSlotForm}
            <div class="mini-form">
              <label>日期时间<input type="datetime-local" bind:value={slotForm.at} /></label>
              <label>地点<input bind:value={slotForm.place} /></label>
              <label>摄影师<input bind:value={slotForm.photographer} /></label>
              <button class="primary" on:click={submitSlot}>提交档期</button>
            </div>
          {/if}

          {#if canManageSelection && showSelForm}
            <div class="mini-form">
              <label>照片编号（逗号或空格分隔）<input bind:value={selForm.photos} placeholder="IMG_1001, IMG_1002" /></label>
              <label>备注<input bind:value={selForm.note} /></label>
              <button class="primary" on:click={submitSel}>上传新版本</button>
            </div>
          {/if}
        {/if}

        {#if canManageSelection}
          <div class="sub">待确认版本</div>
          {#each order.selections.filter(s => !s.confirmed) as s}
            <div class="sel-row">
              <div>
                <div class="s-v">v{s.version} · {s.photos.length} 张</div>
                <div class="s-note">{s.note}</div>
              </div>
              <button class="primary sm" on:click={() => confirmSel(s.id, s.version, s.confirmed)}>确认</button>
            </div>
          {:else}
            <div class="empty-sm">全部已确认</div>
          {/each}
        {/if}

        {#if canManagePayment}
          <div class="sub">待收款项</div>
          {#each order.payments.filter(p => !p.paid) as p}
            <div class="sel-row">
              <div>
                <div class="s-v">{p.stage} · ¥{p.amount}</div>
                <div class="s-note">到期 {fmtTime(p.dueAt)}</div>
              </div>
              <button class="primary sm" on:click={() => pay(p.id)}>登记到账</button>
            </div>
          {:else}
            <div class="empty-sm">全部已付</div>
          {/each}
        {/if}

        {#if canManageException}
          <div class="sub">发起异常</div>
          <div class="form">
            <label>类型
              <select bind:value={kind}>
                <option>改期漏改</option>
                <option>修片版本混乱</option>
                <option>尾款催收</option>
                <option>客户投诉</option>
                <option>其他</option>
              </select>
            </label>
            <label>严重程度
              <select bind:value={severity}>
                <option>高</option><option>中</option><option>低</option>
              </select>
            </label>
            <label>摘要<input bind:value={summary} placeholder="一句话描述问题" /></label>
            <label>详细描述
              <textarea bind:value={detail} rows="4" placeholder="具体情况、影响、涉及的聊天/证据"></textarea>
            </label>
            {#if err}<div class="error">{err}</div>{/if}
            <button class="primary full" on:click={submit} disabled={busy}>发起并写入追踪链</button>
          </div>
        {/if}

        {#if !canManageSlot && !canManageSelection && !canManagePayment && !canManageException}
          <div class="no-perm">当前账号在本订单上没有操作权限</div>
        {/if}
      </div>
    {/if}
  </aside>
{/if}

<style>
  .backdrop {
    position: fixed; inset: 0; background: rgba(31, 27, 22, 0.35);
    z-index: 50;
    animation: fade 0.15s ease;
  }
  @keyframes fade { from { opacity: 0 } to { opacity: 1 } }

  .drawer {
    position: fixed; top: 0; right: 0; bottom: 0; width: 460px;
    background: var(--soft); z-index: 60;
    border-left: 1px solid var(--line);
    box-shadow: -10px 0 40px rgba(0,0,0,0.12);
    display: flex; flex-direction: column;
    animation: slide 0.2s ease;
  }
  @keyframes slide { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  .drawer header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 18px 22px; border-bottom: 1px solid var(--line);
  }
  .drawer h3 { margin: 0; font-size: 18px; letter-spacing: 2px; }
  .x { background: transparent; border: 0; font-size: 22px; color: var(--ink-2); }

  .view { padding: 20px 22px; overflow-y: auto; }
  .tag-sev { display: inline-block; font-size: 12px; padding: 3px 10px; border-radius: 999px; font-weight: 700; color: #fff; }
  .sev-高 { background: #a9342f; }
  .sev-中 { background: #c9882b; }
  .sev-低 { background: var(--good); }
  .title { font-size: 17px; font-weight: 600; margin-top: 10px; }
  .meta { font-size: 12px; color: var(--ink-2); margin-top: 4px; }
  .block { margin-top: 18px; }
  .bl { font-size: 12px; color: var(--ink-2); letter-spacing: 1px; margin-bottom: 6px; }
  .bd { padding: 12px; background: #fff; border: 1px solid var(--line); border-radius: 10px; font-size: 13px; line-height: 1.6; }

  .quick { padding: 18px 22px; overflow-y: auto; flex: 1; }
  .q-title { font-size: 12px; color: var(--ink-2); letter-spacing: 1px; margin-bottom: 10px; }
  .q-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .q-btn {
    padding: 14px 12px; border-radius: 12px;
    background: #fff; border: 1px solid var(--line);
    text-align: left;
  }
  .q-btn:hover { border-color: var(--accent-2); }
  .q-icon { font-size: 22px; }
  .q-label { font-size: 13px; margin-top: 4px; font-weight: 600; }

  .mini-form {
    padding: 14px; border-radius: 12px; background: #fff7eb;
    border: 1px dashed #d8bb86; margin-bottom: 18px;
    display: grid; gap: 8px;
  }
  .mini-form label { font-size: 12px; color: var(--ink-2); display: grid; gap: 4px; }
  .mini-form input, .mini-form textarea, .mini-form select {
    padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line); background: #fff; font-size: 13px;
  }

  .sub { font-size: 12px; color: var(--ink-2); letter-spacing: 1px; margin: 16px 0 8px; }
  .sel-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 12px; border-radius: 10px; background: #fff;
    border: 1px solid var(--line); margin-bottom: 6px;
  }
  .s-v { font-size: 13px; font-weight: 600; }
  .s-note { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
  .empty-sm { font-size: 12px; color: var(--ink-2); font-style: italic; padding: 4px 0; }
  .no-perm { padding: 20px; text-align: center; color: var(--ink-2); font-size: 13px; }

  .form { display: grid; gap: 10px; margin-top: 8px; }
  .form label { font-size: 12px; color: var(--ink-2); display: grid; gap: 4px; }
  .form input, .form textarea, .form select {
    padding: 9px 12px; border-radius: 10px; border: 1px solid var(--line); background: #fff; font-size: 13px;
  }
  .form textarea { resize: vertical; }
  .primary {
    padding: 10px 16px; border-radius: 10px; border: 0;
    background: linear-gradient(135deg, var(--accent), #6a2929); color: #fff; font-weight: 600;
  }
  .primary:disabled { opacity: 0.6; }
  .primary.full { width: 100%; margin-top: 6px; }
  .primary.sm { padding: 6px 12px; font-size: 12px; }
  .error { padding: 10px 12px; border-radius: 10px; background: #fbe7e5; color: var(--bad); font-size: 13px; }
</style>
