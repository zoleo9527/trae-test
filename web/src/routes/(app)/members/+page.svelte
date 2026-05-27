<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { memberAPI, packageAPI } from '$lib/api';
  import { user } from '../../stores/user';
  import { Search, Plus, RefreshCw, Filter, Check, ChevronDown, ChevronRight, CreditCard, Clock } from 'lucide-svelte';

  let members = [];
  let packages = [];
  let selected = new Set();
  let loading = true;
  let showBatchRenew = false;
  let selectedPackage = null;
  let batchRemark = '';
  let keyword = '';
  let statusFilter = '';
  let levelFilter = '';
  let expiringOnly = false;
  let page = 1;
  let pageSize = 20;
  let total = 0;

  $: allSelected = members.length > 0 && selected.size === members.length;
  $: selectedCount = selected.size;

  async function loadData() {
    loading = true;
    try {
      const params = { page, page_size: pageSize };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (levelFilter) params.level = levelFilter;
      if (expiringOnly) params.expiring = 'true';

      const [membersRes, packagesRes] = await Promise.all([
        memberAPI.list(params),
        packageAPI.list(),
      ]);
      members = membersRes.items;
      total = membersRes.total;
      packages = packagesRes;
    } finally {
      loading = false;
    }
  }

  function toggleSelectAll() {
    if (allSelected) {
      selected.clear();
    } else {
      members.forEach((m) => selected.add(m.id));
    }
    selected = new Set(selected);
  }

  function toggleSelect(id) {
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    selected = new Set(selected);
  }

  async function handleBatchRenew() {
    if (!selectedPackage) return;
    try {
      await memberAPI.batchRenew({
        member_ids: Array.from(selected),
        package_id: selectedPackage.id,
        amount: selectedPackage.price,
        remark: batchRemark,
      });
      showBatchRenew = false;
      selected.clear();
      selected = new Set();
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  function getLevelBadge(level) {
    const badges = {
      normal: 'bg-gray-100 text-gray-800',
      silver: 'bg-gray-200 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
    };
    return badges[level] || 'bg-gray-100 text-gray-800';
  }

  function getLevelLabel(level) {
    const labels = { normal: '普通', silver: '银卡', gold: '金卡', platinum: '铂金' };
    return labels[level] || level;
  }

  function getStatusBadge(status) {
    const badges = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      frozen: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  function getStatusLabel(status) {
    const labels = { active: '正常', expired: '已过期', frozen: '已冻结' };
    return labels[status] || status;
  }

  function isExpiringSoon(expireAt) {
    const expire = new Date(expireAt);
    const now = new Date();
    const diff = (expire - now) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff > 0;
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-6">
  <div class="card p-4">
    <div class="flex flex-wrap items-center gap-4">
      <div class="relative flex-1 min-w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          bind:value={keyword}
          on:keydown={(e) => e.key === 'Enter' && loadData()}
          placeholder="搜索手机号或姓名..."
          class="input pl-9"
        />
      </div>

      <select bind:value={statusFilter} on:change={loadData} class="input w-32">
        <option value="">全部状态</option>
        <option value="active">正常</option>
        <option value="expired">已过期</option>
        <option value="frozen">已冻结</option>
      </select>

      <select bind:value={levelFilter} on:change={loadData} class="input w-32">
        <option value="">全部等级</option>
        <option value="normal">普通</option>
        <option value="silver">银卡</option>
        <option value="gold">金卡</option>
        <option value="platinum">铂金</option>
      </select>

      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" bind:checked={expiringOnly} on:change={loadData} class="w-4 h-4" />
        <span class="text-sm text-gray-600">仅显示即将到期</span>
      </label>

      <button on:click={loadData} class="btn-secondary flex items-center gap-2">
        <RefreshCw class="w-4 h-4" />
        刷新
      </button>

      <button on:click={() => goto('/members/new')} class="btn-primary flex items-center gap-2">
        <Plus class="w-4 h-4" />
        新增会员
      </button>
    </div>

    {#if selectedCount > 0}
      <div class="mt-4 p-3 bg-primary-50 rounded-lg flex items-center justify-between">
        <span class="text-sm text-primary-700">已选择 {selectedCount} 位会员</span>
        <button on:click={() => (showBatchRenew = true)} class="btn-primary flex items-center gap-2 text-sm py-1.5">
          <CreditCard class="w-4 h-4" />
          批量续费
        </button>
      </div>
    {/if}
  </div>

  {#if showBatchRenew}
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4">批量续费</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择套餐</label>
          <div class="grid grid-cols-2 gap-3">
            {#each packages as pkg}
              <div
                on:click={() => (selectedPackage = pkg)}
                class="p-4 border-2 rounded-lg cursor-pointer transition-colors {selectedPackage?.id === pkg.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'}"
              >
                <p class="font-medium">{pkg.name}</p>
                <p class="text-sm text-gray-500">{pkg.duration}天</p>
                <p class="text-primary-600 font-semibold mt-1">¥{pkg.price}</p>
              </div>
            {/each}
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
          <textarea bind:value={batchRemark} class="input h-32" placeholder="选填：续费备注..." />
        </div>
      </div>
      <div class="flex gap-3">
        <button on:click={handleBatchRenew} disabled={!selectedPackage} class="btn-primary">
          确认续费 ({selectedCount} 人)
        </button>
        <button on:click={() => (showBatchRenew = false)} class="btn-secondary">取消</button>
      </div>
    </div>
  {/if}

  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">
              <input type="checkbox" checked={allSelected} on:change={toggleSelectAll} class="w-4 h-4" />
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">会员信息</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">等级</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">余额/积分</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">会员到期</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#if loading}
            <tr>
              <td colspan="7" class="px-4 py-12 text-center text-gray-500">加载中...</td>
            </tr>
          {:else if members.length === 0}
            <tr>
              <td colspan="7" class="px-4 py-12 text-center text-gray-500">暂无数据</td>
            </tr>
          {:else}
            {#each members as member}
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-4">
                  <input type="checkbox" checked={selected.has(member.id)} on:change={() => toggleSelect(member.id)} class="w-4 h-4" />
                </td>
                <td class="px-4 py-4">
                  <div>
                    <p class="font-medium text-gray-900">{member.name}</p>
                    <p class="text-sm text-gray-500">{member.phone}</p>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span class="badge {getLevelBadge(member.level)}">{getLevelLabel(member.level)}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="badge {getStatusBadge(member.status)}">{getStatusLabel(member.status)}</span>
                </td>
                <td class="px-4 py-4">
                  <p class="text-sm">¥{member.balance.toFixed(2)}</p>
                  <p class="text-xs text-gray-500">{member.points} 积分</p>
                </td>
                <td class="px-4 py-4">
                  {#if isExpiringSoon(member.membership_expire_at)}
                    <div class="flex items-center gap-1 text-orange-600">
                      <Clock class="w-4 h-4" />
                      <span class="text-sm">即将到期</span>
                    </div>
                  {/if}
                  <p class="text-sm text-gray-600">{new Date(member.membership_expire_at).toLocaleDateString('zh-CN')}</p>
                </td>
                <td class="px-4 py-4">
                  <button on:click={() => goto(`/members/${member.id}`)} class="text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    详情
                    <ChevronRight class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    {#if total > pageSize}
      <div class="px-4 py-4 border-t border-gray-200 flex items-center justify-between">
        <span class="text-sm text-gray-500">共 {total} 条</span>
        <div class="flex gap-2">
          <button on:click={() => { page--; loadData(); }} disabled={page <= 1} class="btn-secondary text-sm py-1">上一页</button>
          <span class="px-3 py-1 text-sm">{page}</span>
          <button on:click={() => { page++; loadData(); }} disabled={page * pageSize >= total} class="btn-secondary text-sm py-1">下一页</button>
        </div>
      </div>
    {/if}
  </div>
</div>
