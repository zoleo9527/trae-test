<script>
  import { onMount } from 'svelte';
  import { orderAPI } from '$lib/api';
  import { RefreshCw, Search, ChevronRight } from 'lucide-svelte';

  let orders = [];
  let loading = true;
  let statusFilter = '';
  let keyword = '';
  let page = 1;
  let pageSize = 20;
  let total = 0;

  async function loadData() {
    loading = true;
    try {
      const params = { page, page_size: pageSize };
      if (statusFilter) params.status = statusFilter;
      const res = await orderAPI.list(params);
      orders = res.items;
      total = res.total;
    } finally {
      loading = false;
    }
  }

  function getStatusBadge(status) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  function getStatusLabel(status) {
    const labels = { pending: '待支付', paid: '已支付', refunded: '已退款', cancelled: '已取消' };
    return labels[status] || status;
  }

  function getPaymentLabel(method) {
    const labels = { wechat: '微信', alipay: '支付宝', card: '刷卡', balance: '余额', manual: '人工' };
    return labels[method] || method;
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-6">
  <div class="card p-4">
    <div class="flex items-center gap-4">
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          bind:value={keyword}
          placeholder="搜索订单号..."
          class="input pl-9"
        />
      </div>

      <select bind:value={statusFilter} on:change={loadData} class="input w-32">
        <option value="">全部状态</option>
        <option value="pending">待支付</option>
        <option value="paid">已支付</option>
        <option value="refunded">已退款</option>
        <option value="cancelled">已取消</option>
      </select>

      <button on:click={loadData} class="btn-secondary flex items-center gap-2">
        <RefreshCw class="w-4 h-4" />
        刷新
      </button>
    </div>
  </div>

  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">会员</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">套餐</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">支付方式</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#if loading}
            <tr><td colspan="8" class="px-4 py-12 text-center text-gray-500">加载中...</td></tr>
          {:else if orders.length === 0}
            <tr><td colspan="8" class="px-4 py-12 text-center text-gray-500">暂无数据</td></tr>
          {:else}
            {#each orders as order}
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-4 font-mono text-sm">{order.order_no}</td>
                <td class="px-4 py-4">
                  <p class="font-medium">{order.member?.name}</p>
                  <p class="text-sm text-gray-500">{order.member?.phone}</p>
                </td>
                <td class="px-4 py-4">{order.package?.name}</td>
                <td class="px-4 py-4 font-semibold">¥{order.amount.toFixed(2)}</td>
                <td class="px-4 py-4">{getPaymentLabel(order.payment_method)}</td>
                <td class="px-4 py-4">
                  <span class="badge {getStatusBadge(order.status)}">{getStatusLabel(order.status)}</span>
                </td>
                <td class="px-4 py-4">{order.operator?.name || '-'}</td>
                <td class="px-4 py-4 text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('zh-CN')}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
