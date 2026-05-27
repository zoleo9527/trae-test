<script>
  import { page } from '$app/stores';
  import { redirect } from '@sveltejs/kit';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Header from '$lib/components/Header.svelte';
  import { user } from '../../stores/user';
  import { onMount } from 'svelte';

  let currentUser = null;
  user.subscribe((v) => (currentUser = v));

  onMount(() => {
    if (!currentUser) {
      window.location.href = '/login';
    }
  });
</script>

{#if currentUser}
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
