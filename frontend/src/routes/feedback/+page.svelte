<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api, type Feedback, type Camper } from '../../lib/api/client';
  import { auth } from '../../lib/stores/auth';
  import DualPanel from '../../lib/components/DualPanel.svelte';
  import StatusBadge from '../../lib/components/StatusBadge.svelte';

  let records: Feedback[] = [];
  let campers: Camper[] = [];
  let selectedRecord: Feedback | null = null;
  let loading = true;
  let submitting = false;
  let error: string | null = null;
  let responseText = '';
  let showCompleteModal = false;
  let showCreateModal = false;

  let newCamperId = '';
  let newType = '家长投诉';
  let newContent = '';
  let newParentResponse = '';

  $: selectedId = selectedRecord?.id || null;
  $: canHandle = auth.hasRole(['director', 'teacher']);
  $: canCreate = auth.hasRole(['director', 'teacher']);
  $: pendingRecords = records.filter(r => r.status === 'pending');
  $: completedRecords = records.filter(r => r.status === 'completed');

  let filter = 'all';

  const filterOptions = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'completed', label: '已完成' },
  ];

  const typeOptions = ['家长投诉', '建议', '咨询', '表扬', '其他'];

  $: filteredRecords = filter === 'all' ? records :
    filter === 'pending' ? pendingRecords : completedRecords;

  function getFilterCount(key: string): number {
    switch (key) {
      case 'all': return records.length;
      case 'pending': return pendingRecords.length;
      case 'completed': return completedRecords.length;
      default: return 0;
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN');
  }

  function getStatus(record: Feedback): string {
    return record.status;
  }

  function getCamperName(record: Feedback): string {
    return record.camper?.name || '未知';
  }

  async function loadRecords() {
    try {
      records = await api.getFeedback();
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

  function selectRecord(record: Feedback) {
    selectedRecord = record;
  }

  async function handleComplete() {
    if (!selectedRecord || !canHandle || !responseText.trim()) return;
    try {
      const updated = await api.completeFeedback(selectedRecord.id, responseText);
      records = records.map(r => r.id === updated.id ? updated : r);
      selectedRecord = updated;
      showCompleteModal = false;
      responseText = '';
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handleCreate() {
    if (!newCamperId || !newType || !newContent) return;
    submitting = true;
    try {
      await api.createFeedback({
        camper_id: newCamperId,
        type: newType,
        content: newContent,
        parent_response: newParentResponse || undefined,
      });
      await loadRecords();
      showCreateModal = false;
      resetCreateForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败');
    } finally {
      submitting = false;
    }
  }

  function resetCreateForm() {
    newCamperId = '';
    newType = '家长投诉';
    newContent = '';
    newParentResponse = '';
  }

  const statusToFilterMap: Record<string, string> = {
    pending: 'pending',
    completed: 'completed',
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
    leftTitle="家长回访"
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
              + 新增回访
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
          <p class="text-3xl mb-2">💬</p>
          <p class="text-sm">暂无家长回访</p>
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
                    <span class="font-medium text-gray-900 truncate">{getCamperName(record)} 家长</span>
                    <StatusBadge status={getStatus(record)} />
                  </div>
                  <p class="text-sm text-gray-500 mt-1">{record.type}</p>
                  <p class="text-xs text-gray-400 mt-1 line-clamp-1">{record.content}</p>
                </div>
                <div class="text-right flex-shrink-0">
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
                <h2 class="text-xl font-bold text-gray-900">{getCamperName(selectedRecord)} 家长</h2>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-sm text-gray-500">{selectedRecord.type}</span>
                  <StatusBadge status={getStatus(selectedRecord)} />
                </div>
              </div>
              {#if canHandle && selectedRecord.status === 'pending'}
                <button
                  on:click={() => showCompleteModal = true}
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
                  <p class="text-xs text-gray-500 mb-1">反馈类型</p>
                  <p class="font-medium text-gray-900">{selectedRecord.type}</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">负责人</p>
                  <p class="font-medium text-gray-900">{selectedRecord.assignee?.display_name || selectedRecord.assignee_id || '-'}</p>
                </div>
              </div>

              <div class="bg-white p-4 rounded-lg border border-gray-100">
                <p class="text-xs text-gray-500 mb-1">反馈内容</p>
                <p class="font-medium text-gray-900 whitespace-pre-wrap">{selectedRecord.content}</p>
              </div>

              {#if selectedRecord.parent_response}
                <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p class="text-sm font-medium text-green-800">家长回复</p>
                  <p class="text-sm text-green-700 mt-2 whitespace-pre-wrap">{selectedRecord.parent_response}</p>
                </div>
              {/if}

              {#if selectedRecord.status === 'completed'}
                <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p class="text-sm font-medium text-green-800">已完成</p>
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
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">新增家长回访</h3>
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
          <label class="block text-sm font-medium text-gray-700 mb-2">类型 <span class="text-red-500">*</span></label>
          <select
            bind:value={newType}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {#each typeOptions as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">反馈内容 <span class="text-red-500">*</span></label>
          <textarea
            bind:value={newContent}
            rows="4"
            placeholder="请输入反馈内容"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">家长回复</label>
          <textarea
            bind:value={newParentResponse}
            rows="3"
            placeholder="请输入家长回复（可选）"
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
            disabled={!newCamperId || !newType || !newContent || submitting}
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

{#if showCompleteModal && selectedRecord}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click|self={() => { showCompleteModal = false; responseText = ''; }}>
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">完成家长回访</h3>
      </div>
      <div class="p-6">
        <p class="text-sm text-gray-600 mb-4">请填写对 {getCamperName(selectedRecord)} 家长的回复内容：</p>
        <textarea
          bind:value={responseText}
          rows="4"
          placeholder="请输入回复内容..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <div class="flex justify-end gap-3 mt-4">
          <button
            on:click={() => { showCompleteModal = false; responseText = ''; }}
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            on:click={handleComplete}
            disabled={!responseText.trim()}
            class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            确认完成
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
