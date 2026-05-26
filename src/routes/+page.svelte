<script lang="ts">
  import { goto } from '$app/navigation';
  import { ROLES } from '$lib/data/seed';
  import { currentRole, focusMode } from '$lib/stores/app';
  import type { Role } from '$lib/types';

  let selectedRole: Role = 'dispatcher';

  function login() {
    currentRole.set(selectedRole);
    focusMode.set(true);
    goto('/dashboard');
  }
</script>

<div class="login-page">
  <div class="login-card">
    <div class="login-title">选择角色进入系统</div>
    <div class="login-sub">当前为演示环境，点击角色卡片即可直接进入工作台</div>

    <div class="role-cards">
      {#each ROLES as role (role.id)}
        <button
          class={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
          on:click={() => (selectedRole = role.id)}
          type="button"
        >
          <div class="role-avatar">{role.avatar}</div>
          <div class="role-name">{role.name}</div>
          <div class="role-login">{role.loginId}</div>
          <div class="role-desc">{role.description}</div>
        </button>
      {/each}
    </div>

    <button class="login-btn" on:click={login}>进入工作台</button>

    <div class="login-hint">
      快速样例：<br/>
      <b>正常流</b>：R001 东北地块3号·玉米播种（油料→作业→补贴全链完成）<br/>
      <b>异常流</b>：R002 进度报晚→维修、R003 补贴材料不齐、R006 维修→回访链路脱节
    </div>
  </div>
</div>
