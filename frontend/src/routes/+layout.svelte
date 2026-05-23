<script>
	import { page } from '$app/stores';
	import { currentUser, userRole } from '$lib/stores';
	import { onMount } from 'svelte';
	import { Home, ClipboardList, Settings, Users } from 'lucide-svelte';

	let menuOpen = false;

	async function loadUser() {
		try {
			const res = await fetch('http://localhost:8080/api/users/current', {
				headers: {
					'X-User-Role': localStorage.getItem('userRole') || 'inspector'
				}
			});
			const user = await res.json();
			currentUser.set(user);
		} catch (e) {
			console.error('Failed to load user');
		}
	}

	function switchRole(role) {
		localStorage.setItem('userRole', role);
		userRole.set(role);
		loadUser();
		menuOpen = false;
	}

	$: role = $userRole;

	onMount(() => {
		const savedRole = localStorage.getItem('userRole');
		if (savedRole) {
			userRole.set(savedRole);
		}
		loadUser();
	});

	const navItems = [
		{ path: '/', label: '首页看板', icon: Home },
		{ path: '/defects', label: '缺陷管理', icon: ClipboardList }
	];

	const roleLabels = {
		station_master: '站长',
		inspector: '巡检工程师',
		admin: '运维内勤'
	};
</script>

<div class="app">
	<aside class="sidebar">
		<div class="logo">
			<div class="logo-icon">☀️</div>
			<span>光伏运维系统</span>
		</div>
		<nav>
			{#each navItems as item}
				<a href={item.path} class:active={$page.url.pathname === item.path}>
					<svelte:component this={item.icon} size={18} />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
		<div class="sidebar-bottom">
			<div class="role-switcher" on:click={() => menuOpen = !menuOpen}>
				<Users size={18} />
				<span>{roleLabels[role] || '切换角色'}</span>
			</div>
			{#if menuOpen}
				<div class="role-menu">
					<button on:click={() => switchRole('station_master')} class:active={role === 'station_master'}>
						站长
					</button>
					<button on:click={() => switchRole('inspector')} class:active={role === 'inspector'}>
						巡检工程师
					</button>
					<button on:click={() => switchRole('admin')} class:active={role === 'admin'}>
						运维内勤
					</button>
				</div>
			{/if}
		</div>
	</aside>

	<main class="content">
		<slot />
	</main>
</div>

<style>
	.app {
		display: flex;
		min-height: 100vh;
		background: #f5f7fa;
	}

	.sidebar {
		width: 240px;
		background: linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%);
		color: white;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.logo {
		padding: 24px 20px;
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 18px;
		font-weight: 600;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.logo-icon {
		font-size: 24px;
	}

	nav {
		flex: 1;
		padding: 16px 12px;
	}

	nav a {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		border-radius: 8px;
		margin-bottom: 4px;
		transition: all 0.2s;
	}

	nav a:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	nav a.active {
		background: rgba(255, 255, 255, 0.15);
		color: white;
		font-weight: 500;
	}

	.sidebar-bottom {
		padding: 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		position: relative;
	}

	.role-switcher {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.role-switcher:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.role-menu {
		position: absolute;
		bottom: 100%;
		left: 16px;
		right: 16px;
		background: white;
		border-radius: 8px;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		margin-bottom: 8px;
	}

	.role-menu button {
		width: 100%;
		padding: 12px 16px;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		color: #333;
		transition: background 0.2s;
	}

	.role-menu button:hover {
		background: #f5f7fa;
	}

	.role-menu button.active {
		background: #e8f0fe;
		color: #2563eb;
	}

	.content {
		flex: 1;
		overflow: auto;
	}
</style>
