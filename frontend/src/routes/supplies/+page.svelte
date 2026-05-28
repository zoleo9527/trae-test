<script lang="ts">
  import { onMount } from 'svelte';
  import { api, type Supply } from '../../lib/api/client';
  import { auth } from '../../lib/stores/auth';
  import DualPanel from '../../lib/components/DualPanel.svelte';
  import StatusBadge from '../../lib/components/StatusBadge.svelte';

  let records: Supply[] = [];
  let selectedRecord: Supply | null = null;
  let loading = true;
  let error: string | null = null;

  $: selectedId = selectedRecord?.id || null;
  $: canFulfill = auth.hasRole(['director', 'logistics']);
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

  onMount(() => {
    loadRecords();
  });
</script>

<div class="h-[calc(100vh-4rem)] -mx-8 -my-8">
  <DualPanel
    leftTitle="物资申请"
    selectedId={selectedId}
  >
    <div slot="list">
      <div class="px-6 py-3 border-b border-gray-100 bg-gray-50">
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
