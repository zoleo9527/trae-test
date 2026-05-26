<script lang="ts">
  import { page } from '$app/stores';
  import RoleSwitcher from '$lib/components/RoleSwitcher.svelte';
  import '$lib/app.css';
</script>

<div class="app-root">
  <header class="app-header">
    <div class="brand">
      <span class="brand-icon">🚜</span>
      <div>
        <div class="brand-title">农机合作社</div>
        <div class="brand-sub">油料领用与维修登记</div>
      </div>
    </div>
    <RoleSwitcher />
  </header>
  <main class="app-main">
    <slot />
  </main>
</div>
