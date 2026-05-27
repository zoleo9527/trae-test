<script>
  import { onMount } from 'svelte';
  import { activityAPI, memberAPI } from '$lib/api';
  import { user } from '../../stores/user';
  import { Plus, Edit2, RefreshCw, Megaphone, Users, Eye, ChevronRight, Send } from 'lucide-svelte';

  let activities = [];
  let members = [];
  let loading = true;
  let showForm = false;
  let showPush = false;
  let editing = null;
  let pushingActivity = null;
  let pushedMemberIds = [];
  let selectedMembers = new Set();
  let pushChannel = 'sms';

  const levelMap = { normal: 0, silver: 1, gold: 2, platinum: 3 };

  function isPushed(memberId) {
    return pushedMemberIds.includes(memberId);
  }

  $: eligibleMembers = members.filter(m => {
    if (!pushingActivity) return false;
    if (isPushed(m.id)) return false;

    const memberLevel = levelMap[m.level] ?? 0;
    const minLevel = levelMap[pushingActivity.min_level] ?? 0;
    if (memberLevel < minLevel) return false;

    if (!pushingActivity.target_tags) return true;
    const targetTags = pushingActivity.target_tags.split(',').map(t => t.trim()).filter(t => t);
    if (targetTags.length === 0) return true;

    const memberTags = m.tags || '';
    return targetTags.some(tag => memberTags.includes(tag));
  });

  $: ineligibleMembers = members.filter(m => {
    if (!pushingActivity) return false;
    if (isPushed(m.id)) return false;
    return !eligibleMembers.includes(m);
  });

  $: pushedMembersList = members.filter(m => isPushed(m.id));
  let form = {
    name: '',
    type: 'coupon',
    description: '',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    target_tags: '',
    min_level: 'normal',
    discount: 1,
    coupon_amount: 0,
  };

  let currentUser = null;
  user.subscribe((v) => (currentUser = v));

  async function loadData() {
    loading = true;
    try {
      const [actRes, memRes] = await Promise.all([
        activityAPI.list({}),
        memberAPI.list({ page_size: 100 }),
      ]);
      activities = actRes.items;
      members = memRes.items;
    } finally {
      loading = false;
    }
  }

  function openCreate() {
    editing = null;
    form = {
      name: '',
      type: 'coupon',
      description: '',
      start_time: new Date().toISOString().slice(0, 16),
      end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      target_tags: '',
      min_level: 'normal',
      discount: 1,
      coupon_amount: 0,
    };
    showForm = true;
  }

  function openEdit(act) {
    editing = act;
    form = { ...act, start_time: new Date(act.start_time).toISOString().slice(0, 16), end_time: new Date(act.end_time).toISOString().slice(0, 16) };
    showForm = true;
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await activityAPI.update(editing.id, form);
      } else {
        await activityAPI.create(form);
      }
      showForm = false;
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function openPush(act) {
    pushingActivity = act;
    selectedMembers.clear();
    pushedMemberIds = [];

    try {
      const stats = await activityAPI.stats(act.id);
      if (stats.member_ids) {
        pushedMemberIds = stats.member_ids;
      }
    } catch (e) {
      console.error('加载推送记录失败', e);
    }

    showPush = true;
  }

  function toggleMember(id) {
    if (selectedMembers.has(id)) {
      selectedMembers.delete(id);
    } else {
      selectedMembers.add(id);
    }
    selectedMembers = new Set(selectedMembers);
  }

  async function handlePush() {
    if (selectedMembers.size === 0) return;
    try {
      const res = await activityAPI.push(pushingActivity.id, {
        member_ids: Array.from(selectedMembers),
        channel: pushChannel,
      });
      const skipped = res.skipped_count || 0;
      const msg = `推送完成：成功 ${res.count} 位${skipped > 0 ? `，跳过 ${skipped} 位` : ''}`;
      alert(msg);
      showPush = false;
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  function getTypeLabel(type) {
    const labels = { coupon: '优惠券', discount: '折扣活动', gift: '赠品活动' };
    return labels[type] || type;
  }

  function getStatusBadge(status) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      ended: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  function getStatusLabel(status) {
    const labels = { pending: '待推送', active: '进行中', ended: '已结束' };
    return labels[status] || status;
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <button on:click={loadData} class="btn-secondary flex items-center gap-2">
      <RefreshCw class="w-4 h-4" />
      刷新
    </button>
    {#if currentUser?.role === 'admin'}
      <button on:click={openCreate} class="btn-primary flex items-center gap-2">
        <Plus class="w-4 h-4" />
        新建活动
      </button>
    {/if}
  </div>

  {#if showForm}
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-6">{editing ? '编辑' : '新建'}活动</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">活动名称</label>
          <input type="text" bind:value={form.name} class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">活动类型</label>
          <select bind:value={form.type} class="input">
            <option value="coupon">优惠券</option>
            <option value="discount">折扣活动</option>
            <option value="gift">赠品活动</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">开始时间</label>
          <input type="datetime-local" bind:value={form.start_time} class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">结束时间</label>
          <input type="datetime-local" bind:value={form.end_time} class="input" />
        </div>
        {#if form.type === 'discount'}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">折扣（0.1-1）</label>
            <input type="number" bind:value={form.discount} step="0.1" min="0.1" max="1" class="input" />
          </div>
        {:else}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">优惠券金额</label>
            <input type="number" bind:value={form.coupon_amount} step="1" class="input" />
          </div>
        {/if}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">最低会员等级</label>
          <select bind:value={form.min_level} class="input">
            <option value="normal">普通</option>
            <option value="silver">银卡</option>
            <option value="gold">金卡</option>
            <option value="platinum">铂金</option>
          </select>
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">活动描述</label>
        <textarea bind:value={form.description} class="input" rows="3" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">目标标签（逗号分隔）</label>
        <input type="text" bind:value={form.target_tags} class="input" placeholder="如：新用户,高消费" />
      </div>
      <div class="flex gap-3">
        <button on:click={handleSubmit} class="btn-primary">保存</button>
        <button on:click={() => (showForm = false)} class="btn-secondary">取消</button>
      </div>
    </div>
  {/if}

  {#if showPush && pushingActivity}
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4">推送活动 - {pushingActivity.name}</h3>

      <div class="mb-4 p-4 bg-gray-50 rounded-lg">
        <p class="text-sm text-gray-600">
          <span class="font-medium">推送规则：</span>
          最低等级 <span class="text-primary-600 font-medium">{pushingActivity.min_level}</span>
          {#if pushingActivity.target_tags}
            ，目标标签 <span class="text-primary-600 font-medium">{pushingActivity.target_tags}</span>
          {/if}
        </p>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">推送渠道</label>
        <select bind:value={pushChannel} class="input w-48">
          <option value="sms">短信</option>
          <option value="push">APP推送</option>
          <option value="wechat">微信</option>
        </select>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          选择推送会员（已选 {selectedMembers.size} 人，符合条件 {eligibleMembers.length} 人）
        </label>

        <div class="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
          {#each eligibleMembers as member}
            <label class="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
              <input type="checkbox" checked={selectedMembers.has(member.id)} on:change={() => toggleMember(member.id)} class="w-4 h-4" />
              <div class="flex-1">
                <p class="font-medium">{member.name}</p>
                <p class="text-sm text-gray-500">{member.phone} · {member.tags || '无标签'}</p>
              </div>
              <span class="badge bg-green-100 text-green-800 text-xs">符合条件</span>
            </label>
          {/each}

          {#each ineligibleMembers as member}
            <div class="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-100 last:border-b-0 opacity-60">
              <input type="checkbox" disabled class="w-4 h-4" />
              <div class="flex-1">
                <p class="font-medium">{member.name}</p>
                <p class="text-sm text-gray-500">{member.phone} · {member.tags || '无标签'}</p>
              </div>
              <span class="badge bg-red-100 text-red-800 text-xs">不符合条件</span>
            </div>
          {/each}

          {#if pushedMembersList.length > 0}
            <div class="p-3 bg-blue-50 border-b border-gray-100 text-sm text-blue-800 font-medium">
              已推送会员 ({pushedMembersList.length} 人)
            </div>
            {#each pushedMembersList as member}
              <div class="flex items-center gap-3 p-3 bg-blue-50 border-b border-gray-100 last:border-b-0">
                <span class="w-4 h-4 flex items-center justify-center text-blue-500">✓</span>
                <div class="flex-1">
                  <p class="font-medium text-gray-600">{member.name}</p>
                  <p class="text-sm text-gray-400">{member.phone}</p>
                </div>
                <span class="badge bg-blue-100 text-blue-800 text-xs">已推送</span>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <div class="flex gap-3">
        <button on:click={() => eligibleMembers.forEach(m => selectedMembers.add(m.id)) || (selectedMembers = new Set(selectedMembers))} class="btn-secondary">
          全选符合条件
        </button>
        <button on:click={handlePush} disabled={selectedMembers.size === 0} class="btn-primary flex items-center gap-2">
          <Send class="w-4 h-4" />
          确认推送
        </button>
        <button on:click={() => (showPush = false)} class="btn-secondary">取消</button>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#if loading}
      {#each Array(6) as _}
        <div class="card p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div class="flex gap-4">
            <div class="h-4 bg-gray-200 rounded w-16"></div>
            <div class="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      {/each}
    {:else}
      {#each activities as act}
        <div class="card p-6 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-3">
            <div>
              <span class="badge {getStatusBadge(act.status)} mb-2">{getStatusLabel(act.status)}</span>
              <h3 class="font-semibold text-gray-900">{act.name}</h3>
            </div>
            <div class="flex gap-1">
              {#if currentUser?.role === 'admin'}
                <button on:click={() => openEdit(act)} class="p-1.5 hover:bg-gray-100 rounded">
                  <Edit2 class="w-4 h-4 text-gray-400" />
                </button>
              {/if}
            </div>
          </div>
          <p class="text-sm text-gray-500 mb-4 line-clamp-2">{act.description}</p>
          <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span class="flex items-center gap-1">
              <Megaphone class="w-4 h-4" />
              {getTypeLabel(act.type)}
            </span>
            {#if act.coupon_amount > 0}
              <span class="text-primary-600 font-medium">¥{act.coupon_amount}</span>
            {/if}
            {#if act.discount < 1}
              <span class="text-primary-600 font-medium">{(act.discount * 10).toFixed(1)}折</span>
            {/if}
          </div>
          <div class="text-xs text-gray-400 mb-4">
            {new Date(act.start_time).toLocaleDateString('zh-CN')} - {new Date(act.end_time).toLocaleDateString('zh-CN')}
          </div>
          {#if currentUser?.role === 'admin' && act.status === 'pending'}
            <button on:click={() => openPush(act)} class="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2">
              <Send class="w-4 h-4" />
              推送活动
            </button>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>
