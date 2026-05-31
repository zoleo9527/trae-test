<script lang="ts">
	import { goto } from '$app/navigation';
	import { login, token, currentUser } from '$lib/stores';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin() {
		if (!username || !password) {
			error = '请输入用户名和密码';
			return;
		}

		loading = true;
		error = '';

		try {
			const result = await login(username, password);
			token.set(result.token);
			currentUser.set(result.user);

			if (result.user.role === 'worker') {
				goto('/worker');
			} else if (result.user.role === 'scheduler') {
				goto('/scheduler');
			} else if (result.user.role === 'inspector') {
				goto('/inspector');
			} else {
				goto('/manager');
			}
		} catch (e) {
			error = '登录失败，请检查用户名和密码';
		} finally {
			loading = false;
		}
	}
</script>

<div class="login-container">
	<div class="login-box">
		<h1>商用清洁管理系统</h1>
		<p class="subtitle">项目排班与打卡回传</p>

		<form on:submit|preventDefault={handleLogin}>
			<div class="form-group">
				<label>用户名</label>
				<input type="text" bind:value={username} placeholder="请输入用户名" />
			</div>

			<div class="form-group">
				<label>密码</label>
				<input type="password" bind:value={password} placeholder="请输入密码" />
			</div>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<button type="submit" disabled={loading}>
				{loading ? '登录中...' : '登录'}
			</button>
		</form>

		<div class="demo-accounts">
			<h3>演示账号</h3>
			<ul>
				<li><strong>项目主管:</strong> manager / 123456</li>
				<li><strong>排班专员:</strong> scheduler / 123456</li>
				<li><strong>质检员:</strong> inspector / 123456</li>
				<li><strong>清洁员:</strong> worker1 / 123456</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.login-box {
		background: white;
		padding: 40px;
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		width: 100%;
		max-width: 420px;
	}

	h1 {
		margin: 0 0 8px 0;
		color: #1a202c;
		font-size: 24px;
	}

	.subtitle {
		margin: 0 0 24px 0;
		color: #718096;
		font-size: 14px;
	}

	.form-group {
		margin-bottom: 16px;
	}

	label {
		display: block;
		margin-bottom: 6px;
		color: #4a5568;
		font-size: 14px;
		font-weight: 500;
	}

	input {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 14px;
		box-sizing: border-box;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #667eea;
	}

	button {
		width: 100%;
		padding: 12px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.error {
		color: #e53e3e;
		font-size: 14px;
		margin: 12px 0;
		padding: 10px;
		background: #fff5f5;
		border-radius: 6px;
	}

	.demo-accounts {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid #e2e8f0;
	}

	.demo-accounts h3 {
		margin: 0 0 12px 0;
		font-size: 14px;
		color: #4a5568;
	}

	.demo-accounts ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.demo-accounts li {
		padding: 4px 0;
		font-size: 13px;
		color: #718096;
	}

	.demo-accounts strong {
		color: #4a5568;
		display: inline-block;
		width: 80px;
	}
</style>
