<script>
  import { onMount } from 'svelte';
  import { dashboardAPI } from '$lib/api';
  import {
    Wrench,
    RefundCcw,
    XCircle,
    Clock,
    Users,
    DollarSign,
    TrendingUp,
    Megaphone,
    ArrowRight,
    AlertTriangle,
  } from 'lucide-svelte';

  let stats = null;
  let activity = [];
  let loading = true;

  async function loadData() {
    try {
      const [statsRes, activityRes] = await Promise.all([
        dashboardAPI.stats(),
        dashboardAPI.activity(),
      ]);
      stats = statsRes;
      activity = activityRes;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  function getActionLabel(action) {
    const labels = {
      create: '创建',
      process: '处理',
      update_status: '更新状态',
      escalate: '升级',
      review: '审核',
      push: '推送',
    };
    return labels[action] || action;
  }

  function getTicketTypeLabel(type) {
    const labels = {
      repair: '报修单',
      refund: '退款单',
      activity: '活动',
      membership: '会员',
    };
    return labels[type] || type;
  }

  function getStatusBadge(status) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      approved: 'bg-green-100 text-green-800',
      escalated: 'bg-orange-100 text-orange-800',
      read: 'bg-gray-100 text-gray-800',
      unread: 'bg-blue-100 text-blue-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }
</script>

{#if loading}
  <div class="flex items-center justify-center h-96">
    <div class="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
  </div>
{:else}
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <a href="/repairs?status=pending" class="card p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待处理报修</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{stats?.pending_repairs || 0}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Wrench class="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm text-orange-600">
          <span>需紧急处理</span>
          <ArrowRight class="w-4 h-4 ml-1" />
        </div>
      </a>

      <a href="/refunds?status=pending" class="card p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待审核退款</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{stats?.pending_refunds || 0}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <RefundCcw class="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm text-purple-600">
          <span>等待审核</span>
          <ArrowRight class="w-4 h-4 ml-1" />
        </div>
      </a>

      <a href="/repairs?status=rejected" class="card p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已驳回</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{stats?.rejected_items || 0}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <XCircle class="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm text-red-600">
          <span>需重新处理</span>
          <ArrowRight class="w-4 h-4 ml-1" />
        </div>
      </a>

      <a href="/repairs?status=escalated" class="card p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">需回查</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{stats?.need_review || 0}</p>
          </div>
          <div class="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-pink-600" />
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm text-pink-600">
          <span>升级工单待处理</span>
          <ArrowRight class="w-4 h-4 ml-1" />
        </div>
      </a>

      <a href="/members?expiring=true" class="card p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">即将到期会员</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{stats?.expiring_members || 0}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm text-blue-600">
          <span>7天内到期</span>
          <ArrowRight class="w-4 h-4 ml-1" />
        </div>
      </a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">近30天营收</p>
            <p class="text-2xl font-bold text-gray-900">¥{(stats?.total_revenue || 0).toFixed(2)}</p>
          </div>
        </div>
        <div class="flex items-center gap-1 text-green-600 text-sm">
          <TrendingUp class="w-4 h-4" />
          <span>较上月增长 12.5%</span>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">活跃会员数</p>
            <p class="text-2xl font-bold text-gray-900">{stats?.active_members || 0}</p>
          </div>
        </div>
        <div class="flex items-center gap-1 text-blue-600 text-sm">
          <TrendingUp class="w-4 h-4" />
          <span>较上月增长 8.3%</span>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Megaphone class="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">待推送活动</p>
            <p class="text-2xl font-bold text-gray-900">{stats?.pending_activities || 0}</p>
          </div>
        </div>
        <a href="/activities" class="flex items-center gap-1 text-yellow-600 text-sm hover:underline">
          <span>去查看活动列表</span>
          <ArrowRight class="w-4 h-4" />
        </a>
      </div>
    </div>

    <div class="card p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">最近动态</h2>
        <span class="text-sm text-gray-500">最近20条操作记录</span>
      </div>

      <div class="space-y-4">
        {#each activity as log}
          <div class="flex gap-4">
            <div class="relative">
              <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-xs font-medium text-primary-700">{log.operator?.name?.charAt(0) || 'U'}</span>
              </div>
              <div class="absolute top-8 bottom-0 left-1/2 w-px bg-gray-200 -translate-x-1/2"></div>
            </div>
            <div class="flex-1 pb-4">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">{log.operator?.name}</span>
                <span class="text-gray-500">{getActionLabel(log.action)}</span>
                <span class="text-gray-500">{getTicketTypeLabel(log.ticket_type)}</span>
                <span class="text-gray-500">#{log.ticket_id}</span>
                {#if log.new_status}
                  <span class="badge {getStatusBadge(log.new_status)}">{log.new_status}</span>
                {/if}
              </div>
              {#if log.remark}
                <p class="text-sm text-gray-600 mt-1">{log.remark}</p>
              {/if}
              <p class="text-xs text-gray-400 mt-1">{new Date(log.created_at).toLocaleString('zh-CN')}</p>
            </div>
          </div>
        {/each}

        {#if activity.length === 0}
          <p class="text-center text-gray-500 py-8">暂无操作记录</p>
        {/if}
      </div>
    </div>
  </div>
{/if}
