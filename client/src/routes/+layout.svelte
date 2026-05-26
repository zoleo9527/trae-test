<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import AppShell from './components/AppShell.svelte';
  import { currentUser } from './lib/user';
  import type { User } from './lib/types';

  let user: User | null = null;
  let ready = false;

  $: isLogin = $page.url.pathname === '/login';

  currentUser.subscribe(u => { user = u; });

  onMount(async () => {
    if (!user && !isLogin) {
      await goto('/login');
    } else if (user && isLogin) {
      await goto('/orders');
    }
    ready = true;
  });
</script>

<svelte:head>
  <style>
    :root {
      --bg: #f5f1ea;
      --bg-2: #ece3d4;
      --ink: #1f1b16;
      --ink-2: #6b5f4d;
      --line: #d8ccb6;
      --accent: #8b3a3a;
      --accent-2: #c49a6c;
      --good: #2f7a52;
      --warn: #c9882b;
      --bad: #a9342f;
      --soft: #fffaf1;
      --shadow: 0 8px 30px rgba(31, 27, 22, 0.08);
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      font-family: 'Inter', 'Noto Serif SC', -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
      color: var(--ink);
      background: radial-gradient(1200px 800px at 10% 0%, #f7efdd 0%, var(--bg) 60%);
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }
    button { font-family: inherit; cursor: pointer; }
    .serif { font-family: 'Noto Serif SC', 'Songti SC', serif; }
  </style>
</svelte:head>

{#if ready}
  {#if isLogin || !user}
    <slot />
  {:else}
    <AppShell {user}>
      <slot />
    </AppShell>
  {/if}
{/if}
