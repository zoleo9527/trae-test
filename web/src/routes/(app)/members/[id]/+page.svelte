<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { memberAPI, packageAPI, orderAPI } from '$lib/api';
  import { ArrowLeft, CreditCard, Clock, Award, Wallet, TrendingUp, History, Package } from 'lucide-svelte';

  let member = null;
  let logs = [];
  let packages = [];
  let orders = [];
  let loading = true;
  let showRenew = false;
  let selectedPackage = null;
  let renewRemark = '';
  let renewLoading = false;

  async function loadData() {
    loading = true;
    try {
      const id = $page.params.id;
      if (!id) {
        goto('/members');
        return;
      }
      const [memberRes, logsRes, packagesRes, ordersRes] = await Promise.all([
        memberAPI.detail(id),
        memberAPI.logs(id),
        packageAPI.list(),
        orderAPI.list({}),
      ]);
      member = memberRes;
      logs = logsRes;
      packages = packagesRes;
      orders = ordersRes.items.filter((o) => o.member_id === parseInt(id));
    } catch (e) {
      console.error('加载会员详情失败:', e);
      goto('/members');
    } finally {
      loading = false;
    }
  }

  async function handleRenew() {
    if (!selectedPackage || renewLoading) return;
    renewLoading = true;
    try {
      await orderAPI.create({
        member_id: member.id,
        package_id: selectedPackage.id,
        amount: selectedPackage.price,
        payment_method: 'manual',
        remark: renewRemark,
      });
      showRenew = false;
      renewRemark = '';
      selectedPackage = null;
      await loadData();
    } catch (e) {
      alert(e.message);
    } finally {
      renewLoading = false;
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

  onMount(() => {
    loadData();
  });
</script>

{#if loading}
  <div class="flex items-center justify-center h-96">
    <div class="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
  </div>
{:else if member}
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button on:click={() => goto('/members')} class="p-2 hover:bg-gray-100 rounded-lg">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h1 class="text-xl font-bold">会员详情</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="space-y-6">
        <div class="card p-6">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span class="text-2xl font-bold text-primary-700">{member.name.charAt(0)}</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">{member.name}</h2>
              <p class="text-gray-500">{member.phone}</p>
              <span class="badge {getLevelBadge(member.level)} mt-2">{getLevelLabel(member.level)}</span>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <Wallet class="w-5 h-5 text-gray-400" />
              <div class="flex-1">
                <p class="text-sm text-gray-500">账户余额</p>
                <p class="font-semibold">¥{member.balance.toFixed(2)}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <Award class="w-5 h-5 text-gray-400" />
              <div class="flex-1">
                <p class="text-sm text-gray-500">可用积分</p>
                <p class="font-semibold">{member.points}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <Clock class="w-5 h-5 text-gray-400" />
              <div class="flex-1">
                <p class="text-sm text-gray-500">会员到期</p>
                <p class="font-semibold">{new Date(member.membership_expire_at).toLocaleDateString('zh-CN')}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <TrendingUp class="w-5 h-5 text-gray-400" />
              <div class="flex-1">
                <p class="text-sm text-gray-500">累计消费</p>
                <p class="font-semibold">¥{member.total_amount.toFixed(2)} / {member.total_orders} 单</p>
              </div>
            </div>
          </div>

          <button on:click={() => (showRenew = true)} class="btn-primary w-full mt-6">
            <CreditCard class="w-4 h-4 inline mr-2" />
            续费会员
          </button>
        </div>

        {#if showRenew}
          <div class="card p-6">
            <h3 class="font-semibold mb-4">选择续费套餐</h3>
            <div class="space-y-3 mb-4">
              {#each packages as pkg}
                <div
                  on:click={() => (selectedPackage = pkg)}
                  class="p-4 border-2 rounded-lg cursor-pointer transition-colors {selectedPackage?.id === pkg.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'}"
                >
                  <div class="flex justify-between items-center">
                    <div>
                      <p class="font-medium">{pkg.name}</p>
                      <p class="text-sm text-gray-500">{pkg.duration}天 · {pkg.description}</p>
                    </div>
                    <p class="text-primary-600 font-bold text-lg">¥{pkg.price}</p>
                  </div>
                </div>
              {/each}
            </div>
            <textarea bind:value={renewRemark} class="input mb-4" placeholder="备注（选填）" rows="2" />
            <div class="flex gap-3">
              <button on:click={handleRenew} disabled={!selectedPackage} class="btn-primary flex-1">确认续费</button>
              <button on:click={() => (showRenew = false)} class="btn-secondary flex-1">取消</button>
            </div>
          </div>
        {/if}
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div class="card p-6">
          <h3 class="font-semibold mb-4">续费记录</h3>
          <div class="space-y-3">
            {#each orders as order}
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard class="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p class="font-medium">{order.package?.name || '会员套餐'}</p>
                    <p class="text-sm text-gray-500">{order.order_no} · {new Date(order.created_at).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold">¥{order.amount.toFixed(2)}</p>
                  <p class="text-sm text-gray-500">{order.operator?.name || '系统'}</p>
                </div>
              </div>
            {:else}
              <p class="text-center text-gray-500 py-8">暂无续费记录</p>
            {/each}
          </div>
        </div>

        <div class="card p-6">
          <h3 class="font-semibold mb-4 flex items-center gap-2">
            <History class="w-5 h-5 text-gray-400" />
            操作时间轴
          </h3>
          <div class="space-y-4">
            {#each logs as log}
              <div class="flex gap-4">
                <div class="relative">
                  <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span class="text-xs font-medium text-primary-700">{(log.operator_name || log.operator || 'S').charAt(0)}</span>
                  </div>
                  <div class="absolute top-8 bottom-0 left-1/2 w-px bg-gray-200 -translate-x-1/2"></div>
                </div>
                <div class="flex-1 pb-4">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-gray-900">{log.operator_name || log.operator || '系统'}</span>
                    <span class="text-gray-500">{log.title}</span>
                    <span class="badge bg-green-100 text-green-800">{log.status}</span>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">
                    <span class="font-medium">¥{Number(log.amount).toFixed(2)}</span>
                    <span class="mx-2">·</span>
                    <span>有效期+{log.extend_days || log.package?.duration || 30}天</span>
                    {#if log.extend_days > 365}
                      <span class="ml-2 text-xs badge bg-purple-100 text-purple-800">长期会员</span>
                    {/if}
                  </p>
                  {#if log.order_no}
                    <p class="text-xs text-gray-400 mt-1">订单号: {log.order_no}</p>
                  {/if}
                  {#if log.remark}
                    <p class="text-xs text-gray-500 mt-1 italic">"{log.remark}"</p>
                  {/if}
                  <p class="text-xs text-gray-400 mt-1">{new Date(log.created_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            {:else}
              <p class="text-center text-gray-500 py-8">暂无操作记录</p>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
