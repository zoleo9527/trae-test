<script lang="ts">
  import { currentRole, focusMode } from '$lib/stores/app';
  import { ROLES } from '$lib/data/seed';
  import { goto } from '$app/navigation';

  function switchRole(id) {
    currentRole.set(id);
    focusMode.set(true);
    goto('/dashboard');
  }
</script>

<div class="role-switcher">
  <div class="role-pills">
    {#each ROLES as role (role.id)}
      <button
        class={`role-pill ${$currentRole === role.id ? 'active' : ''}`}
        on:click={() => switchRole(role.id)}
        title={role.description}
        type="button"
      >
        <span class="pill-icon">{role.avatar}</span>
        <span class="pill-name">{role.name}</span>
      </button>
    {/each}
  </div>
</div>
