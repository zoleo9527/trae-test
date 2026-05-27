<script lang="ts">
  import { goto } from '$app/navigation';
  import { login } from '$lib/api';
  import { currentUser } from '$lib/user';

  let username = 'manager';
  let password = '123456';
  let loading = false;
  let error = '';

  const accounts = [
    { u: 'manager', n: '林店长', r: '门店店长', hint: '全局 · 团队 · 异常统筹' },
    { u: 'editor', n: '陈选片', r: '选片师', hint: '上传版本 · 确认选片' },
    { u: 'service', n: '王管家', r: '客服管家', hint: '档期改期 · 尾款催收 · 客诉' }
  ];

  async function submit() {
    loading = true; error = '';
    try {
      const r = await login(username, password);
      localStorage.setItem('token', r.token);
      currentUser.set(r.user);
      await goto('/orders');
    } catch (e: any) {
      error = e.message || '登录失败';
    } finally {
      loading = false;
    }
  }

  function pick(u: string) {
    username = u; password = '123456';
  }
</script>

<div class="wrap">
  <div class="left">
    <div class="mark serif">缦纱集</div>
    <h1 class="serif">档期 · 选片 · 尾款<br/>一条可追溯的链</h1>
    <p class="desc">
      把散在档期表、修片群和客户聊天里的信息收拢，让改期、版本、催收都带上时间戳。
      客诉一来，不用再翻聊天记录找证据。
    </p>
    <div class="feat">
      <div><span>01</span>拍摄档期与改期留痕</div>
      <div><span>02</span>选片版本按追加管理</div>
      <div><span>03</span>尾款与异常同一时间线</div>
    </div>
  </div>

  <div class="right">
    <div class="card">
      <h2 class="serif">登录协同台</h2>
      <form on:submit|preventDefault={submit}>
        <label>账号
          <input bind:value={username} placeholder="manager / editor / service" />
        </label>
        <label>密码
          <input bind:value={password} type="password" placeholder="默认 123456" />
        </label>
        {#if error}<div class="error">{error}</div>{/if}
        <button class="primary" type="submit" disabled={loading}>
          {loading ? '登录中…' : '进入协同台'}
        </button>
      </form>

      <div class="quick">
        <div class="quick-title">测试账号 · 点一下切换</div>
        <div class="quick-list">
          {#each accounts as a}
            <button class="acct" class:on={username === a.u} on:click={() => pick(a.u)}>
              <div class="acct-u">{a.u}</div>
              <div class="acct-n">{a.n} · {a.r}</div>
              <div class="acct-h">{a.hint}</div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .wrap {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 40px;
    padding: 64px 80px;
    align-items: center;
  }
  .left { max-width: 520px; }
  .mark {
    display: inline-block;
    padding: 6px 14px; border-radius: 999px;
    background: linear-gradient(135deg, var(--accent), #5a2626);
    color: #fff; letter-spacing: 4px; font-weight: 900;
    font-size: 14px;
  }
  h1 { font-size: 44px; line-height: 1.2; margin: 22px 0 18px; letter-spacing: 2px; }
  .desc { color: var(--ink-2); line-height: 1.9; font-size: 15px; }
  .feat { margin-top: 32px; display: grid; gap: 10px; }
  .feat div {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 18px; border-radius: 12px;
    background: rgba(255, 250, 241, 0.7);
    border: 1px solid var(--line);
  }
  .feat span {
    font-family: 'Noto Serif SC', serif; font-weight: 900;
    color: var(--accent); font-size: 18px;
  }

  .right { display: flex; justify-content: center; }
  .card {
    width: 100%; max-width: 420px;
    padding: 36px; border-radius: 20px;
    background: var(--soft);
    border: 1px solid var(--line);
    box-shadow: var(--shadow);
  }
  .card h2 { margin: 0 0 22px; font-size: 24px; letter-spacing: 2px; }
  form { display: grid; gap: 14px; }
  label { font-size: 13px; color: var(--ink-2); display: grid; gap: 6px; }
  input {
    padding: 12px 14px; border-radius: 10px;
    border: 1px solid var(--line); background: #fff;
    font-size: 14px; color: var(--ink);
    transition: border-color 0.15s;
  }
  input:focus { outline: none; border-color: var(--accent-2); }
  .primary {
    margin-top: 6px;
    padding: 12px; border-radius: 10px; border: 0;
    background: linear-gradient(135deg, var(--accent), #6a2929);
    color: #fff; font-weight: 600; font-size: 15px;
    box-shadow: 0 6px 20px rgba(139, 58, 58, 0.3);
  }
  .primary:disabled { opacity: 0.6; }
  .error { padding: 10px 12px; border-radius: 10px; background: #fbe7e5; color: var(--bad); font-size: 13px; }

  .quick { margin-top: 28px; padding-top: 22px; border-top: 1px dashed var(--line); }
  .quick-title { font-size: 12px; color: var(--ink-2); margin-bottom: 10px; letter-spacing: 0.5px; }
  .quick-list { display: grid; gap: 10px; }
  .acct {
    text-align: left; padding: 12px 14px; border-radius: 12px;
    background: #fff; border: 1px solid var(--line); color: var(--ink);
    transition: all 0.15s;
  }
  .acct:hover { border-color: var(--accent-2); }
  .acct.on { background: linear-gradient(135deg, #f6e1c2, #f0cf9d); border-color: #c49a6c; }
  .acct-u { font-size: 12px; color: var(--accent); font-weight: 700; letter-spacing: 1px; }
  .acct-n { font-size: 14px; font-weight: 600; margin-top: 2px; }
  .acct-h { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
</style>
