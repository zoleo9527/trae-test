<script>
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
  import { user } from '../../stores/user';
  import { onMount } from 'svelte';
  import { authAPI } from '$lib/api';

  let currentUser = null;
  let checkingAuth = true;
  user.subscribe((v) => (currentUser = v));

  async function verifyAuth() {
    if (!browser) return;

    const token = localStorage.getItem('token');
    if (!token) {
      goto('/login');
      return;
    }

    try {
      await authAPI.me();
      checkingAuth = false;
    } catch (e) {
      user.logout();
      goto('/login');
    }
  }

  onMount(() => {
    verifyAuth();
  });
</script>

{#if checkingAuth}
  <div class="flex h-screen items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-500">正在验证登录状态...</p>
    </div>
  </div>
{:else if currentUser}
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
{/if}
