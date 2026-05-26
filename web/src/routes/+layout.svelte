<script lang="ts">
  import { page } from '$app/stores';
  import { api, setToken, type User } from '$lib/api';
  import { onMount } from 'svelte';

  let user: User | null = null;
  let users: User[] = [];
  let loading = true;
  let showUserMenu = false;

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

  async function switchUser(selectedUser: User) {
    try {
      const result = await api.login(selectedUser.username);
      setToken(result.token);
      user = result.user;
      showUserMenu = false;
      window.location.reload();
    } catch (e) {
      console.error('Switch user failed', e);
    }
  }

  onMount(async () => {
    try {
      user = await api.getMe();
      users = await api.getUsers();
    } catch (e) {
      console.log('Not logged in or token invalid');
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
        <div class="user-menu">
          <button class="user-btn" on:click={() => showUserMenu = !showUserMenu}>
            <span class="user-name">{user.name}</span>
            <span class="user-role">{roleNames[user.role]}</span>
            <span class="arrow">{showUserMenu ? '▲' : '▼'}</span>
          </button>
          {#if showUserMenu}
            <div class="user-dropdown">
              <div class="dropdown-title">切换角色</div>
              {#each users as u}
                <button
                  class="dropdown-item"
                  class:active={u.id === user.id}
                  on:click={() => switchUser(u)}
                >
                  <span>{u.name}</span>
                  <span class="role-tag">{roleNames[u.role]}</span>
                </button>
              {/each}
            </div>
          {/if}
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

  .user-menu {
    position: relative;
  }

  .user-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.15);
    border: none;
    color: white;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .user-btn:hover {
    background: rgba(255,255,255,0.25);
  }

  .user-name {
    font-weight: 500;
  }

  .user-role {
    background: rgba(255,255,255,0.25);
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 12px;
  }

  .arrow {
    font-size: 11px;
    opacity: 0.8;
  }

  .user-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: white;
    color: #111827;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    min-width: 200px;
    z-index: 100;
    overflow: hidden;
  }

  .dropdown-title {
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .dropdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .dropdown-item:hover {
    background: #f3f4f6;
  }

  .dropdown-item.active {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .role-tag {
    font-size: 11px;
    padding: 2px 8px;
    background: #e5e7eb;
    border-radius: 8px;
    color: #4b5563;
  }

  .dropdown-item.active .role-tag {
    background: #dbeafe;
    color: #1d4ed8;
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
