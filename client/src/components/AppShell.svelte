<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentUser } from '../lib/user';
  import type { User } from '../lib/types';

  export let user: User;

  const roleLabel: Record<string, string> = {
    manager: '门店店长',
    editor: '选片师',
    service: '客服管家'
  };

  interface NavItem { label: string; path: string; roles: string[]; }

  const navMap: Record<string, NavItem[]> = {
    manager: [
      { label: '全部订单', path: '/orders', roles: ['manager'] },
      { label: '异常队列', path: '/exceptions', roles: ['manager', 'service'] },
      { label: '团队看板', path: '/board', roles: ['manager'] }
    ],
    editor: [
      { label: '我的订单', path: '/orders', roles: ['editor'] },
      { label: '待确认版本', path: '/pending', roles: ['editor', 'service'] }
    ],
    service: [
      { label: '我的订单', path: '/orders', roles: ['service'] },
      { label: '尾款催收', path: '/collections', roles: ['service'] },
      { label: '异常队列', path: '/exceptions', roles: ['manager', 'service'] }
    ]
  };

  $: items = navMap[user.role] || [];

  function isActive(path: string) {
    if (path === '/orders') {
      return $page.url.pathname === '/orders' || $page.url.pathname.startsWith('/orders/');
    }
    return $page.url.pathname === path;
  }

  function logout() {
    currentUser.clear();
    goto('/login');
  }
</script>

<header class="top">
  <div class="brand">
    <div class="logo">婚</div>
    <div>
      <div class="title serif">婚纱影楼 · 档期与选片协同台</div>
      <div class="subtitle">Schedule · Selection · Settlement — 一条可追溯的链</div>
    </div>
  </div>
  <div class="me">
    <div class="role-badge role-{user.role}">{roleLabel[user.role]}</div>
    <div class="name">{user.name}</div>
    <button class="ghost" on:click={logout}>退出</button>
  </div>
</header>

<div class="shell">
  <aside class="side">
    <nav>
      {#each items as item}
        <button
          class="nav-item"
          class:active={isActive(item.path)}
          on:click={() => goto(item.path)}>
          {item.label}
        </button>
      {/each}
    </nav>
    <div class="tips">
      <div class="tips-title">一线动作快捷</div>
      <ul>
        <li>每一次改期都会写入时间线</li>
        <li>选片版本只追加、不覆盖</li>
        <li>异常处理从右侧抽屉发起</li>
        <li>客诉与订单同页串联，无需翻聊天</li>
      </ul>
    </div>
  </aside>

  <main class="main">
    <slot />
  </main>
</div>

<style>
  .top {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 28px;
    background: linear-gradient(180deg, rgba(255,250,241,0.96), rgba(245,241,234,0.92));
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--line);
  }
  .brand { display: flex; gap: 14px; align-items: center; }
  .logo {
    width: 44px; height: 44px; border-radius: 12px;
    display: grid; place-items: center;
    background: linear-gradient(135deg, var(--accent), #5a2626);
    color: #fff; font-family: 'Noto Serif SC', serif;
    font-size: 22px; font-weight: 900;
    box-shadow: 0 6px 18px rgba(139, 58, 58, 0.35);
  }
  .title { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
  .subtitle { font-size: 12px; color: var(--ink-2); letter-spacing: 0.5px; margin-top: 2px; }
  .me { display: flex; align-items: center; gap: 12px; }
  .name { font-size: 14px; color: var(--ink); }
  .role-badge {
    padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
    background: var(--bg-2); color: var(--ink);
  }
  .role-manager { background: #f3e0c8; color: #7d4a18; }
  .role-editor { background: #dfe9dd; color: #2a5b3e; }
  .role-service { background: #e4d8ea; color: #5a3a7a; }
  .ghost {
    background: transparent; border: 1px solid var(--line); color: var(--ink-2);
    padding: 6px 12px; border-radius: 8px; font-size: 13px;
  }
  .ghost:hover { background: var(--soft); color: var(--ink); }

  .shell { display: grid; grid-template-columns: 240px 1fr; min-height: calc(100vh - 73px); }
  .side {
    border-right: 1px solid var(--line);
    padding: 20px 16px;
    background: linear-gradient(180deg, #faf4e7, #f2e9d5);
  }
  nav { display: flex; flex-direction: column; gap: 6px; }
  .nav-item {
    text-align: left; padding: 10px 14px; border-radius: 10px;
    background: transparent; border: 1px solid transparent;
    font-size: 14px; color: var(--ink-2);
  }
  .nav-item:hover { background: var(--soft); color: var(--ink); }
  .nav-item.active {
    background: linear-gradient(135deg, #f6e1c2, #f0cf9d);
    color: #6a3d16; border-color: rgba(196, 154, 108, 0.4);
    box-shadow: 0 2px 10px rgba(196, 154, 108, 0.18);
  }
  .tips { margin-top: 26px; padding: 14px; border-radius: 12px; background: #fff7e8; border: 1px dashed #d8bb86; }
  .tips-title { font-size: 12px; color: #8c6524; font-weight: 600; letter-spacing: 0.6px; margin-bottom: 8px; }
  .tips ul { margin: 0; padding-left: 18px; color: #7a5a2b; font-size: 12px; line-height: 1.7; }
  .main { padding: 28px 32px; min-width: 0; }
</style>
