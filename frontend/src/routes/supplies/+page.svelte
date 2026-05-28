<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api, type Supply, type Camper } from '../../lib/api/client';
  import { auth } from '../../lib/stores/auth';
  import DualPanel from '../../lib/components/DualPanel.svelte';
  import StatusBadge from '../../lib/components/StatusBadge.svelte';

  let records: Supply[] = [];
  let campers: Camper[] = [];
  let selectedRecord: Supply | null = null;
  let loading = true;
  let submitting = false;
  let error: string | null = null;
  let showCreateModal = false;

  let newCamperId = '';
  let newItemName = '';
  let newQuantity = 1;
  let newReason = '';

  $: selectedId = selectedRecord?.id || null;
  $: canFulfill = auth.hasRole(['director', 'logistics']);
  $: canCreate = auth.hasRole(['director', 'logistics']);
  $: pendingRecords = records.filter(r => r.status === 'pending');
  $: fulfilledRecords = records.filter(r => r.status === 'fulfilled');

  let filter = 'all';

  const filterOptions = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'fulfilled', label: '已完成' },
  ];

  $: filteredRecords = filter === 'all' ? records :
    filter === 'pending' ? pendingRecords : fulfilledRecords;

  function getFilterCount(key: string): number {
    switch (key) {
      case 'all': return records.length;
      case 'pending': return pendingRecords.length;
      case 'fulfilled': return fulfilledRecords.length;
      default: return 0;
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN');
  }

  function getCamperName(record: Supply): string {
    return record.camper?.name || '-';
  }

  async function loadRecords() {
    try {
      records = await api.getSupplies();
    } catch (err) {
      error = err instanceof Error ? err.message : '加载失败';
    } finally {
      loading = false;
    }
  }

  async function loadCampers() {
    try {
      campers = await api.getCampers();
    } catch (err) {
      console.error('加载营员列表失败:', err);
    }
  }

  function selectRecord(record: Supply) {
    selectedRecord = record;
  }

  async function handleFulfill() {
    if (!selectedRecord || !canFulfill) return;
    if (!confirm('确定要标记该物资申请为已完成吗？')) return;
    try {
      const updated = await api.fulfillSupply(selectedRecord.id);
      records = records.map(r => r.id === updated.id ? updated : r);
      selectedRecord = updated;
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handleCreate() {
    if (!newCamperId || !newItemName || newQuantity <= 0 || !newReason) return;
    submitting = true;
    try {
      await api.createSupply({
        camper_id: newCamperId,
        item_name: newItemName,
        quantity: newQuantity,
        reason: newReason,
      });
      await loadRecords();
      showCreateModal = false;
      resetCreateForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '申请失败');
    } finally {
      submitting = false;
    }
  }

  function resetCreateForm() {
    newCamperId = '';
    newItemName = '';
    newQuantity = 1;
    newReason = '';
  }

  const statusToFilterMap: Record<string, string> = {
    pending: 'pending',
    fulfilled: 'fulfilled',
  };

  onMount(async () => {
    await loadRecords();
    loadCampers();
    const params = $page.url.searchParams;
    const status = params.get('status');
    const id = params.get('id');
    if (status && statusToFilterMap[status]) {
      filter = statusToFilterMap[status];
    }
    if (id && records.length > 0) {
      const target = records.find(r => r.id === id);
      if (target) selectedRecord = target;
    }
  });
</script>

<div class="h-[calc(100vh-4rem)] -mx-8 -my-8">
  <DualPanel
    leftTitle="物资申请"
    selectedId={selectedId}
  >
    <div slot="list">
      <div class="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div class="flex items-center justify-between gap-4">
          <div class="flex gap-2">
            {#each filterOptions as option}
              <button
                on:click={() => filter = option.key}
                class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors {filter === option.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}"
              >
                {option.label}
                <span class="ml-1">{getFilterCount(option.key)}</span>
              </button>
            {/each}
          </div>
          {#if canCreate}
            <button
              on:click={() => showCreateModal = true}
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              + 申请物资
            </button>
          {/if}
        </div>
      </div>

      {#if loading}
        <div class="flex items-center justify-center py-12">
          <div class="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      {:else if error}
        <div class="p-4 text-red-600 text-sm">{error}</div>
      {:else if filteredRecords.length === 0}
        <div class="text-center py-12 text-gray-400">
          <p class="text-3xl mb-2">📦</p>
          <p class="text-sm">暂无物资申请</p>
        </div>
      {:else}
        <div class="divide-y divide-gray-100">
          {#each filteredRecords as record}
            <button
              on:click={() => selectRecord(record)}
              class="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors {selectedRecord?.id === record.id ? 'bg-blue-50' : ''}"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900 truncate">{record.item_name}</span>
                    <StatusBadge status={record.status} />
                  </div>
                  <p class="text-sm text-gray-500 mt-1">
                    {record.quantity} · 申请人：{record.requester?.display_name || record.requested_by}
                  </p>
                  <p class="text-xs text-gray-400 mt-1 line-clamp-1">{record.reason}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-xs text-gray-400">{getCamperName(record)}</p>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div slot="detail">
      {#if selectedRecord}
        <div class="h-full flex flex-col">
          <div class="px-6 py-4 border-b border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900">{selectedRecord.item_name}</h2>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-sm text-gray-500">{selectedRecord.quantity}</span>
                  <StatusBadge status={selectedRecord.status} />
                </div>
              </div>
              {#if canFulfill && selectedRecord.status === 'pending'}
                <button
                  on:click={handleFulfill}
                  class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  ✓ 标记完成
                </button>
              {/if}
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">申请人</p>
                  <p class="font-medium text-gray-900">{selectedRecord.requester?.display_name || selectedRecord.requested_by}</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">相关营员</p>
                  <p class="font-medium text-gray-900">{getCamperName(selectedRecord)}</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">数量</p>
                  <p class="font-medium text-gray-900">{selectedRecord.quantity}</p>
                </div>
              </div>

              <div class="bg-white p-4 rounded-lg border border-gray-100">
                <p class="text-xs text-gray-500 mb-1">申请理由</p>
                <p class="font-medium text-gray-900">{selectedRecord.reason}</p>
              </div>

              {#if selectedRecord.status === 'fulfilled'}
                <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p class="text-sm font-medium text-green-800">已完成</p>
                  <p class="text-xs text-green-600 mt-1">
                    完成人：{selectedRecord.fulfiller?.display_name || selectedRecord.fulfilled_by || '-'}
                  </p>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </DualPanel>
</div>

{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click|self={() => { showCreateModal = false; resetCreateForm(); }}>
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">申请物资</h3>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择营员 <span class="text-red-500">*</span></label>
          <select
            bind:value={newCamperId}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择营员</option>
            {#each campers as camper}
              <option value={camper.id}>{camper.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">物品名称 <span class="text-red-500">*</span></label>
          <input
            type="text"
            bind:value={newItemName}
            placeholder="请输入物品名称"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">数量 <span class="text-red-500">*</span></label>
          <input
            type="number"
            bind:value={newQuantity}
            min="1"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">申请理由 <span class="text-red-500">*</span></label>
          <textarea
            bind:value={newReason}
            rows="3"
            placeholder="请输入申请理由"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            on:click={() => { showCreateModal = false; resetCreateForm(); }}
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            on:click={handleCreate}
            disabled={!newCamperId || !newItemName || newQuantity <= 0 || !newReason || submitting}
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {#if submitting}
              <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            {/if}
            {submitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
