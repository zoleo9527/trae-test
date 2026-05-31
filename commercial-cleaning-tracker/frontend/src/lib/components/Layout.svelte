<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser, logout } from '$lib/stores';

	export let title: string;
	export let activeMenu: string;

	const roleLabels: Record<string, string> = {
		manager: '项目主管',
		scheduler: '排班专员',
		inspector: '质检员',
		worker: '清洁员'
	};

	function handleLogout() {
		logout();
		goto('/');
	}

	$: menuItems = getMenuItems($currentUser?.role || '');

	function getMenuItems(role: string) {
		switch (role) {
			case 'manager':
				return [
					{ id: 'dashboard', label: '数据看板', path: '/manager' },
					{ id: 'trace', label: '连续回查', path: '/manager/trace' },
					{ id: 'schedule', label: '排班管理', path: '/manager/schedule' },
					{ id: 'followup', label: '回访跟踪', path: '/manager/followup' },
					{ id: 'projects', label: '项目列表', path: '/manager/projects' }
				];
			case 'scheduler':
				return [
					{ id: 'schedule', label: '排班管理', path: '/scheduler' },
					{ id: 'material', label: '耗材审批', path: '/scheduler/material' },
					{ id: 'projects', label: '项目列表', path: '/scheduler/projects' }
				];
			case 'inspector':
				return [
					{ id: 'inspect', label: '质检录入', path: '/inspector' },
					{ id: 'trace', label: '连续回查', path: '/inspector/trace' },
					{ id: 'rect', label: '整改追踪', path: '/inspector/rect' }
				];
			case 'worker':
				return [
					{ id: 'shifts', label: '我的排班', path: '/worker' },
					{ id: 'checkin', label: '打卡', path: '/worker/checkin' },
					{ id: 'material', label: '耗材申领', path: '/worker/material' },
					{ id: 'rect', label: '整改任务', path: '/worker/rect' }
				];
			default:
				return [];
		}
	}
</script>

<div class="layout">
	<aside class="sidebar">
		<div class="logo">
			<h2>清洁管理系统</h2>
		</div>
		<nav class="menu">
			{#each menuItems as item}
				<button
					class={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
					on:click={() => goto(item.path)}
				>
					{item.label}
				</button>
			{/each}
		</nav>
	</aside>

	<div class="main">
		<header class="header">
			<h1>{title}</h1>
			<div class="user-info">
				<span class="user-name">{$currentUser?.name}</span>
				<span class="user-role">{roleLabels[$currentUser?.role || '']}</span>
				<button class="logout-btn" on:click={handleLogout}>退出</button>
			</div>
		</header>

		<div class="content">
			<slot />
		</div>
	</div>
</div>

<style>
	.layout {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 240px;
		background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
		color: white;
		padding: 20px 0;
		flex-shrink: 0;
	}

	.logo {
		padding: 0 20px 20px;
		border-bottom: 1px solid #4a5568;
		margin-bottom: 16px;
	}

	.logo h2 {
		font-size: 18px;
		font-weight: 600;
	}

	.menu {
		padding: 0 12px;
	}

	.menu-item {
		display: block;
		width: 100%;
		padding: 12px 16px;
		background: transparent;
		border: none;
		color: #a0aec0;
		text-align: left;
		font-size: 14px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		margin-bottom: 4px;
	}

	.menu-item:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.menu-item.active {
		background: #667eea;
		color: white;
	}

	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.header {
		background: white;
		padding: 20px 32px;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header h1 {
		font-size: 20px;
		font-weight: 600;
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
		padding: 4px 10px;
		background: #edf2f7;
		border-radius: 4px;
		font-size: 12px;
		color: #4a5568;
	}

	.logout-btn {
		padding: 6px 16px;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		cursor: pointer;
		font-size: 13px;
		color: #4a5568;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: #f7fafc;
		border-color: #cbd5e0;
	}

	.content {
		flex: 1;
		padding: 24px 32px;
		overflow: auto;
	}
</style>
