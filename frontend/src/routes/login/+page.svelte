<script>
	import { authApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getErrorMessage, isAuthError } from '$lib/utils';

	let username = '';
	let loading = false;
	let error = '';

	onMount(() => {
		const token = localStorage.getItem('token');
		if (token) {
			goto('/');
		}
	});

	async function handleLogin() {
		if (!username.trim()) {
			error = '请输入用户名';
			return;
		}

		loading = true;
		error = '';

		try {
			const result = await authApi.login(username.trim());
			user.login(result.user, result.token);
			goto('/');
		} catch (e) {
			error = '登录失败: ' + (getErrorMessage(e) || '请检查用户名');
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<div class="login-page">
	<div class="login-card">
		<div class="login-logo">
			<div class="login-logo-icon">🏪</div>
			<h1>文创商店联名管理系统</h1>
			<p>联名上架与下架复盘协作平台</p>
		</div>

		{#if error}
			<div class="alert alert-danger">{error}</div>
		{/if}

		<div class="login-form-group">
			<label class="login-form-label">用户名</label>
			<input
				class="login-form-input"
				type="text"
				bind:value={username}
				placeholder="请输入用户名"
				on:keydown={handleKeydown}
				disabled={loading}
			/>
		</div>

		<button class="login-btn" on:click={handleLogin} disabled={loading}>
			{#if loading}
				<span style="display: inline-flex; align-items: center; gap: 8px;">
					<div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
					登录中...
				</span>
			{:else}
				登录
			{/if}
		</button>

		<div class="login-tips">
			<div class="login-tips-title">演示账号：</div>
			<div class="login-tip-item">manager - 店长（全局权限）</div>
			<div class="login-tip-item">planner - 企划专员（商品/订单/复盘）</div>
			<div class="login-tip-item">warehouse - 仓管（库存/巡店/异常）</div>
		</div>
	</div>
</div>
