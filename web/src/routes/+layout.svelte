<script lang="ts">
  import { page } from '$app/stores';
  import { api, type User } from '$lib/api';
  import { onMount } from 'svelte';

  let user: User | null = null;
  let loading = true;

  const navItems = [
    { path: '/', label: '首页仪表盘', icon: '📊' },
    { path: '/review-board', label: '连续回查面板', icon: '🔍' },
    { path: '/subsidies', label: '补贴申报', icon: '📋' },
    { path: '/fuels', label: '油料记录', icon: '⛽' }
  ];

  const roleNames: Record<string, string> = {
    director: '理事',
    dispatcher: '调度员',
    operator: '机手'
  };

  onMount(async () => {
    try {
      user = await api.getMe();
    } catch (e) {
      console.log('Not logged in');
    }
    loading = false;
  });
</script>

<div class="layout">
  <header class="header">
    <div class="header-inner">
      <div class="logo">
        <span class="logo-icon">🚜</span>
        <h1>农机合作社</h1>
        <span class="subtitle">补贴申报与资料回收系统</span>
      </div>
      {#if !loading && user}
        <div class="user-info">
          <span class="user-name">{user.name}</span>
          <span class="user-role">{roleNames[user.role]}</span>
        </div>
      {/if}
    </div>
  </header>

  <nav class="nav">
    <div class="nav-inner">
      {#each navItems as item}
        <a href={item.path} class="nav-item" class:active={$page.url.pathname === item.path}>
          <span class="nav-icon">{item.icon}</span>
          <span class="nav-label">{item.label}</span>
        </a>
      {/each}
    </div>
  </nav>

  <main class="main">
    <slot />
  </main>
</div>

<style>
  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .header-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    font-size: 32px;
  }

  .logo h1 {
    font-size: 22px;
    font-weight: 600;
  }

  .subtitle {
    font-size: 13px;
    opacity: 0.85;
    margin-left: 8px;
    padding-left: 12px;
    border-left: 1px solid rgba(255,255,255,0.3);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-name {
    font-weight: 500;
  }

  .user-role {
    background: rgba(255,255,255,0.2);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
  }

  .nav {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    gap: 4px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .nav-item:hover {
    color: #1e40af;
    background: #f1f5f9;
  }

  .nav-item.active {
    color: #1e40af;
    border-bottom-color: #3b82f6;
  }

  .nav-icon {
    font-size: 16px;
  }

  .main {
    flex: 1;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 24px;
  }
</style>
