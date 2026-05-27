<script>
  import { page } from '$app/stores';
  import { Bell, Search } from 'lucide-svelte';
  import { user } from '../../stores/user';

  let currentUser = null;
  user.subscribe((v) => (currentUser = v));

  const pageTitles = {
    '/': '首页看板',
    '/members': '会员管理',
    '/memberships': '套餐管理',
    '/orders': '续费订单',
    '/repairs': '设备报修',
    '/refunds': '退款申诉',
    '/activities': '活动推送',
    '/sites': '站点设备',
  };

  $: title = pageTitles[$page.url.pathname] || '首页';
</script>

<header class="bg-white border-b border-gray-200 px-6 py-4">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-900">{title}</h1>
      <p class="text-sm text-gray-500">
        {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>

    <div class="flex items-center gap-4">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="搜索..." class="input pl-9 py-2 w-64 text-sm" />
      </div>

      <button class="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
        <Bell class="w-5 h-5" />
        <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      <div class="flex items-center gap-2 pl-4 border-l border-gray-200">
        <div class="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
          <span class="text-primary-700 font-medium text-sm">{currentUser?.name?.charAt(0) || 'U'}</span>
        </div>
      </div>
    </div>
  </div>
</header>
