<script lang="ts">
	import { page } from '$app/stores';
	import { user, roleNames, rolePermissions } from '$lib/stores/auth';
</script>

<div class="min-h-screen bg-gray-50">
	{#if $page.url.pathname !== '/login' && $user}
		<nav class="bg-white border-b border-gray-200 px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-8">
					<h1 class="text-xl font-bold text-gray-900">
						{#if $user.role === 'runner'}
							🚴 我的订单
						{:else if $user.role === 'customer_service'}
							📞 客服工作台
						{:else}
							🚴 跑腿平台管理系统
						{/if}
					</h1>
					<div class="flex space-x-4">
						<a href="/orders" class="px-3 py-2 text-sm font-medium rounded-md
							{$page.url.pathname.startsWith('/orders') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}">
							{#if $user.role === 'runner'}
								我的订单
							{:else if $user.role === 'customer_service'}
								异常订单
							{:else}
								订单管理
							{/if}
						</a>
						<a href="/appeals" class="px-3 py-2 text-sm font-medium rounded-md
							{$page.url.pathname.startsWith('/appeals') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}">
							{#if $user.role === 'runner'}
								我的申诉
							{:else}
								申诉处理
							{/if}
						</a>
						{#if $user.role !== 'runner' || rolePermissions[$user.role].canViewAllSubsidies}
							<a href="/subsidies" class="px-3 py-2 text-sm font-medium rounded-md
								{$page.url.pathname.startsWith('/subsidies') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}">
								{#if $user.role === 'runner'}
									我的补贴
								{:else}
									补贴管理
								{/if}
							</a>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-4">
					<div class="text-sm">
						<span class="text-gray-600">{$user.name}</span>
						<span class="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
							{roleNames[$user.role]}
						</span>
					</div>
					<a href="/logout" class="text-sm text-red-600 hover:text-red-800">退出登录</a>
				</div>
			</div>
		</nav>
	{/if}
	<slot />
</div>
