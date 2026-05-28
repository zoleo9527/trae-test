<script>
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user';
	import ExceptionDrawer from './ExceptionDrawer.svelte';

	export let exceptionDrawerOpen = false;
	export let selectedExceptionId = null;

	$: currentUser = $user;
	$: currentPath = $page.url.pathname;

	const menuItems = [
		{ path: '/', label: '首页', icon: '🏠', roles: ['manager', 'planner', 'warehouse'] },
		{ path: '/products', label: '联名商品', icon: '🎁', roles: ['manager', 'planner', 'warehouse'] },
		{ path: '/orders', label: '订单管理', icon: '📋', roles: ['manager', 'planner', 'warehouse'] },
		{ path: '/inventory', label: '库存管理', icon: '📦', roles: ['manager', 'warehouse'] },
		{ path: '/inspections', label: '巡店检查', icon: '🔍', roles: ['manager', 'warehouse'] },
		{ path: '/exceptions', label: '异常中心', icon: '⚠️', roles: ['manager', 'planner', 'warehouse'] },
		{ path: '/reviews', label: '复盘管理', icon: '📊', roles: ['manager', 'planner'] }
	];

	function isActive(path) {
		if (path === '/') return currentPath === '/';
		return currentPath.startsWith(path);
	}

	function canSee(item) {
		if (!currentUser) return false;
		return item.roles.includes(currentUser.role);
	}

	function handleLogout() {
		user.logout();
		window.location.href = '/login';
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleString('zh-CN');
	}

	function getRoleLabel(role) {
		const map = {
			manager: '店长',
			planner: '企划专员',
			warehouse: '仓管'
		};
		return map[role] || role;
	}
</script>

<div class="app-layout">
	<aside class="sidebar">
		<div class="sidebar-header">
			<div class="logo">🏪</div>
			<div class="brand">
				<h1>文创商店</h1>
				<p>联名管理系统</p>
			</div>
		</div>

		<nav class="sidebar-nav">
			{#each menuItems as item}
				{#if canSee(item)}
					<a href={item.path} class="nav-item" class:active={isActive(item.path)}>
						<span class="nav-icon">{item.icon}</span>
						<span class="nav-label">{item.label}</span>
					</a>
				{/if}
			{/each}
		</nav>

		<div class="sidebar-footer">
			{#if currentUser}
				<div class="user-info">
					<div class="user-avatar">{currentUser.avatar}</div>
					<div class="user-details">
						<div class="user-name">{currentUser.name}</div>
						<div class="user-role">{getRoleLabel(currentUser.role)}</div>
					</div>
				</div>
				<button class="logout-btn" on:click={handleLogout}>退出登录</button>
			{/if}
		</div>
	</aside>

	<main class="main-content">
		<slot />
	</main>

	<ExceptionDrawer bind:open={exceptionDrawerOpen} exceptionId={selectedExceptionId} />
</div>

<style>
	.app-layout {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 260px;
		background: linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%);
		color: white;
		display: flex;
		flex-direction: column;
		position: fixed;
		height: 100vh;
	}

	.sidebar-header {
		padding: 24px;
		display: flex;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.logo {
		font-size: 32px;
	}

	.brand h1 {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
	}

	.brand p {
		font-size: 12px;
		color: #94a3b8;
		margin: 2px 0 0 0;
	}

	.sidebar-nav {
		flex: 1;
		padding: 16px 0;
		overflow-y: auto;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 24px;
		color: #94a3b8;
		transition: all 0.2s;
		border-left: 3px solid transparent;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.05);
		color: white;
	}

	.nav-item.active {
		background: rgba(37, 99, 235, 0.2);
		color: white;
		border-left-color: #2563eb;
	}

	.nav-icon {
		font-size: 18px;
	}

	.nav-label {
		font-size: 14px;
	}

	.sidebar-footer {
		padding: 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
	}

	.user-name {
		font-weight: 500;
		font-size: 14px;
	}

	.user-role {
		font-size: 12px;
		color: #94a3b8;
	}

	.logout-btn {
		width: 100%;
		padding: 10px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: white;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.main-content {
		flex: 1;
		margin-left: 260px;
		padding: 24px;
		min-height: 100vh;
	}
</style>
