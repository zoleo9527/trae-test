<script>
  import { onMount } from 'svelte';
  import { refundAPI, memberAPI } from '$lib/api';
  import { user } from '../../stores/user';
  import { Plus, RefreshCw, Filter, RefundCcw, AlertCircle, Check, X, FileText, Paperclip } from 'lucide-svelte';

  let refunds = [];
  let members = [];
  let loading = true;
  let showForm = false;
  let showDetail = null;
  let statusFilter = '';
  let reviewOpinion = '';
  let form = { member_id: '', order_no: '', amount: '', reason: '', evidence: '' };

  let currentUser = null;
  user.subscribe((v) => (currentUser = v));

  async function loadData() {
    loading = true;
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const [refundsRes, membersRes] = await Promise.all([
        refundAPI.list(params),
        memberAPI.list({ page_size: 100 }),
      ]);
      refunds = refundsRes.items;
      members = membersRes.items;
    } finally {
      loading = false;
    }
  }

  async function handleCreate() {
    try {
      await refundAPI.create(form);
      showForm = false;
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function openDetail(id) {
    showDetail = await refundAPI.detail(id);
    reviewOpinion = '';
  }

  async function handleReview(status) {
    try {
      await refundAPI.review(showDetail.id, {
        status,
        review_opinion: reviewOpinion,
      });
      showDetail = null;
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  function getStatusBadge(status) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  function getStatusLabel(status) {
    const labels = { pending: '待审核', approved: '已通过', rejected: '已驳回' };
    return labels[status] || status;
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-6">
  <div class="card p-4">
    <div class="flex items-center gap-4">
      <select bind:value={statusFilter} on:change={loadData} class="input w-32">
        <option value="">全部状态</option>
        <option value="pending">待审核</option>
        <option value="approved">已通过</option>
        <option value="rejected">已驳回</option>
      </select>

      <button on:click={loadData} class="btn-secondary flex items-center gap-2">
        <RefreshCw class="w-4 h-4" />
        刷新
      </button>

      <button on:click={() => (showForm = true)} class="btn-primary flex items-center gap-2 ml-auto">
        <Plus class="w-4 h-4" />
        新增退款
      </button>
    </div>
  </div>

  {#if showForm}
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4">新增退款申请</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择会员</label>
          <select bind:value={form.member_id} class="input">
            <option value="">请选择会员</option>
            {#each members as member}
              <option value={member.id}>{member.name} - {member.phone}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">关联订单号</label>
          <input type="text" bind:value={form.order_no} class="input" placeholder="选填" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">退款金额</label>
          <input type="number" bind:value={form.amount} step="0.01" class="input" />
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">退款原因</label>
        <textarea bind:value={form.reason} class="input" rows="3" placeholder="请详细说明退款原因..." />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">凭证链接（逗号分隔多个）</label>
        <input
          type="text"
          bind:value={form.evidence}
          class="input"
          placeholder="如：https://example.com/photo1.jpg,https://example.com/photo2.jpg"
        />
        <p class="text-xs text-gray-500 mt-1">支持上传图片或视频链接作为退款凭证</p>
      </div>
      <div class="flex gap-3">
        <button on:click={handleCreate} class="btn-primary">提交申请</button>
        <button on:click={() => (showForm = false)} class="btn-secondary">取消</button>
      </div>
    </div>
  {/if}

  {#if showDetail}
    <div class="card p-6">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h3 class="text-lg font-semibold">退款申请详情</h3>
          <span class="badge {getStatusBadge(showDetail.status)} mt-2">{getStatusLabel(showDetail.status)}</span>
        </div>
        <button on:click={() => (showDetail = null)} class="text-gray-400 hover:text-gray-600">×</button>
      </div>

      <div class="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p class="text-sm text-gray-500 mb-1">申请人</p>
          <p class="font-medium">{showDetail.applicant?.name}</p>
          <p class="text-sm text-gray-500">{new Date(showDetail.created_at).toLocaleString('zh-CN')}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">会员信息</p>
          <p class="font-medium">{showDetail.member?.name}</p>
          <p class="text-sm text-gray-500">{showDetail.member?.phone}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">退款金额</p>
          <p class="font-medium text-xl text-red-600">¥{showDetail.amount.toFixed(2)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">关联订单</p>
          <p class="font-mono font-medium">{showDetail.order_no || '-'}</p>
        </div>
      </div>

      <div class="mb-6">
        <p class="text-sm text-gray-500 mb-2">退款原因</p>
        <p class="text-gray-700">{showDetail.reason}</p>
      </div>

      {#if showDetail.evidence}
        <div class="mb-6">
          <p class="text-sm text-gray-500 mb-3 flex items-center gap-2">
            <Paperclip class="w-4 h-4" />
            凭证材料
          </p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            {#each showDetail.evidence.split(',') as url, i}
              {#if url.trim()}
                <a
                  href={url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {#if url.match(/\.(jpg|jpeg|png|gif|webp)$/i)}
                      <img src={url.trim()} alt="凭证{i + 1}" class="w-full h-full object-cover rounded-lg" />
                    {:else}
                      <FileText class="w-6 h-6 text-gray-400" />
                    {/if}
                  </div>
                  <span class="text-xs text-gray-500 truncate w-full text-center">凭证 {i + 1}</span>
                </a>
              {/if}
            {/each}
          </div>
        </div>
      {/if}

      {#if showDetail.review_opinion}
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500 mb-2">审核意见</p>
          <p class="text-gray-700">{showDetail.review_opinion}</p>
          <p class="text-sm text-gray-500 mt-2">审核人：{showDetail.reviewer?.name}</p>
        </div>
      {/if}

      {#if showDetail.status === 'pending' && currentUser?.role === 'admin'}
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">审核意见</label>
          <textarea bind:value={reviewOpinion} class="input" rows="2" placeholder="请填写审核意见..." />
        </div>
        <div class="flex gap-3">
          <button on:click={() => handleReview('approved')} class="btn-success flex items-center gap-2">
            <Check class="w-4 h-4" />
            通过
          </button>
          <button on:click={() => handleReview('rejected')} class="btn-danger flex items-center gap-2">
            <X class="w-4 h-4" />
            驳回
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">会员</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请人</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">审核人</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#if loading}
            <tr><td colspan="8" class="px-4 py-12 text-center text-gray-500">加载中...</td></tr>
          {:else if refunds.length === 0}
            <tr><td colspan="8" class="px-4 py-12 text-center text-gray-500">暂无数据</td></tr>
          {:else}
            {#each refunds as refund}
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-4">
                  <p class="font-medium">{refund.member?.name}</p>
                  <p class="text-sm text-gray-500">{refund.member?.phone}</p>
                </td>
                <td class="px-4 py-4 font-medium text-red-600">¥{refund.amount.toFixed(2)}</td>
                <td class="px-4 py-4 max-w-xs truncate" title={refund.reason}>{refund.reason}</td>
                <td class="px-4 py-4">
                  <span class="badge {getStatusBadge(refund.status)}">{getStatusLabel(refund.status)}</span>
                </td>
                <td class="px-4 py-4">{refund.applicant?.name}</td>
                <td class="px-4 py-4">{refund.reviewer?.name || '-'}</td>
                <td class="px-4 py-4 text-sm text-gray-500">
                  {new Date(refund.created_at).toLocaleDateString('zh-CN')}
                </td>
                <td class="px-4 py-4">
                  <button on:click={() => openDetail(refund.id)} class="text-primary-600 hover:text-primary-700">
                    详情
                  </button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
