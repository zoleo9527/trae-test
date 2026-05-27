<script>
  import { goto } from '$app/navigation';
  import { user } from '../stores/user';
  import { authAPI } from '$lib/api';
  import { AlertCircle, Lock, User } from 'lucide-svelte';

  let username = 'admin';
  let password = '123456';
  let loading = false;
  let error = '';

  async function handleLogin() {
    loading = true;
    error = '';
    try {
      const res = await authAPI.login({ username, password });
      localStorage.setItem('token', res.token);
      user.login(res.user);
      goto('/');
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  $: canSubmit = username && password && !loading;
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
  <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">自助洗车运营平台</h1>
      <p class="text-gray-500 mt-2">会员续费与活动推送系统</p>
    </div>

    <form on:submit|preventDefault={handleLogin} class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
        <div class="relative">
          <User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            bind:value={username}
            class="input pl-10"
            placeholder="请输入用户名"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
        <div class="relative">
          <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="password"
            bind:value={password}
            class="input pl-10"
            placeholder="请输入密码"
          />
        </div>
      </div>

      {#if error}
        <div class="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle class="w-5 h-5" />
          <span class="text-sm">{error}</span>
        </div>
      {/if}

      <button
        type="submit"
        class="btn-primary w-full py-3"
        disabled={!canSubmit}
      >
        {loading ? '登录中...' : '登录'}
      </button>
    </form>

    <div class="mt-6 p-4 bg-gray-50 rounded-lg">
      <p class="text-xs text-gray-500 mb-2">演示账号：</p>
      <div class="text-xs text-gray-600 space-y-1">
        <p>运营主管：admin / 123456</p>
        <p>巡检员：inspector / 123456</p>
        <p>客服：service / 123456</p>
      </div>
    </div>
  </div>
</div>
