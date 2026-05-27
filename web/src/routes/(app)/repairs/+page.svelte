<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { repairAPI, deviceAPI, siteAPI } from '$lib/api';
  import { user } from '../../stores/user';
  import { Plus, RefreshCw, Filter, Wrench, MapPin, AlertTriangle, ChevronRight, TrendingUp, Clock } from 'lucide-svelte';

  let repairs = [];
  let devices = [];
  let sites = [];
  let loading = true;
  let showForm = false;
  let showDetail = null;
  let detailLogs = [];
  let statusFilter = '';
  let priorityFilter = '';
  let form = { device_id: '', title: '', description: '', priority: 'medium' };

  let currentUser = null;
  user.subscribe((v) => (currentUser = v));

  async function loadData() {
    loading = true;
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const [repairsRes, devicesRes, sitesRes] = await Promise.all([
        repairAPI.list(params),
        deviceAPI.list({}),
        siteAPI.list(),
      ]);
      repairs = repairsRes.items;
      devices = devicesRes;
      sites = sitesRes;
    } finally {
      loading = false;
    }
  }

  async function handleCreate() {
    try {
      await repairAPI.create(form);
      showForm = false;
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function openDetail(id) {
    try {
      const [detail, logs] = await Promise.all([
        repairAPI.detail(id),
        repairAPI.logs(id),
      ]);
      showDetail = detail;
      detailLogs = logs;
    } catch (e) {
      alert(e.message);
    }
  }

  async function updateStatus(status, remark = '') {
    try {
      await repairAPI.updateStatus(showDetail.id, { status, remark });
      openDetail(showDetail.id);
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function escalate() {
    try {
      await repairAPI.escalate(showDetail.id);
      openDetail(showDetail.id);
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  function getPriorityBadge(priority) {
    const badges = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return badges[priority] || 'bg-gray-100 text-gray-800';
  }

  function getPriorityLabel(priority) {
    const labels = { low: '低', medium: '中', high: '高', urgent: '紧急' };
    return labels[priority] || priority;
  }

  function getStatusBadge(status) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      escalated: 'bg-orange-100 text-orange-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  function getStatusLabel(status) {
    const labels = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      rejected: '已驳回',
      escalated: '已升级',
    };
    return labels[status] || status;
  }

  function getLevelLabel(level) {
    return `L${level}`;
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
        <option value="pending">待处理</option>
        <option value="processing">处理中</option>
        <option value="resolved">已解决</option>
        <option value="rejected">已驳回</option>
        <option value="escalated">已升级</option>
      </select>

      <select bind:value={priorityFilter} on:change={loadData} class="input w-32">
        <option value="">全部优先级</option>
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
        <option value="urgent">紧急</option>
      </select>

      <button on:click={loadData} class="btn-secondary flex items-center gap-2">
        <RefreshCw class="w-4 h-4" />
        刷新
      </button>

      <button on:click={() => (showForm = true)} class="btn-primary flex items-center gap-2 ml-auto">
        <Plus class="w-4 h-4" />
        新增报修
      </button>
    </div>
  </div>

  {#if showForm}
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4">新增报修单</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择设备</label>
          <select bind:value={form.device_id} class="input">
            <option value="">请选择设备</option>
            {#each devices as device}
              <option value={device.id}>{device.device_no} - {device.name} ({device.site?.name})</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">优先级</label>
          <select bind:value={form.priority} class="input">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="urgent">紧急</option>
          </select>
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">故障标题</label>
        <input type="text" bind:value={form.title} class="input" placeholder="简要描述故障" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">详细描述</label>
        <textarea bind:value={form.description} class="input" rows="4" placeholder="详细描述故障现象..." />
      </div>
      <div class="flex gap-3">
        <button on:click={handleCreate} class="btn-primary">提交报修</button>
        <button on:click={() => (showForm = false)} class="btn-secondary">取消</button>
      </div>
    </div>
  {/if}

  {#if showDetail}
    <div class="card p-6">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h3 class="text-lg font-semibold">{showDetail.title}</h3>
          <div class="flex items-center gap-2 mt-2">
            <span class="badge {getStatusBadge(showDetail.status)}">{getStatusLabel(showDetail.status)}</span>
            <span class="badge {getPriorityBadge(showDetail.priority)}">{getPriorityLabel(showDetail.priority)}</span>
            <span class="badge bg-purple-100 text-purple-800">{getLevelLabel(showDetail.level)}</span>
          </div>
        </div>
        <button on:click={() => (showDetail = null)} class="text-gray-400 hover:text-gray-600">×</button>
      </div>

      <div class="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p class="text-sm text-gray-500 mb-1">设备信息</p>
          <p class="font-medium">{showDetail.device?.device_no} - {showDetail.device?.name}</p>
          <p class="text-sm text-gray-500">{showDetail.device?.site?.name}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">报修人</p>
          <p class="font-medium">{showDetail.reporter?.name}</p>
          <p class="text-sm text-gray-500">{new Date(showDetail.created_at).toLocaleString('zh-CN')}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">处理人</p>
          <p class="font-medium">{showDetail.handler?.name || '未分配'}</p>
        </div>
      </div>

      <div class="mb-6">
        <p class="text-sm text-gray-500 mb-2">故障描述</p>
        <p class="text-gray-700">{showDetail.description}</p>
      </div>

      {#if currentUser?.role !== 'service'}
        <div class="flex gap-3 mb-6">
          {#if showDetail.status === 'pending'}
            <button on:click={() => updateStatus('processing', '开始处理')} class="btn-primary">开始处理</button>
          {/if}
          {#if showDetail.status === 'processing'}
            <button on:click={() => updateStatus('resolved', '问题已解决')} class="btn-success">标记解决</button>
            <button on:click={() => updateStatus('rejected', '无法处理')} class="btn-danger">驳回</button>
            <button on:click={escalate} class="btn-secondary">升级处理</button>
          {/if}
        </div>
      {/if}

      <div>
        <h4 class="font-medium mb-4">处理记录</h4>
        <div class="space-y-4">
          {#each detailLogs as log}
            <div class="flex gap-4">
              <div class="relative">
                <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-xs font-medium text-primary-700">{log.operator?.name?.charAt(0) || 'U'}</span>
                </div>
                <div class="absolute top-8 bottom-0 left-1/2 w-px bg-gray-200 -translate-x-1/2"></div>
              </div>
              <div class="flex-1 pb-4">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{log.operator?.name}</span>
                  <span class="text-gray-500">
                    {log.action === 'create' ? '创建报修单' : log.action === 'process' ? '开始处理' : log.action === 'update_status' ? '更新状态' : log.action === 'escalate' ? '升级' : log.action}
                  </span>
                  {#if log.new_status}
                    <span class="badge {getStatusBadge(log.new_status)}">{getStatusLabel(log.new_status)}</span>
                  {/if}
                </div>
                {#if log.remark}
                  <p class="text-sm text-gray-600 mt-1">{log.remark}</p>
                {/if}
                <p class="text-xs text-gray-400 mt-1">{new Date(log.created_at).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">优先级</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">等级</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">报修人</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#if loading}
            <tr><td colspan="8" class="px-4 py-12 text-center text-gray-500">加载中...</td></tr>
          {:else if repairs.length === 0}
            <tr><td colspan="8" class="px-4 py-12 text-center text-gray-500">暂无数据</td></tr>
          {:else}
            {#each repairs as repair}
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-4">
                  <p class="font-medium">{repair.device?.device_no}</p>
                  <p class="text-sm text-gray-500">{repair.device?.name}</p>
                </td>
                <td class="px-4 py-4">{repair.title}</td>
                <td class="px-4 py-4">
                  <span class="badge {getStatusBadge(repair.status)}">{getStatusLabel(repair.status)}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="badge {getPriorityBadge(repair.priority)}">{getPriorityLabel(repair.priority)}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="badge bg-purple-100 text-purple-800">{getLevelLabel(repair.level)}</span>
                </td>
                <td class="px-4 py-4">{repair.reporter?.name}</td>
                <td class="px-4 py-4 text-sm text-gray-500">
                  {new Date(repair.created_at).toLocaleDateString('zh-CN')}
                </td>
                <td class="px-4 py-4">
                  <button on:click={() => openDetail(repair.id)} class="text-primary-600 hover:text-primary-700">
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
