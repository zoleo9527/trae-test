<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { ROLE_LABELS } from '$lib/types';
	import { onMount } from 'svelte';

	let currentPath = '';

	$: {
		if ($page.url) {
			currentPath = $page.url.pathname;
		}
	}

	onMount(async () => {
		if (!$auth.loading && !$auth.user) {
			goto('/login');
		}
	});

	$: if (!$auth.loading && !$auth.user) {
		goto('/login');
	}

	interface MenuItem {
		path: string;
		label: string;
		icon: string;
		roles?: string[];
		badge?: number;
	}

	$: menuItems: MenuItem[] = [
		{ path: '/', label: '今日概览', icon: 'dashboard' },
		{ path: '/bookings', label: '预约管理', icon: 'calendar' },
		{
			path: '/schedule',
			label: '教练排班',
			icon: 'users',
			roles: ['coach_manager', 'venue_manager', 'coach']
		},
		{ path: '/equipment', label: '器材管理', icon: 'box', roles: ['reception', 'venue_manager'] },
		{ path: '/members', label: '会员储值', icon: 'wallet', roles: ['reception', 'venue_manager'] },
		{ path: '/exceptions', label: '异常处理', icon: 'alert' }
	];

	$: filteredMenuItems = menuItems.filter(
		item => !item.roles || ($auth.user && item.roles.includes($auth.user.role))
	);

	function logout() {
		auth.logout();
		goto('/login');
	}

	function isActive(path: string) {
		if (path === '/') return currentPath === '/';
		return currentPath.startsWith(path);
	}
</script>

{#if $auth.loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
	</div>
{:else if $auth.user}
	<div class="min-h-screen flex">
		<aside class="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
			<div class="p-4 border-b border-gray-100">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<circle cx="12" cy="8" r="4" />
							<path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
						</svg>
					</div>
					<div>
						<h1 class="font-bold text-gray-900">高尔夫练习场</h1>
						<p class="text-xs text-gray-500">管理系统 v1.0</p>
					</div>
				</div>
			</div>

			<nav class="flex-1 p-3 space-y-1 overflow-y-auto">
				{#each filteredMenuItems as item}
					<a
						href={item.path}
						class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors {isActive(item.path)
							? 'bg-green-50 text-green-700'
							: 'text-gray-600 hover:bg-gray-50'}"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							{#if item.icon === 'dashboard'}
								<rect x="3" y="3" width="7" height="9" rx="1" />
								<rect x="14" y="3" width="7" height="5" rx="1" />
								<rect x="14" y="12" width="7" height="9" rx="1" />
								<rect x="3" y="16" width="7" height="5" rx="1" />
							{:else if item.icon === 'calendar'}
								<rect x="3" y="4" width="18" height="18" rx="2" />
								<line x1="16" y1="2" x2="16" y2="6" />
								<line x1="8" y1="2" x2="8" y2="6" />
								<line x1="3" y1="10" x2="21" y2="10" />
							{:else if item.icon === 'users'}
								<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
								<circle cx="9" cy="7" r="4" />
								<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
								<path d="M16 3.13a4 4 0 0 1 0 7.75" />
							{:else if item.icon === 'box'}
								<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
								<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
								<line x1="12" y1="22.08" x2="12" y2="12" />
							{:else if item.icon === 'wallet'}
								<path d="M21 12V7H3v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5" />
								<path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
								<line x1="16" y1="13" x2="16" y2="17" />
							{:else if item.icon === 'alert'}
								<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
								<line x1="12" y1="9" x2="12" y2="13" />
								<line x1="12" y1="17" x2="12.01" y2="17" />
							{/if}
						</svg>
						<span class="font-medium">{item.label}</span>
					</a>
				{/each}
			</nav>

			<div class="p-4 border-t border-gray-100">
				<div class="flex items-center gap-3 mb-3">
					<div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
						<span class="text-lg font-medium text-gray-600">{$auth.user.name.charAt(0)}</span>
					</div>
					<div class="flex-1 min-w-0">
						<p class="font-medium text-gray-900 truncate">{$auth.user.name}</p>
						<p class="text-xs text-gray-500">
							{ROLE_LABELS[$auth.user.role]}
						</p>
					</div>
				</div>
				<button class="btn btn-outline w-full text-sm" on:click={logout}>退出登录</button>
			</div>
		</aside>

		<main class="flex-1 ml-64 p-6">
			<slot />
		</main>
	</div>
{/if}
