<script lang="ts">
  import { page } from '$app/stores';
  import { auth } from '../stores/auth';
  import type { UserRole } from '../api/client';

  interface MenuItem {
    path: string;
    label: string;
    icon: string;
    roles: UserRole[];
  }

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: '首页看板', icon: '📊', roles: ['director', 'teacher', 'logistics'] },
    { path: '/campers', label: '营员管理', icon: '👥', roles: ['director', 'teacher'] },
    { path: '/attendance', label: '考勤管理', icon: '✅', roles: ['director', 'teacher'] },
    { path: '/medical', label: '医疗管理', icon: '🏥', roles: ['director', 'teacher', 'logistics'] },
    { path: '/rooms', label: '分房管理', icon: '🏠', roles: ['director', 'logistics'] },
    { path: '/supplies', label: '物资管理', icon: '📦', roles: ['director', 'logistics'] },
    { path: '/feedback', label: '家长回访', icon: '💬', roles: ['director', 'teacher'] },
  ];

  $: currentPath = $page.url.pathname;
  $: user = $auth.user;

  function isVisible(item: MenuItem): boolean {
    if (!user) return false;
    return item.roles.includes(user.role);
  }

  function getRoleName(role: UserRole): string {
    const names: Record<UserRole, string> = {
      director: '营地主任',
      teacher: '班务老师',
      logistics: '后勤协调',
    };
    return names[role];
  }

  function handleLogout() {
    auth.logout();
    window.location.href = '/';
  }
</script>

<aside class="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col shadow-sm">
  <div class="p-6 border-b border-gray-100">
    <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
      <span class="text-2xl">🏕️</span>
      营地管理系统
    </h1>
  </div>

  <nav class="flex-1 p-4 space-y-1">
    {#each menuItems as item}
      {#if isVisible(item)}
        <a
          href={item.path}
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 {currentPath === item.path
            ? 'bg-blue-50 text-blue-600 font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
        >
          <span class="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </a>
      {/if}
    {/each}
  </nav>

  <div class="p-4 border-t border-gray-100">
    {#if user}
      <div class="flex items-center gap-3 px-4 py-3 mb-2">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {user.display_name.charAt(0)}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{user.display_name}</p>
          <p class="text-xs text-gray-500">{getRoleName(user.role)}</p>
        </div>
      </div>
      <button
        on:click={handleLogout}
        class="w-full px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        退出登录
      </button>
    {/if}
  </div>
</aside>
