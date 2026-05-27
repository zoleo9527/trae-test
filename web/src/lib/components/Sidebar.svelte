<script>
  import { page } from '$app/stores';
  import { user } from '../../stores/user';
  import { goto } from '$app/navigation';
  import {
    LayoutDashboard,
    Users,
    CreditCard,
    Wrench,
    RefundCcw,
    Megaphone,
    MapPin,
    Settings,
    Package,
  } from 'lucide-svelte';

  let currentUser = null;
  user.subscribe((v) => (currentUser = v));

  const menuItems = [
    { path: '/', label: '首页看板', icon: LayoutDashboard, roles: ['admin', 'inspector', 'service'] },
    { path: '/members', label: '会员管理', icon: Users, roles: ['admin', 'service'] },
    { path: '/memberships', label: '套餐管理', icon: Package, roles: ['admin'] },
    { path: '/orders', label: '续费订单', icon: CreditCard, roles: ['admin', 'service'] },
    { path: '/repairs', label: '设备报修', icon: Wrench, roles: ['admin', 'inspector', 'service'] },
    { path: '/refunds', label: '退款申诉', icon: RefundCcw, roles: ['admin', 'service'] },
    { path: '/activities', label: '活动推送', icon: Megaphone, roles: ['admin'] },
    { path: '/sites', label: '站点设备', icon: MapPin, roles: ['admin', 'inspector'] },
  ];

  function isActive(path) {
    return $page.url.pathname === path;
  }

  function handleLogout() {
    user.logout();
    goto('/login');
  }
</script>

<aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
  <div class="p-6 border-b border-gray-200">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h1 class="font-bold text-gray-900">洗车运营</h1>
        <p class="text-xs text-gray-500">会员管理平台</p>
      </div>
    </div>
  </div>

  <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
    {#each menuItems as item}
      {#if item.roles.includes(currentUser?.role)}
        <a
          href={item.path}
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {isActive(item.path)
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-600 hover:bg-gray-50'}"
        >
          <svelte:component this={item.icon} class="w-5 h-5" />
          <span class="font-medium">{item.label}</span>
        </a>
      {/if}
    {/each}
  </nav>

  <div class="p-4 border-t border-gray-200">
    <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
      <div class="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
        <span class="text-primary-700 font-medium">{currentUser?.name?.charAt(0) || 'U'}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">{currentUser?.name}</p>
        <p class="text-xs text-gray-500">
          {currentUser?.role === 'admin' ? '运营主管' : currentUser?.role === 'inspector' ? '巡检员' : '客服'}
        </p>
      </div>
      <button on:click={handleLogout} class="text-gray-400 hover:text-gray-600">
        <Settings class="w-5 h-5" />
      </button>
    </div>
  </div>
</aside>
