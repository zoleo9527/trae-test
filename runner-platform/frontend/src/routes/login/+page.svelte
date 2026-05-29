<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { setAuth } from '$lib/stores/auth';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin() {
		error = '';
		loading = true;
		try {
			const result = await api.login(username, password);
			setAuth(result.token, result.user);
			goto('/orders');
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
	<div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">🚴 跑腿平台</h1>
			<p class="text-gray-500">订单派发与超时申诉系统</p>
		</div>

		<form on:submit|preventDefault={handleLogin} class="space-y-6">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
				<input
					type="text"
					bind:value={username}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="请输入用户名"
					required
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
				<input
					type="password"
					bind:value={password}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="请输入密码"
					required
				/>
			</div>

			{#if error}
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
					{error}
				</div>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{loading ? '登录中...' : '登 录'}
			</button>
		</form>

		<div class="mt-6 pt-6 border-t border-gray-100">
			<p class="text-xs text-gray-500 mb-3">测试账号（密码均为 123456）：</p>
			<div class="grid grid-cols-2 gap-2 text-xs">
				<div class="p-2 bg-gray-50 rounded"><span class="font-medium">admin</span> - 运营经理</div>
				<div class="p-2 bg-gray-50 rounded"><span class="font-medium">dispatch_zhang</span> - 调度</div>
				<div class="p-2 bg-gray-50 rounded"><span class="font-medium">cs_li</span> - 客服</div>
				<div class="p-2 bg-gray-50 rounded"><span class="font-medium">runner_wang</span> - 骑手</div>
			</div>
		</div>
	</div>
</div>
