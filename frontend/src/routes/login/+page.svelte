<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { ROLE_LABELS } from '$lib/types';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	const testAccounts = [
		{ username: 'reception', name: '林晓雅', role: 'reception', desc: '前台 - 预约办理、器材借还' },
		{ username: 'coach_manager', name: '陈志强', role: 'coach_manager', desc: '教练主管 - 排班管理、教学质量' },
		{ username: 'venue_manager', name: '王美玲', role: 'venue_manager', desc: '场馆经理 - 全局管理、异常处理' },
		{ username: 'coach_zhang', name: '张教练', role: 'coach', desc: '教练 - 查看课表、学员管理' }
	];

	async function handleLogin() {
		if (!username || !password) {
			error = '请输入用户名和密码';
			return;
		}

		loading = true;
		error = '';

		try {
			await auth.login(username, password);
			goto('/');
		} catch (e: any) {
			error = e.message || '登录失败';
		} finally {
			loading = false;
		}
	}

	function quickLogin(acc: typeof testAccounts[0]) {
		username = acc.username;
		password = '123456';
		handleLogin();
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
				<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<circle cx="12" cy="8" r="4" />
					<path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-gray-900">高尔夫练习场管理系统</h1>
			<p class="text-gray-500 mt-2">预约 · 排班 · 储值 · 异常处理</p>
		</div>

		<div class="card p-6">
			<form on:submit|preventDefault={handleLogin} class="space-y-4">
				<div>
					<label class="label">用户名</label>
					<input
						type="text"
						class="input"
						bind:value={username}
						placeholder="请输入用户名"
						autocomplete="username"
					/>
				</div>
				<div>
					<label class="label">密码</label>
					<input
						type="password"
						class="input"
						bind:value={password}
						placeholder="请输入密码"
						autocomplete="current-password"
					/>
				</div>

				{#if error}
					<div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
				{/if}

				<button type="submit" class="btn btn-primary w-full" disabled={loading}>
					{loading ? '登录中...' : '登录'}
				</button>
			</form>

			<div class="mt-6 pt-6 border-t border-gray-100">
				<p class="text-sm text-gray-500 mb-3">快捷登录（演示用）</p>
				<div class="space-y-2">
					{#each testAccounts as acc}
						<button
							type="button"
							class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-green-200"
							on:click={() => quickLogin(acc)}
						>
							<div class="flex items-center justify-between">
								<div>
									<span class="font-medium text-gray-900">{acc.name}</span>
									<span class="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
										{ROLE_LABELS[acc.role as keyof typeof ROLE_LABELS]}
									</span>
								</div>
								<span class="text-xs text-gray-400">{acc.username}</span>
							</div>
							<p class="text-xs text-gray-500 mt-1">{acc.desc}</p>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<p class="text-center text-gray-400 text-xs mt-6">默认密码: 123456</p>
	</div>
</div>
