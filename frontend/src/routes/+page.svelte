<script lang="ts">
  import { auth } from '../lib/stores/auth';

  let username = '';
  let password = '';
  let submitting = false;
  let errorMessage = '';

  $: authState = $auth;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!username || !password) {
      errorMessage = '请输入用户名和密码';
      return;
    }

    submitting = true;
    errorMessage = '';

    try {
      const success = await auth.login(username, password);
      if (success) {
        window.location.href = '/dashboard';
      } else {
        errorMessage = authState.error || '登录失败，请检查用户名和密码';
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : '登录失败';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="text-6xl mb-4">🏕️</div>
      <h2 class="text-3xl font-extrabold text-gray-900">
        营地管理系统
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        请登录以继续
      </p>
    </div>

    <form class="mt-8 space-y-6" on:submit={handleSubmit}>
      <div class="rounded-lg shadow-md bg-white p-8 space-y-6">
        {#if errorMessage}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        {/if}

        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
            用户名
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            bind:value={username}
            class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="请输入用户名"
            disabled={submitting}
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            bind:value={password}
            class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="请输入密码"
            disabled={submitting}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={submitting}
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {#if submitting}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              登录中...
            {:else}
              登 录
            {/if}
          </button>
        </div>

        <div class="text-xs text-gray-500 text-center space-y-1 pt-4 border-t border-gray-100">
          <p>测试账号（密码均为 password123）：</p>
          <p>director1 (营地主任)</p>
          <p>teacher1 (班务老师)</p>
          <p>logistics1 (后勤协调)</p>
        </div>
      </div>
    </form>
  </div>
</div>
