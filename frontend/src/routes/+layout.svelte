<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { auth } from '../lib/stores/auth';
  import Sidebar from '../lib/components/Sidebar.svelte';

  let initialized = false;

  $: isLoginPage = $page.url.pathname === '/';
  $: isAuthenticated = $auth.isAuthenticated;
  $: loading = $auth.loading;

  onMount(async () => {
    if (!isLoginPage) {
      await auth.fetchCurrentUser();
    }
    initialized = true;
  });

  $: if (initialized && !isLoginPage && !isAuthenticated && !loading) {
    window.location.href = '/';
  }
</script>

{#if isLoginPage}
  <slot />
{:else if loading && !initialized}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
      <p class="text-gray-500">加载中...</p>
    </div>
  </div>
{:else if isAuthenticated}
  <div class="flex min-h-screen">
    <Sidebar />
    <main class="flex-1 overflow-auto">
      <div class="p-8">
        <slot />
      </div>
    </main>
  </div>
{/if}
