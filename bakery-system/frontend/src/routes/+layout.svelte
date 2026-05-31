<script>
	import '../app.css';
	import { page } from '$app/stores';

	let currentRole = 'manager';

	const roles = [
		{ id: 'manager', name: '门店主理人' },
		{ id: 'kitchen', name: '后厨负责人' },
		{ id: 'service', name: '客服' }
	];

	const navItems = [
		{ path: '/', name: '工作台', icon: '📊', roles: ['manager', 'kitchen', 'service'] },
		{ path: '/members', name: '会员管理', icon: '👥', roles: ['manager', 'service'] },
		{ path: '/orders', name: '订单管理', icon: '📋', roles: ['manager', 'kitchen', 'service'] },
		{ path: '/refunds', name: '退款复核', icon: '💰', roles: ['manager', 'service'] },
		{ path: '/products', name: '产品管理', icon: '🥐', roles: ['manager', 'kitchen'] }
	];
</script>

<div class="layout">
	<aside class="sidebar">
		<div class="logo">🥐 手作烘焙坊</div>
		<nav>
			{#each navItems as item}
				{#if item.roles.includes(currentRole)}
					<a href={item.path} class="nav-item" class:active={$page.url.pathname === item.path}>
						<span>{item.icon}</span>
						<span>{item.name}</span>
					</a>
				{/if}
			{/each}
		</nav>
	</aside>

	<main class="main-content">
		<div class="header">
			<h1>{$page.url.pathname === '/' ? '工作台' : navItems.find(n => n.path === $page.url.pathname)?.name || ''}</h1>
			<div class="role-switcher">
				{#each roles as role}
					<button class="role-btn" class:active={currentRole === role.id} on:click={() => currentRole = role.id}>
						{role.name}
					</button>
				{/each}
			</div>
		</div>

		<slot />
	</main>
</div>
